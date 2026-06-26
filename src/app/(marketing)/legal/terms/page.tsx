import { LegalDoc, LegalSection } from "@/components/legal-doc";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalDoc title="Terms of Service" lastUpdated="June 2026">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use
        of the LeaseFlip marketplace and related services (the
        &quot;Platform&quot;). By creating an account or using the Platform, you
        agree to these Terms.
      </p>

      <LegalSection heading="1. What LeaseFlip is (and isn't)">
        <p>
          LeaseFlip is a neutral venue that connects property owners
          (&quot;Owners&quot;) with property operators (&quot;Operators&quot;).
          LeaseFlip is <strong>not</strong> a party to any agreement between
          Owners and Operators, is <strong>not</strong> a real-estate broker,
          agent, landlord, or property manager, and does <strong>not</strong>{" "}
          provide legal, financial, tax, or investment advice. We do not
          guarantee any rental income, occupancy, or outcome.
        </p>
      </LegalSection>

      <LegalSection heading="2. Eligibility & accounts">
        <p>
          You must be at least 18 and able to form a binding contract. You are
          responsible for the accuracy of your listings, proposals, and profile,
          and for keeping your credentials secure.
        </p>
      </LegalSection>

      <LegalSection heading="3. Owner & Operator responsibilities">
        <p>
          Owners are responsible for ensuring they have the legal right to lease
          their property, including any required lender, insurer, or HOA
          consents. Operators are responsible for tenant management, maintenance,
          damages, and compliance with all applicable landlord-tenant,
          short-term-rental, licensing, tax, and zoning laws. The Parties—not
          LeaseFlip—are solely responsible for their agreements and conduct.
        </p>
      </LegalSection>

      <LegalSection heading="4. Agreements & e-signatures">
        <p>
          Documents generated on the Platform are templates offered for
          convenience and may not be suitable for your situation. You are
          responsible for obtaining independent legal review. By signing
          electronically, you consent to do so under the U.S. ESIGN Act and UETA
          (or local equivalents).
        </p>
      </LegalSection>

      <LegalSection heading="5. Fees">
        <p>
          The MVP is currently provided free of charge. We may introduce fees in
          the future with notice; continued use after a fee change constitutes
          acceptance.
        </p>
      </LegalSection>

      <LegalSection heading="6. Prohibited conduct">
        <p>
          You agree not to misuse the Platform, including by posting fraudulent
          listings, circumventing fees, harassing other users, or violating any
          law. We may suspend or remove accounts and listings that violate these
          Terms.
        </p>
      </LegalSection>

      <LegalSection heading="7. Disclaimers & limitation of liability">
        <p>
          The Platform is provided &quot;as is&quot; without warranties of any
          kind. To the maximum extent permitted by law, LeaseFlip is not liable
          for indirect, incidental, or consequential damages, or for the acts,
          omissions, or agreements of Owners and Operators.
        </p>
      </LegalSection>

      <LegalSection heading="8. Indemnification">
        <p>
          You agree to indemnify and hold LeaseFlip harmless from claims arising
          out of your listings, proposals, agreements, or use of the Platform.
        </p>
      </LegalSection>

      <LegalSection heading="9. Dispute resolution & governing law">
        <p>
          These Terms are governed by the laws of the jurisdiction in which
          LeaseFlip operates, without regard to conflict-of-laws rules. Disputes
          with LeaseFlip will be resolved as set out here (insert venue /
          arbitration clause after legal review).
        </p>
      </LegalSection>

      <LegalSection heading="10. Changes">
        <p>
          We may update these Terms; material changes will be posted here. Your
          continued use after changes take effect constitutes acceptance.
        </p>
      </LegalSection>

      <LegalSection heading="11. Contact">
        <p>Questions about these Terms: support@leaseflip.example.</p>
      </LegalSection>
    </LegalDoc>
  );
}
