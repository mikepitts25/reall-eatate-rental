import { LegalDoc, LegalSection } from "@/components/legal-doc";

export const metadata = { title: "Electronic Signature Consent" };

export default function EsignConsentPage() {
  return (
    <LegalDoc title="Electronic Signature & Records Consent" lastUpdated="June 2026">
      <p>
        This disclosure explains your consent to use electronic signatures and
        records on LeaseFlip, consistent with the U.S. Electronic Signatures in
        Global and National Commerce Act (ESIGN) and the Uniform Electronic
        Transactions Act (UETA).
      </p>

      <LegalSection heading="1. Consent to electronic transactions">
        <p>
          By checking the consent box at sign-up and by signing documents on the
          Platform, you agree that your electronic signature is the legal
          equivalent of your handwritten signature and that agreements may be
          formed, signed, and stored electronically.
        </p>
      </LegalSection>

      <LegalSection heading="2. Intent & attribution">
        <p>
          When you click to sign, you intend to sign the document, and you
          confirm you are the person associated with your account. LeaseFlip
          records the signer, timestamp, and related metadata as evidence of the
          signature.
        </p>
      </LegalSection>

      <LegalSection heading="3. Hardware & software">
        <p>
          To access and retain electronic records you need a device with a
          current web browser, internet access, and the ability to view and save
          PDF documents.
        </p>
      </LegalSection>

      <LegalSection heading="4. Copies & withdrawal">
        <p>
          You may download or print signed documents from your account. You may
          withdraw consent to transact electronically by contacting us, though
          doing so may prevent you from using certain features.
        </p>
      </LegalSection>

      <LegalSection heading="5. Provider note">
        <p>
          When a third-party e-signature provider (e.g., Documenso) is enabled,
          signing and record-keeping may also be governed by that provider&apos;s
          terms and audit trail.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
