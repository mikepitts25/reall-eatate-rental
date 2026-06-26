/**
 * LeaseFlip master operating-lease / property-management agreement template.
 *
 * ⚠️ TEMPLATE ONLY — NOT LEGAL ADVICE. This boilerplate is a starting point and
 * MUST be reviewed and adapted by a licensed attorney for the relevant
 * jurisdiction before being used for binding agreements. Lease arbitrage /
 * "rent-to-rent" arrangements are regulated differently across states and
 * countries.
 *
 * Pure functions (no I/O) so the same output renders in the document page, the
 * stored `agreements.terms` text, and any future e-signature payload.
 */
import type { AgreementClause, AgreementData } from "./types";

const TEMPLATE_VERSION = "v0.1-draft";

function money(n: number | undefined | null): string {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(v);
}

function date(d: string | null | undefined): string {
  if (!d) return "_______________";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(d));
}

function partyLabel(p: AgreementData["owner"] | AgreementData["operator"]): string {
  return p.companyName ? `${p.companyName} (${p.name})` : p.name;
}

function fullAddress(property: AgreementData["property"]): string {
  return (
    [
      property.addressLine1,
      property.city,
      property.state,
      property.postalCode,
    ]
      .filter(Boolean)
      .join(", ") || property.title
  );
}

export function agreementTitle(): string {
  return "Property Operating & Management Agreement";
}

export function templateVersion(): string {
  return TEMPLATE_VERSION;
}

/**
 * Build the ordered list of clauses for an agreement.
 */
