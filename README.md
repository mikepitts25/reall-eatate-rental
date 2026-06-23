# LeaseFlip

> A marketplace that connects **property owners** who want guaranteed monthly
> income with **property operators** who lease and operate properties for profit.

LeaseFlip lets owners list properties, operators browse opportunities and submit
proposals, both parties negotiate over secure messaging, and agreements + payment
obligations get tracked — all in one place.

```
Owner               Operator
mortgage $3,000     offers owner $4,000/mo guaranteed
market rent $6,000  keeps the spread after expenses
```

---

## Tech stack

| Layer        | Choice                                            |
| ------------ | ------------------------------------------------- |
| Framework    | Next.js 15 (App Router, React 19, Server Actions) |
| Language     | TypeScript                                        |
| Styling      | TailwindCSS + shadcn/ui                            |
| Backend      | Supabase (PostgreSQL, Auth, Storage, Realtime)    |
| Auth         | Supabase Auth (email/password + OAuth-ready)      |
| Authz        | Postgres Row Level Security (RLS) + role claims    |
| Deployment   | Vercel                                            |

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
#    then fill in your Supabase URL + keys

# 3. Set up the database
#    Option A — Supabase CLI (local dev):
supabase start
supabase db reset            # runs migrations + seed
#    Option B — hosted project:
#    paste supabase/migrations/*.sql then supabase/seed.sql
#    into the Supabase SQL editor, in order.

# 4. Create the storage bucket for property photos (one-time)
#    Dashboard > Storage > New bucket > name: "property-photos", public: true

# 5. Run the app
npm run dev      # http://localhost:3000
```

---

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system architecture, data model, RBAC, API surface
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — MVP phases and delivery plan
- [`docs/MONETIZATION.md`](docs/MONETIZATION.md) — future revenue model
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — CI, Supabase + Vercel deployment, and running from GitHub

---

## Project structure

```
.
├── docs/                      # architecture, roadmap, monetization
├── supabase/
│   ├── migrations/            # ordered SQL: schema, RLS, functions
│   └── seed.sql               # demo data
├── src/
│   ├── app/                   # Next.js App Router routes
│   │   ├── (marketing)/       # public landing
│   │   ├── (auth)/            # login / signup
│   │   ├── (app)/             # authenticated dashboard, properties, proposals, messages
│   │   ├── admin/             # admin dashboard
│   │   ├── api/               # route handlers (REST surface)
│   │   └── auth/callback/     # Supabase auth code exchange
│   ├── components/
│   │   ├── ui/                # shadcn primitives
│   │   └── ...                # feature components
│   ├── lib/
│   │   ├── supabase/          # client/server/middleware factories + generated types
│   │   ├── finance.ts         # profitability + ROI engine
│   │   ├── validations.ts     # zod schemas
│   │   └── ...
│   └── middleware.ts          # session refresh + route protection
└── ...config
```

---

## Core domain model

`users` (Supabase Auth) → `profiles` (role, contact) → `properties` →
`property_photos`, `proposals` → `agreements` → `payments`, with `messages`,
`notifications`, and `audit_logs` cross-cutting. Full schema in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and
[`supabase/migrations`](supabase/migrations).
