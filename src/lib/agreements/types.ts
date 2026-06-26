/**
 * Data shape used to render an owner↔operator agreement document.
 * Everything the template needs is captured here so the same structure can be
 * rendered to HTML (print/PDF) today and handed to an e-signature provider
 * (e.g. Documenso) later.
 */
export interface AgreementParty {
  name: string;
  companyName?: string | null;
  email?: string | null;
  role: "owner" | "operator";
}

export interface AgreementData {
  /** Internal agreement id (used as the document reference number). */
  id: string;
  owner: AgreementParty;
  operator: AgreementParty;

  property: {
    title: string;
    addressLine1?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    leaseRestrictions?: string | null;
  };

  /** Guaranteed monthly rent the operator pays the owner. */
  monthlyRent: number;
  leaseTermMonths: number;
  startDate?: string | null;
  endDate?: string | null;
  securityDeposit?: number;

  /** Operator's stated intended use (from the proposal). */
  intendedUse?: string | null;

  /** Free-form additional clauses negotiated by the parties. */
  customClauses?: string[];

  ownerSignedAt?: string | null;
  operatorSignedAt?: string | null;
  /** Governing law jurisdiction, e.g. "the State of Texas". */
  governingLaw?: string;
}

export interface AgreementClause {
  heading: string;
  /** One or more paragraphs. */
  body: string[];
}