export function buildAgreementClauses(d: AgreementData): AgreementClause[] {
  const owner = partyLabel(d.owner);
  const operator = partyLabel(d.operator);
  const law = d.governingLaw ?? "the state in which the Property is located";

  const clauses: AgreementClause[] = [
    {
      heading: "1. Parties & Property",
      body: [
        `This Property Operating & Management Agreement (the "Agreement") is entered into between ${owner} ("Owner") and ${operator} ("Operator"), collectively the "Parties".`,
        `The Owner owns the residential property located at ${fullAddress(
          d.property
        )} (the "Property") and wishes to grant the Operator the right to lease and operate the Property in exchange for guaranteed monthly payments.`,
      ],
    },
    {
      heading: "2. Term",
      body: [
        `The term of this Agreement is ${d.leaseTermMonths} months, commencing on ${date(
          d.startDate
        )} and ending on ${date(d.endDate)} (the "Term"), unless terminated earlier in accordance with this Agreement.`,
      ],
    },
    {
      heading: "3. Guaranteed Monthly Payment",
      body: [
        `The Operator shall pay the Owner a guaranteed amount of ${money(
          d.monthlyRent
        )} per month (the "Guaranteed Rent"), due on the 1st day of each month, regardless of whether the Property is occupied or generating income for the Operator.`,
        d.securityDeposit
          ? `The Operator shall provide a security deposit of ${money(
              d.securityDeposit
            )}, to be held and returned in accordance with applicable law.`
          : `No security deposit is required under this Agreement unless otherwise agreed in writing.`,
      ],
    },
    {
      heading: "4. Operator Rights & Permitted Use",
      body: [
        `The Owner grants the Operator the right to occupy, lease, sublease, furnish, and operate the Property during the Term for lawful residential rental purposes.`,
        d.intendedUse
          ? `The Operator's stated intended use is: ${d.intendedUse}.`
          : `The Operator shall use the Property for lawful rental operations.`,
        `The Operator may enter into subtenancy or guest agreements with occupants, subject to Section 5 and the restrictions in Section 6.`,
      ],
    },
    {
      heading: "5. Operator Responsibilities",
      body: [
        `The Operator is solely responsible, at its own cost, for: (a) sourcing, screening, and managing tenants and occupants; (b) routine maintenance and repairs; (c) damage caused by the Operator, its tenants, or guests; (d) utilities and services as agreed; and (e) compliance with all applicable landlord-tenant, short-term-rental, zoning, licensing, tax, and HOA rules.`,
        `The Operator shall hold appropriate liability and contents insurance and shall indemnify the Owner as set out in Section 9.`,
      ],
    },
    {
      heading: "6. Lease Restrictions",
      body: [
        d.property.leaseRestrictions
          ? `The Operator shall comply with the following Owner restrictions: ${d.property.leaseRestrictions}`
          : `No special use restrictions are specified by the Owner beyond those required by law, the lender, insurer, or any applicable HOA.`,
      ],
    },
    {
      heading: "7. Owner Responsibilities",
      body: [
        `The Owner shall maintain clear title and the legal right to enter into this Agreement, keep any underlying mortgage and property taxes in good standing, and not interfere with the Operator's quiet enjoyment and operation of the Property during the Term.`,
        `The Owner represents that entering into this Agreement does not violate any mortgage, insurance, or HOA obligation; where consent is required, the Owner is responsible for obtaining it.`,
      ],
    },
    {
      heading: "8. Default & Termination",
      body: [
        `A Party is in default if it fails to perform a material obligation and does not cure within fifteen (15) days of written notice. Non-payment of the Guaranteed Rent for more than ten (10) days is a material default by the Operator.`,
        `Upon uncured default, the non-defaulting Party may terminate this Agreement and pursue remedies available at law. Obligations relating to occupants in place at termination shall be handled in compliance with applicable tenant-protection law.`,
      ],
    },
    {
      heading: "9. Indemnification & Liability",
      body: [
        `The Operator shall indemnify, defend, and hold the Owner harmless from claims, damages, and liabilities arising from the Operator's operation of the Property, its tenants, or guests, except to the extent caused by the Owner's gross negligence or willful misconduct.`,
        `LeaseFlip is not a party to this Agreement, is not a real-estate broker or agent, and provides only the marketplace and document tooling. LeaseFlip makes no warranty as to the enforceability of this Agreement and is not liable for the Parties' performance.`,
      ],
    },
    {
      heading: "10. Dispute Resolution & Governing Law",
      body: [
        `The Parties shall first attempt to resolve disputes in good faith. Any unresolved dispute shall be resolved under the laws of ${law}, in the courts or arbitration forum having jurisdiction over the Property.`,
      ],
    },
    {
      heading: "11. Electronic Signatures & Entire Agreement",
      body: [
        `The Parties consent to executing this Agreement electronically. Electronic signatures are intended to have the same force and effect as handwritten signatures under applicable law (e.g., the U.S. ESIGN Act and UETA).`,
        `This Agreement, together with any addenda below, constitutes the entire agreement between the Parties and supersedes prior understandings. Amendments must be in writing and signed by both Parties.`,
      ],
    },
  ];

  if (d.customClauses && d.customClauses.length > 0) {
    clauses.push({
      heading: "12. Additional Negotiated Terms",
      body: d.customClauses.filter((c) => c && c.trim().length > 0),
    });
  }

  return clauses;
}

/**
 * Plain-text rendering, suitable for storing in `agreements.terms` and for a
 * provider payload that expects text.
 */
export function renderAgreementText(d: AgreementData): string {
  const lines: string[] = [];
  lines.push(agreementTitle().toUpperCase());
  lines.push(`Reference: ${d.id}`);
  lines.push(`Template: LeaseFlip ${TEMPLATE_VERSION} — DRAFT, pending legal review`);
  lines.push("");
  for (const clause of buildAgreementClauses(d)) {
    lines.push(clause.heading);
    for (const p of clause.body) lines.push(p);
    lines.push("");
  }
  lines.push("SIGNATURES");
  lines.push(
    `Owner: ${partyLabel(d.owner)} — ${
      d.ownerSignedAt ? `signed ${date(d.ownerSignedAt)}` : "____________________"
    }`
  );
  lines.push(
    `Operator: ${partyLabel(d.operator)} — ${
      d.operatorSignedAt
        ? `signed ${date(d.operatorSignedAt)}`
        : "____________________"
    }`
  );
  lines.push("");
  lines.push(
    "DISCLAIMER: This document was generated by LeaseFlip as a template and is not legal advice. Have it reviewed by a licensed attorney before relying on it."
  );
  return lines.join("\n");
}
