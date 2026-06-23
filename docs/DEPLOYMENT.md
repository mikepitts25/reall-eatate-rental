# LeaseFlip — Running & Deploying from GitHub

There are two layers to "running this from GitHub":

1. **Continuous Integration (CI)** — automated lint + typecheck + build on every
   push and pull request. Already wired up via GitHub Actions; needs nothing
   from you.
2. **A live, clickable app** — preview deployments on Vercel (one URL per PR)
   backed by a real Supabase project. Requires a one-time setup below.

---

## 1. CI — GitHub Actions (no setup required)

`.github/workflows/ci.yml` runs on every push and PR:

- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

The build uses **non-secret placeholder** Supabase env vars so it can compile
without a live backend. You'll see green/red checks on each PR. That's enough to
catch type errors, lint issues, and broken builds — but it does **not** run the
live app (no database).

---

## 2. Live app — Supabase + Vercel

### Step A — Create the Supabase project

1. Create a project at <https://supabase.com/dashboard>.
2. Open **SQL Editor** and run, in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_rls.sql`
   - `supabase/migrations/0003_storage.sql`
   - *(optional, for demo data)* `supabase/seed.sql`

   Or, with the [Supabase CLI](https://supabase.com/docs/guides/cli):
   ```bash
   supabase link --project-ref <your-ref>
   supabase db push          # applies migrations
   ```
3. Confirm the **`property-photos`** Storage bucket exists (created by
   `0003_storage.sql`). If not: **Storage → New bucket → `property-photos`,
   public.**
4. **Auth → Providers → Email**: for the smoothest demo, disable
   "Confirm email" so signups log in immediately. (Leave it on for production.)
5. Grab your keys from **Project Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`

### Step B — Deploy on Vercel (native Git integration — recommended)

This is the simplest path and needs **no secrets in GitHub**:

1. Go to <https://vercel.com/new> and **Import** the
   `mikepitts25/reall-eatate-rental` repository.
2. **Build & Output Settings** — accept the defaults. `vercel.json` already pins
   the important ones, so leave every override **off**:

   | Setting | Value | Notes |
   | ------- | ----- | ----- |
   | Framework Preset | **Next.js** | auto-detected |
   | Root Directory | `./` (repo root) | app is at the root, not a subfolder — leave unchanged |
   | Build Command | `next build` | default / in `vercel.json` — keep override off |
   | Output Directory | *(blank / default)* | Next.js manages `.next` — **do not** set `out`/`dist` |
   | Install Command | `npm install` | default / in `vercel.json` |
   | Node.js Version | **20.x** (or 22.x) | Settings → General → Node.js Version |

   This is a server-rendered App Router app (no static export), so the Output
   Directory **must** stay default.
3. Add **Environment Variables** (Production *and* Preview):

   | Name | Value | Notes |
   | ---- | ----- | ----- |
   | `NEXT_PUBLIC_SUPABASE_URL` | your project URL | public |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key | public |
   | `SUPABASE_SERVICE_ROLE_KEY` | your service-role key | **secret** |
   | `NEXT_PUBLIC_SITE_URL` | your deployment URL | e.g. `https://leaseflip.vercel.app` |

   Notes:
   - The build **succeeds even without** these (the code only reads them at
     request time), but the running app needs them to reach Supabase.
   - For the very first deploy you won't know the final URL yet: deploy once,
     copy the assigned URL into `NEXT_PUBLIC_SITE_URL`, then redeploy. It's used
     for the auth email-redirect callback.
   - If a build ever errors about a missing image host, it's because
     `NEXT_PUBLIC_SUPABASE_URL` wasn't set at build time — `next.config.ts` reads
     it to whitelist the Supabase image domain. Setting the var avoids it.

4. **Deploy.** From then on:
   - Every push to a branch / PR → a **Preview Deployment** with its own URL.
   - Merges to `main` → the **Production** deployment.

5. Back in Supabase, add your Vercel URLs under **Auth → URL Configuration →
   Redirect URLs**, including `…/auth/callback` for both the production and
   `*.vercel.app` preview domains.

### Step C — Try it

Open the deployment URL and sign up as an **owner** in one browser and an
**operator** in another (or use the seeded demo accounts if you ran `seed.sql`):

```
owner@leaseflip.test     / password123
operator@leaseflip.test  / password123
admin@leaseflip.test     / password123
```

> Seeded accounts only work if you also create matching **Auth users** with the
> UUIDs noted at the top of `supabase/seed.sql` (the SQL seeds profiles/listings;
> Auth users are created separately via the dashboard or CLI).

---

## Optional — deploy via GitHub Actions instead of Vercel's Git integration

If you'd rather drive deploys from a workflow (e.g. to gate them behind CI), add
the [`amondnet/vercel-action`](https://github.com/amondnet/vercel-action) or the
official Vercel CLI in a workflow and set repo secrets `VERCEL_TOKEN`,
`VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. The native Git integration above is simpler
and is what most teams use — reach for this only if you need the extra control.

---

## Local development

```bash
npm install
cp .env.example .env.local      # fill in your Supabase keys
npm run dev                     # http://localhost:3000
```
