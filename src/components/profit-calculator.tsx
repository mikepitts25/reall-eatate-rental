"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { analyzeDeal, type DealRating } from "@/lib/finance";
import { formatCurrency, formatPercent } from "@/lib/format";

const RATING_STYLES: Record<DealRating, string> = {
  excellent: "bg-success text-success-foreground",
  good: "bg-primary text-primary-foreground",
  fair: "bg-amber-500 text-white",
  poor: "bg-destructive text-destructive-foreground",
};

export interface ProfitCalculatorProps {
  /** Pre-fill from a listing. */
  defaultMarketRent?: number;
  defaultOperatorOffer?: number;
  defaultMonthlyMortgage?: number;
  defaultExpenses?: number;
  defaultUpfront?: number;
  defaultTermMonths?: number;
  /** Notify parent of the operator's chosen offer (e.g. to sync a proposal form). */
  onOfferChange?: (offer: number) => void;
  className?: string;
}

export function ProfitCalculator({
  defaultMarketRent = 0,
  defaultOperatorOffer = 0,
  defaultMonthlyMortgage = 0,
  defaultExpenses = 0,
  defaultUpfront = 0,
  defaultTermMonths = 12,
  onOfferChange,
  className,
}: ProfitCalculatorProps) {
  const [marketRent, setMarketRent] = useState(defaultMarketRent);
  const [operatorOffer, setOperatorOffer] = useState(defaultOperatorOffer);
  const [expenses, setExpenses] = useState(defaultExpenses);
  const [upfront, setUpfront] = useState(defaultUpfront);
  const [term, setTerm] = useState(defaultTermMonths);

  const analysis = useMemo(
    () =>
      analyzeDeal({
        monthlyMortgage: defaultMonthlyMortgage,
        marketRent,
        operatorOffer,
        monthlyExpenses: expenses,
        upfrontInvestment: upfront,
        leaseTermMonths: term,
      }),
    [defaultMonthlyMortgage, marketRent, operatorOffer, expenses, upfront, term]
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Profitability calculator
          <Badge className={RATING_STYLES[analysis.rating]}>
            {analysis.rating.toUpperCase()} · {analysis.dealScore}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Market rent /mo"
            value={marketRent}
            onChange={setMarketRent}
          />
          <NumberField
            label="Your offer to owner /mo"
            value={operatorOffer}
            onChange={(v) => {
              setOperatorOffer(v);
              onOfferChange?.(v);
            }}
          />
          <NumberField
            label="Operating expenses /mo"
            value={expenses}
            onChange={setExpenses}
          />
          <NumberField
            label="Upfront investment"
            value={upfront}
            onChange={setUpfront}
          />
          <NumberField
            label="Lease term (months)"
            value={term}
            onChange={setTerm}
            currency={false}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <Row
            label="Monthly profit"
            value={formatCurrency(analysis.monthlyProfit)}
            emphasize
            positive={analysis.monthlyProfit >= 0}
          />
          <Row
            label="Annual profit"
            value={formatCurrency(analysis.annualProfit)}
            positive={analysis.annualProfit >= 0}
          />
          <Row
            label={`Profit over ${term} mo`}
            value={formatCurrency(analysis.termProfit)}
            positive={analysis.termProfit >= 0}
          />
          <Row label="Profit margin" value={formatPercent(analysis.profitMargin)} />
          <Row
            label="Cash-on-cash ROI"
            value={
              analysis.cashOnCashRoi === null
                ? "—"
                : formatPercent(analysis.cashOnCashRoi)
            }
          />
          <Row
            label="Payback period"
            value={
              analysis.paybackMonths === null
                ? "—"
                : `${analysis.paybackMonths} mo`
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

function NumberField({
  label,
  value,
  onChange,
  currency = true,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  currency?: boolean;
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative mt-1">
        {currency && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            $
          </span>
        )}
        <Input
          type="number"
          min={0}
          inputMode="decimal"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={currency ? "pl-6" : ""}
        />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  emphasize,
  positive,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={
          emphasize ? "font-medium" : "text-sm text-muted-foreground"
        }
      >
        {label}
      </span>
      <span
        className={
          (emphasize ? "text-lg font-bold " : "text-sm font-medium ") +
          (positive === undefined
            ? ""
            : positive
              ? "text-success"
              : "text-destructive")
        }
      >
        {value}
      </span>
    </div>
  );
}
