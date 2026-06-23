# LeaseFlip — Technical Architecture

## 1. System overview

LeaseFlip is a two-sided marketplace built as a single Next.js 15 application
backed by Supabase. There is no separate backend service in the MVP — Next.js
Server Components, Server Actions, and Route Handlers talk directly to Postgres
through Supabase, and **Row Level Security (RLS) is the authorization boundary**.

```
                         ┌──────────────────────────────────────────┐
                         │                Vercel                    │
                         │  ┌────────────────────────────────────┐  │
   Browser  ───────────► │  │           Next.js 15               │  │
   (React 19)            │  │  Server Components / Server Actions │  │
                         │  │  Route Handlers (/api/*)            │  │
                         │  │  middleware.ts (session + guards)   │  │
                         │  └───────────────┬────────────────────┘  │
                         └──────────────────┼───────────────────────┘
                                            │  @supabase/ssr (cookies)
                                            ▼
                         ┌──────────────────────────────────────────┐
                         │                Supabase                  │
                         │  Auth │ Postgres (+RLS) │ Storage │ Realtime │
                         └──────────────────────────────────────────┘
```

### Why this shape

- **One deployable.** Faster iteration for an MVP; no service mesh to operate.
- **RLS as the source of truth for authz.** Every data path — server action,
  route handler, or client subscription — is constrained by the same policies,
  so we cannot accidentally leak data by forgetting a check in app code.
- **Supabase Realtime** powers messaging without us running a socket server.

---

## 2. Request lifecycle & auth

1. `middleware.ts` runs on every request, refreshes the Supabase session cookie
   via `@supabase/ssr`, and redirects unauthenticated users away from protected
   route groups.
2. Server Components create a **server** Supabase client (reads cookies) to fetch
   data already scoped by RLS to the current user.
3. Mutations go through **Server Actions** (forms) or **Route Handlers** (`/api`)
   that also use the server client — never the service-role key, except in the
   explicitly isolated admin/service path.
4. The browser uses a **client** Supabase instance only for Realtime
   subscriptions (messages, notifications) and Storage uploads.

---

## 3. Data model

Ten tables. `users` is Supabase's `auth.users`; everything app-owned lives in
`public`.

```
auth.users ─1:1─ profiles
                   │ 1:N
                   ├──────────────► properties ─1:N─ property_photos
                   │                    │ 1:N
                   │                    └────────► proposals ──1:1── agreements ─1:N─ payments
                   │ (operator_id)                   ▲
                   └───────────────────────────────┘
profiles ─1:N─ messages          (threaded by proposal_id)
profiles ─1:N─ notifications
profiles ─1:N─ audit_logs
```

### 3.1 `profiles`
Mirror of `auth.users`, created automatically by a trigger on signup. Holds the
**role** (`owner` | `operator` | `admin`), display name, contact info, and
operator-specific reputation fields.

| column         | type        | notes                                   |
| -------------- | ----------- | --------------------------------------- |
| id             | uuid PK     | = auth.users.id                         |
| role           | user_role   | enum; default `owner`                   |
| full_name      | text        |                                         |
| email          | text        | denormalized for convenience            |
| phone          | text        |                                         |
| avatar_url     | text        |                                         |
| company_name   | text        | operators                               |
| bio            | text        |                                         |
| is_verified    | boolean     | admin-set trust flag                    |
| created_at     | timestamptz |                                         |
| updated_at     | timestamptz |                                         |

### 3.2 `properties`
A listing created by an owner.

| column              | type            | notes                                |
| ------------------- | --------------- | ------------------------------------ |
| id                  | uuid PK         |                                      |
| owner_id            | uuid FK profiles| listing owner                        |
| title               | text            |                                      |
| description         | text            |                                      |
| property_type       | property_type   | enum: single_family, condo, …        |
| status              | listing_status  | draft, active, under_offer, leased, archived |
| address_line1/2     | text            |                                      |
| city, state, postal | text            |                                      |
| country             | text            |                                      |
| latitude, longitude | numeric         | for map/geo filtering (future)       |
| bedrooms, bathrooms | numeric         |                                      |
| square_feet         | integer         |                                      |
| monthly_mortgage    | numeric(12,2)   | owner's cost                         |
| estimated_market_rent | numeric(12,2) | owner's estimate                     |
| desired_monthly_rent | numeric(12,2)  | owner's guaranteed-income ask        |
| lease_restrictions  | text            | e.g. "no short-term rentals"         |
| min_lease_months    | integer         |                                      |
| available_from      | date            |                                      |
| created_at/updated_at | timestamptz   |                                      |

### 3.3 `property_photos`
| id, property_id FK, storage_path, public_url, position (int), is_cover (bool), created_at |

### 3.4 `proposals`
An operator's offer on a property.

| column            | type            | notes                                  |
| ----------------- | --------------- | -------------------------------------- |
| id                | uuid PK         |                                        |
| property_id       | uuid FK         |                                        |
| operator_id       | uuid FK profiles|                                        |
| owner_id          | uuid FK profiles| denormalized for RLS + queries         |
| status            | proposal_status | pending, countered, accepted, rejected, withdrawn |
| offered_monthly_rent | numeric(12,2)| guaranteed amount to owner             |
| lease_term_months | integer         |                                        |
| security_deposit  | numeric(12,2)   |                                        |
| intended_use      | text            | e.g. "mid-term corporate rentals"      |
| estimated_expenses | numeric(12,2)  | operator's own cost estimate           |
| message           | text            | cover note                             |
| created_at/updated_at | timestamptz |                                        |

