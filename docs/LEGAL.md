# LeaseFlip — Legal & Agreements

> ⚠️ **Not legal advice.** Everything here is template/engineering scaffolding.
> Lease arbitrage / "rent-to-rent" is regulated differently by jurisdiction.
> Have a licensed attorney review all documents and policies before launch.

There are two distinct layers of "legal" in LeaseFlip.

## Layer 1 — Platform legal (LeaseFlip ↔ users)

Static policy pages, linked from the marketing footer and the signup consent box:

| Page | Route | File |
| ---- | ----- | ---- |
| Terms of Service | `/legal/terms` | `src/app/(marketing)/legal/terms/page.tsx` |
| Privacy Policy | `/legal/privacy` | `src/app/(marketing)/legal/privacy/page.tsx` |
| E-Signature Consent | `/legal/esign-consent` | `src/app/(marketing)/legal/esign-consent/page.tsx` |

At **signup**, users must check a box agreeing to all three (`acceptedTerms` in
`signupSchema`). The consent intent + timestamp is recorded in the auth user's
metadata (`terms_accepted_at`, `esign_consent`) — see `src/app/(auth)/actions.ts`.

**TODO before launch:** replace placeholder copy with attorney-reviewed text;
finalize the dispute-resolution/arbitration and limitation-of-liability clauses;
confirm GDPR/CCPA obligations and your data-processing agreements with
sub-processors (Vercel, Supabase, e-sign provider).

## Layer 2 — Owner ↔ Operator agreement

The contract the two parties sign. It is generated from an accepted proposal and
rendered from a single standardized template (not each side bringing their own).

- **Template:** `src/lib/agreements/template.ts` — `buildAgreementClauses()` and
  `renderAgreementText()`. Versioned (`templateVersion()`), with merge fields and
  an optional "Additional Negotiated Terms" section for addenda.
- **Data shape:** `src/lib/agreements/types.ts` (`AgreementData`).
- **Document view:** `/agreements/[id]/document` renders the full, printable
  agreement (Print / Save as PDF) with signature blocks. Linked from the
  agreement panel on the proposal page.
- **Storage:** the rendered text is saved to `agreements.terms` at creation; the
  completed/signed PDF URL belongs in `agreements.document_url`.

**TODO before launch:** attorney review of every clause; jurisdiction-specific
addenda; required state/local disclosures; insurance + liability allocation.

## E-signature integration (Documenso-ready)

Signing goes through a provider abstraction so we can move from the built-in
in-app signing to a compliant provider without touching the UI.

- **Interface:** `src/lib/agreements/provider.ts` — `SignatureProvider`,
  `getSignatureProvider()`.
- **Default:** `InAppSignatureProvider` (click-to-sign + timestamp; the existing
  flow). Adequate for the MVP demo, **not** a compliant e-signature.
- **Target:** `DocumensoSignatureProvider` (stub). To enable:
  1. Stand up Documenso (cloud or self-hosted) and create an API key.
  2. Set env: `ESIGN_PROVIDER=documenso`, `DOCUMENSO_API_URL`,
     `DOCUMENSO_API_KEY`.
  3. Implement `createSignatureRequest()` (create document → add owner+operator
     as ordered signers → send → store external id + signing URLs).
  4. Add a webhook handler to mark the agreement `active` and save the signed
     PDF URL to `agreements.document_url`.

Until configured, `getSignatureProvider()` falls back to in-app signing, so the
product keeps working.
