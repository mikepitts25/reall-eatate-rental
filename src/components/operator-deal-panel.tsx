"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ProfitCalculator } from "@/components/profit-calculator";
import { FieldError, FormMessage } from "@/components/field-error";
import {
  submitProposalAction,
  type ProposalFormState,
} from "@/app/(app)/proposals/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Submitting…" : "Submit proposal"}
    </Button>
  );
}

export function OperatorDealPanel({
  propertyId,
  marketRent,
  desiredRent,
  monthlyMortgage,
  minLeaseMonths,
  alreadyProposed,
}: {
  propertyId: string;
  marketRent: number;
  desiredRent: number;
  monthlyMortgage: number;
  minLeaseMonths: number;
  alreadyProposed: boolean;
}) {
  const [offer, setOffer] = useState(desiredRent);
  const [state, formAction] = useActionState<ProposalFormState, FormData>(
    submitProposalAction,
    {}
  );
  const fe = state.fieldErrors ?? {};

  return (
    <div className="space-y-6">
      <ProfitCalculator
        defaultMarketRent={marketRent}
        defaultOperatorOffer={desiredRent}
        defaultMonthlyMortgage={monthlyMortgage}
        defaultExpenses={Math.round(marketRent * 0.2)}
        defaultTermMonths={minLeaseMonths}
        onOfferChange={setOffer}
      />

      <Card>
        <CardHeader>
          <CardTitle>Submit a proposal</CardTitle>
        </CardHeader>
        <CardContent>
          {alreadyProposed ? (
            <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              You&apos;ve already submitted a proposal on this property. Track it
              from the Proposals page.
            </p>
          ) : (
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="property_id" value={propertyId} />
              <FormMessage message={state.error} />

              <div>
                <Label htmlFor="offered_monthly_rent">
                  Guaranteed offer to owner /mo
                </Label>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="offered_monthly_rent"
                    name="offered_monthly_rent"
                    type="number"
                    min={1}
                    value={offer}
                    onChange={(e) => setOffer(parseFloat(e.target.value) || 0)}
                    className="pl-6"
                    required
                  />
                </div>
                <FieldError message={fe.offered_monthly_rent} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="lease_term_months">Lease term (mo)</Label>
                  <Input
                    id="lease_term_months"
                    name="lease_term_months"
                    type="number"
                    min={1}
                    defaultValue={Math.max(minLeaseMonths, 12)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="security_deposit">Security deposit</Label>
                  <Input
                    id="security_deposit"
                    name="security_deposit"
                    type="number"
                    min={0}
                    defaultValue={0}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="estimated_expenses">
                  Your est. monthly expenses
                </Label>
                <Input
                  id="estimated_expenses"
                  name="estimated_expenses"
                  type="number"
                  min={0}
                  defaultValue={Math.round(marketRent * 0.2)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="intended_use">Intended use</Label>
                <Input
                  id="intended_use"
                  name="intended_use"
                  placeholder="e.g. Mid-term corporate rentals"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="message">Message to owner</Label>
                <Textarea
                  id="message"
                  name="message"
                  rows={3}
                  placeholder="Introduce yourself and explain your plan for the property."
                  className="mt-1.5"
                />
              </div>

              <SubmitButton />
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
