"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { FileSignature } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { signAgreementAction } from "@/app/(app)/agreements/actions";
import type { Agreement } from "@/lib/supabase/database.types";

export function AgreementPanel({
  agreement,
  role,
}: {
  agreement: Agreement;
  role: "owner" | "operator";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const mySigned =
    role === "owner"
      ? !!agreement.owner_signed_at
      : !!agreement.operator_signed_at;

  const sign = () =>
    startTransition(async () => {
      setError(null);
      const res = await signAgreementAction(agreement.id);
      if (res.error) setError(res.error);
      else router.refresh();
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" /> Agreement
          </span>
          <StatusBadge status={agreement.status} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Monthly rent" value={formatCurrency(agreement.monthly_rent)} />
          <Field label="Term" value={`${agreement.lease_term_months} months`} />
          <Field label="Start" value={formatDate(agreement.start_date)} />
          <Field label="End" value={formatDate(agreement.end_date)} />
        </div>

        {agreement.terms && (
          <>
            <Separator />
            <div>
              <p className="mb-1 text-sm font-medium">Draft terms</p>
              <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-xs text-muted-foreground">
                {agreement.terms}
              </pre>
            </div>
          </>
        )}

        <Separator />

        <div className="grid grid-cols-2 gap-3 text-sm">
          <SignState label="Owner" signedAt={agreement.owner_signed_at} />
          <SignState label="Operator" signedAt={agreement.operator_signed_at} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {agreement.status !== "active" &&
          agreement.status !== "terminated" &&
          !mySigned && (
            <Button onClick={sign} disabled={pending} className="w-full">
              {pending ? "Signing…" : "Sign agreement (e-signature)"}
            </Button>
          )}
        {mySigned && agreement.status !== "active" && (
          <p className="text-center text-sm text-muted-foreground">
            You&apos;ve signed. Waiting on the other party.
          </p>
        )}
        {agreement.status === "active" && (
          <p className="rounded-md bg-success/10 px-3 py-2 text-center text-sm font-medium text-success">
            ✓ Agreement active — payment schedule generated.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function SignState({
  label,
  signedAt,
}: {
  label: string;
  signedAt: string | null;
}) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={signedAt ? "font-medium text-success" : "text-muted-foreground"}>
        {signedAt ? `Signed ${formatDate(signedAt)}` : "Not signed"}
      </p>
    </div>
  );
}