### 3.5 `agreements`
Generated from an accepted proposal.

| id, proposal_id FK (unique), property_id, owner_id, operator_id,
  status (draft, sent, owner_signed, operator_signed, active, terminated),
  monthly_rent, lease_term_months, start_date, end_date, terms (text/jsonb),
  owner_signed_at, operator_signed_at, document_url, created_at, updated_at |

### 3.6 `payments`
Tracked obligations under an active agreement.

| id, agreement_id FK, due_date, amount, status (scheduled, paid, late, missed),
  paid_at, method, reference, created_at, updated_at |

### 3.7 `messages`
Secure owner↔operator chat, threaded by proposal.

| id, proposal_id FK, sender_id FK profiles, body (text), read_at, created_at |

### 3.8 `notifications`
| id, user_id FK, type, title, body, link, is_read, created_at |

### 3.9 `audit_logs`
| id, actor_id FK, action, entity_type, entity_id, metadata (jsonb), created_at |

### 3.10 Enums
`user_role`, `property_type`, `listing_status`, `proposal_status`,
`agreement_status`, `payment_status`, `notification_type`. Defined in
`migrations/0001_init.sql`.

---

## 4. RBAC design

Three roles, stored on `profiles.role` **and** mirrored into the JWT via a custom
access-token hook so RLS can read `auth.jwt() ->> 'user_role'` without an extra
join.

| Capability                              | owner | operator | admin |
| --------------------------------------- | :---: | :------: | :---: |
| Create/edit own property                |  ✅   |    —     |  ✅   |
| Browse active listings                  |  ✅   |   ✅     |  ✅   |
| Submit proposal                         |  —    |   ✅     |  ✅   |
| View proposals on own property          |  ✅   |    —     |  ✅   |
| View own submitted proposals            |  —    |   ✅     |  ✅   |
| Accept / counter / reject proposal      |  ✅   |    —     |  ✅   |
| Withdraw proposal                       |  —    |   ✅     |  ✅   |
| Message within a proposal thread        |  ✅   |   ✅     |  ✅   |
| Generate / sign agreement               |  ✅   |   ✅     |  ✅   |
| Moderate listings / manage users        |  —    |    —     |  ✅   |

**Enforcement layers (defense in depth):**
1. **RLS policies** — the hard boundary; see `migrations/0002_rls.sql`.
2. **Server-side guards** — `requireRole()` / `requireUser()` helpers in
   `src/lib/auth.ts` gate route handlers and server actions and produce friendly
   errors before hitting the DB.
3. **UI gating** — navigation and actions render conditionally by role for UX,
   never as a security control.

---

## 5. API surface

The app is primarily Server Components + Server Actions. A REST surface under
`/api` exists for programmatic access and the few client-driven flows.

| Method | Route                              | Role        | Purpose                         |
| ------ | ---------------------------------- | ----------- | ------------------------------- |
| GET    | `/api/properties`                  | any auth    | List/search/filter listings     |
| POST   | `/api/properties`                  | owner       | Create listing                  |
| GET    | `/api/properties/:id`              | any auth    | Listing detail                  |
| PATCH  | `/api/properties/:id`              | owner(self) | Update listing                  |
| DELETE | `/api/properties/:id`              | owner(self) | Archive listing                 |
| POST   | `/api/properties/:id/proposals`    | operator    | Submit proposal                 |
| GET    | `/api/proposals`                   | owner/op    | List proposals (scoped by role) |
| PATCH  | `/api/proposals/:id`               | owner/op    | Accept/counter/reject/withdraw  |
| POST   | `/api/proposals/:id/agreement`     | owner       | Generate draft agreement        |
| GET    | `/api/messages?proposalId=`        | participant | Thread messages                 |
| POST   | `/api/messages`                    | participant | Send message                    |
| GET    | `/api/notifications`               | self        | List notifications              |
| POST   | `/api/admin/...`                   | admin       | Moderation actions              |

Server Actions (in `src/app/**/actions.ts`) cover form submissions:
`createProperty`, `submitProposal`, `respondToProposal`, `sendMessage`,
`generateAgreement`, `signAgreement`.

---

## 6. Folder structure

See README. Key conventions:
- **Route groups** `(marketing)`, `(auth)`, `(app)` keep layouts separate without
  affecting URLs.
- **Server Actions** colocated as `actions.ts` next to the route that uses them.
- **`src/lib/supabase/`** exposes three factories: `client` (browser), `server`
  (RSC/actions, cookie-bound), `admin` (service-role, server-only).

---

## 7. Financial analysis engine

`src/lib/finance.ts` is a pure, fully-typed module (no I/O) so it can run on the
server for stored analytics and on the client for the live calculator. It
computes monthly/annual cash flow, gross/net profit, margin, cash-on-cash ROI,
and a simple deal-quality score. Pure functions = trivially testable.

---

## 8. Security posture (MVP)

- RLS denies by default; every table has explicit policies.
- Service-role key is only ever imported by `src/lib/supabase/admin.ts`, which is
  never bundled into client components.
- Zod validates all external input at the boundary (`src/lib/validations.ts`).
- Storage bucket `property-photos` is public-read but write-restricted to the
  authenticated owner via Storage policies.
- `audit_logs` records sensitive mutations (proposal acceptance, agreement
  signing, moderation).
