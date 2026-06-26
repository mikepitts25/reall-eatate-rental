/**
 * Signature provider abstraction.
 *
 * Today the app records signatures in-app (a click + timestamp). This seam lets
 * us swap in a real e-signature provider (Documenso is the chosen target)
 * without touching the UI or the agreement flow: implement `SignatureProvider`,
 * register it in `getSignatureProvider()`, and set `ESIGN_PROVIDER` in env.
 */
import type { AgreementData } from "./types";

export type SignatureProviderId = "in_app" | "documenso";

export interface CreateSignatureRequestInput {
  agreement: AgreementData;
  /** Rendered document text/HTML to send for signing. */
  documentText: string;
  /** Where the provider should redirect/callback after signing. */
  returnUrl?: string;
}

export interface SignatureRequest {
  provider: SignatureProviderId;
  /** Provider-side identifier for the signing request, if any. */
  externalId: string | null;
  /** Hosted signing URL to send the parties to, if the provider hosts it. */
  signingUrl: string | null;
  status: "pending" | "sent" | "completed" | "unsupported";
}

export interface SignatureProvider {
  readonly id: SignatureProviderId;
  /** Whether the provider is configured and ready to use. */
  isConfigured(): boolean;
  createSignatureRequest(
    input: CreateSignatureRequestInput
  ): Promise<SignatureRequest>;
}

/**
 * Default provider: signatures are captured inside LeaseFlip (the existing
 * click-to-sign flow). Not a substitute for a compliant e-sign provider, but
 * keeps the product working until one is wired up.
 */
class InAppSignatureProvider implements SignatureProvider {
  readonly id = "in_app" as const;
  isConfigured(): boolean {
    return true;
  }
  async createSignatureRequest(): Promise<SignatureRequest> {
    return {
      provider: "in_app",
      externalId: null,
      signingUrl: null,
      status: "pending",
    };
  }
}

/**
 * Documenso provider (open-source e-signature). Stub: implement against the
 * Documenso API once DOCUMENSO_API_URL + DOCUMENSO_API_KEY are configured.
 * Docs: https://docs.documenso.com/developers/public-api
 */
class DocumensoSignatureProvider implements SignatureProvider {
  readonly id = "documenso" as const;

  private readonly apiUrl = process.env.DOCUMENSO_API_URL;
  private readonly apiKey = process.env.DOCUMENSO_API_KEY;

  isConfigured(): boolean {
    return Boolean(this.apiUrl && this.apiKey);
  }

  async createSignatureRequest(
    input: CreateSignatureRequestInput
  ): Promise<SignatureRequest> {
    if (!this.isConfigured()) {
      return {
        provider: "documenso",
        externalId: null,
        signingUrl: null,
        status: "unsupported",
      };
    }

    // Reference inputs so the contract is explicit for the implementer.
    const { documentText } = input;
    void documentText;

    // TODO: integrate the Documenso API.
    //   1. Create a document from `input.documentText` (or an uploaded PDF).
    //   2. Add the owner and operator as recipients/signers, in order.
    //   3. Send for signing and capture the returned document id + signing URLs.
    //   4. Handle the Documenso webhook to mark the agreement signed/active and
    //      store the completed PDF URL in `agreements.document_url`.
    //
    // Example shape (pseudocode, left intentionally unimplemented):
    //   const res = await fetch(`${this.apiUrl}/api/v1/documents`, {
    //     method: "POST",
    //     headers: { Authorization: `Bearer ${this.apiKey}` },
    //     body: JSON.stringify({ title: agreementTitle(), ... }),
    //   });
    throw new Error(
      "DocumensoSignatureProvider.createSignatureRequest is not implemented yet."
    );
  }
}

/**
 * Resolve the active signature provider from env (defaults to in-app).
 * Falls back to in-app if the configured provider isn't ready.
 */
export function getSignatureProvider(): SignatureProvider {
  const configured = (process.env.ESIGN_PROVIDER ??
    "in_app") as SignatureProviderId;

  if (configured === "documenso") {
    const documenso = new DocumensoSignatureProvider();
    if (documenso.isConfigured()) return documenso;
    // Not configured — fall back so the app keeps working.
    return new InAppSignatureProvider();
  }

  return new InAppSignatureProvider();
}
