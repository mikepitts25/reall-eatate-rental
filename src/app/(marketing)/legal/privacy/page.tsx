import { LegalDoc, LegalSection } from "@/components/legal-doc";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalDoc title="Privacy Policy" lastUpdated="June 2026">
      <p>
        This Privacy Policy explains how LeaseFlip collects, uses, and protects
        your information when you use the Platform.
      </p>

      <LegalSection heading="1. Information we collect">
        <p>
          <strong>Account data</strong> (name, email, role, company, phone),{" "}
          <strong>listing &amp; proposal data</strong> (property details,
          financials, messages), and <strong>usage data</strong> (log and device
          information). Financial figures you enter are used to power the
          marketplace and analytics features.
        </p>
      </LegalSection>

      <LegalSection heading="2. How we use it">
        <p>
          To operate the marketplace, match Owners and Operators, generate
          agreement drafts, provide messaging and notifications, prevent fraud,
          and improve the product. We do not sell your personal information.
        </p>
      </LegalSection>

      <LegalSection heading="3. Sharing">
        <p>
          Profile and listing details are shared with counterparties as needed to
          transact. We use service providers (e.g., hosting via Vercel, database
          and auth via Supabase, and—when enabled—an e-signature provider) who
          process data on our behalf under their own terms.
        </p>
      </LegalSection>

      <LegalSection heading="4. Data retention">
        <p>
          We retain information for as long as your account is active or as needed
          to provide the service, comply with legal obligations, resolve
          disputes, and enforce agreements.
        </p>
      </LegalSection>

      <LegalSection heading="5. Your rights">
        <p>
          Depending on your location (e.g., GDPR, CCPA), you may have rights to
          access, correct, delete, or export your data, and to object to certain
          processing. Contact us to exercise these rights.
        </p>
      </LegalSection>

      <LegalSection heading="6. Security">
        <p>
          We use access controls and row-level security to protect your data. No
          method of transmission or storage is 100% secure; we cannot guarantee
          absolute security.
        </p>
      </LegalSection>

      <LegalSection heading="7. Contact">
        <p>Privacy questions: privacy@leaseflip.example.</p>
      </LegalSection>
    </LegalDoc>
  );
}
