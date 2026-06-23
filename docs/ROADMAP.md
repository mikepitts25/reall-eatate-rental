# LeaseFlip — MVP Roadmap

## Phase 1 — Core marketplace (this build) ✅

The goal of Phase 1 is a working two-sided marketplace a real owner and operator
could use end to end.

- [x] Supabase schema, enums, triggers, RLS
- [x] Authentication (email/password) with owner/operator/admin roles
- [x] Profile auto-provisioning on signup
- [x] Owner: create/edit property listings, photo upload, financials
- [x] Operator: browse, search, filter listings
- [x] Profitability calculator (live, client-side)
- [x] Operator: submit proposals; track submitted proposals
- [x] Owner: view and compare incoming proposals
- [x] Proposal lifecycle: accept / counter / reject / withdraw
- [x] Secure owner↔operator messaging (Realtime)
- [x] Agreement draft generation + e-signature placeholder
- [x] Payment obligation tracking (schedule + status)
- [x] Admin dashboard: users, listing moderation, proposal monitoring
- [x] Responsive UI with shadcn/ui

## Phase 2 — Trust, payments & UX (next)

- [ ] Stripe Connect: collect operator payments, payout to owners, escrow first month
- [ ] Real e-signature (DocuSign / Dropbox Sign integration)
- [ ] KYC / identity verification for operators
- [ ] Operator reputation & reviews; owner ratings
- [ ] Saved searches + email/push alerts on new matching listings
- [ ] Map-based browsing with geo radius filtering (PostGIS)
- [ ] Document vault (leases, insurance, IDs) per agreement
- [ ] In-app notifications center + email digests (Resend)

## Phase 3 — Scale & intelligence

- [ ] AI-assisted listing pricing & "fair offer" suggestions
- [ ] Automated comparable-rent estimates (market data API)
- [ ] Operator portfolio dashboard with P&L across all leased units
- [ ] Owner guaranteed-income statements & tax export
- [ ] Multi-unit / portfolio listings
- [ ] Dispute resolution workflow + admin case management
- [ ] Mobile apps (React Native / Expo) sharing the Supabase backend
- [ ] Public API + partner integrations (PMS, accounting)

## Sequencing rationale

Phase 1 proves the marketplace loop (list → propose → negotiate → agree).
Phase 2 makes money move and builds the trust layer required to charge fees.
Phase 3 adds defensibility (data, intelligence, network effects).

## Delivery milestones (suggested)

| Milestone | Scope                               | Exit criteria                        |
| --------- | ----------------------------------- | ------------------------------------ |
| M1        | Auth + listings + browse            | Owner lists, operator browses        |
| M2        | Proposals + messaging               | Full negotiation loop works          |
| M3        | Agreements + payment tracking       | Deal can be closed & tracked         |
| M4        | Admin + moderation + polish         | Safe to onboard pilot users          |
| M5 (P2)   | Stripe + e-sign + KYC               | First real money + binding contract  |
