/**
 * LeaseFlip profitability engine.
 *
 * Pure, dependency-free functions so the same math runs in the client
 * calculator and in server-side analytics. All money values are plain numbers
 * in whole currency units (USD).
 */

export interface DealInputs {
  /** Owner's monthly mortgage payment (operator does not pay this; context only). */
  monthlyMortgage: number;
  /** Estimated market/achievable monthly rent the operator can collect. */
  marketRent: number;
  /** Guaranteed monthly rent the operator pays the owner. */
  operatorOffer: number;
  /** Operator's estimated monthly operating expenses (mgmt, utilities, vacancy, etc). */
  monthlyExpenses?: number;
  /** One-time upfront cash the operator invests (furnishing, deposits, setup). */
  upfrontInvestment?: number;
  /** Lease length in months — used for total/term projections. */
  leaseTermMonths?: number;
}

export interface DealAnalysis {
  /** What the operator collects each month. */
  monthlyRevenue: number;
  /** What the operator pays the owner. */
  monthlyRentToOwner: number;
  /** Operator's other monthly operating expenses. */
  monthlyExpenses: number;
  /** Revenue − rent-to-owner − expenses. */
  monthlyProfit: number;
  /** monthlyProfit × 12. */
  annualProfit: number;
  /** Profit margin as a % of revenue. */
  profitMargin: number;
  /** Operator profit over the full lease term. */
  termProfit: number;
  /** Cash-on-cash ROI (%) = annualProfit / upfrontInvestment. Null if no investment. */
  cashOnCashRoi: number | null;
  /** Months to recoup the upfront investment from monthly profit. Null if N/A. */
  paybackMonths: number | null;
  /** Owner's monthly position: guaranteed rent − mortgage. */
  ownerMonthlyNet: number;
  /** Heuristic 0–100 score of deal quality for the operator. */
  dealScore: number;
  /** Qualitative rating derived from dealScore. */
  rating: DealRating;
}

export type DealRating = "excellent" | "good" | "fair" | "poor";

function safe(n: number | undefined | null): number {
  return Number.isFinite(n as number) ? (n as number) : 0;
}

export function analyzeDeal(inputs: DealInputs): DealAnalysis {
  const monthlyRevenue = safe(inputs.marketRent);
  const monthlyRentToOwner = safe(inputs.operatorOffer);
  const monthlyExpenses = safe(inputs.monthlyExpenses);
  const upfront = safe(inputs.upfrontInvestment);
  const term = inputs.leaseTermMonths && inputs.leaseTermMonths > 0
    ? inputs.leaseTermMonths
    : 12;

  const monthlyProfit = monthlyRevenue - monthlyRentToOwner - monthlyExpenses;
  const annualProfit = monthlyProfit * 12;
  const termProfit = monthlyProfit * term;

  const profitMargin =
    monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;

  const cashOnCashRoi = upfront > 0 ? (annualProfit / upfront) * 100 : null;

  const paybackMonths =
    upfront > 0 && monthlyProfit > 0
      ? Math.ceil(upfront / monthlyProfit)
      : null;

  const ownerMonthlyNet = monthlyRentToOwner - safe(inputs.monthlyMortgage);

  const dealScore = scoreDeal({ profitMargin, monthlyProfit, cashOnCashRoi });
  const rating = ratingFromScore(dealScore);

  return {
    monthlyRevenue,
    monthlyRentToOwner,
    monthlyExpenses,
    monthlyProfit,
    annualProfit,
    profitMargin,
    termProfit,
    cashOnCashRoi,
    paybackMonths,
    ownerMonthlyNet,
    dealScore,
    rating,
  };
}

function scoreDeal(args: {
  profitMargin: number;
  monthlyProfit: number;
  cashOnCashRoi: number | null;
}): number {
  if (args.monthlyProfit <= 0) return Math.max(0, 10 + args.profitMargin); // negative deals score low

  // Margin contributes up to 50 pts (40% margin => full marks).
  const marginPts = clamp((args.profitMargin / 40) * 50, 0, 50);

  // Absolute monthly profit contributes up to 30 pts ($2,000+/mo => full).
  const profitPts = clamp((args.monthlyProfit / 2000) * 30, 0, 30);

  // Cash-on-cash ROI contributes up to 20 pts (50%+ => full). If no upfront
  // investment, treat as neutral-high (15).
  const roiPts =
    args.cashOnCashRoi === null
      ? 15
      : clamp((args.cashOnCashRoi / 50) * 20, 0, 20);

  return Math.round(clamp(marginPts + profitPts + roiPts, 0, 100));
}

function ratingFromScore(score: number): DealRating {
  if (score >= 75) return "excellent";
  if (score >= 55) return "good";
  if (score >= 35) return "fair";
  return "poor";
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Convenience for listing cards: projected operator profit at the owner's ask. */
export function quickListingRoi(p: {
  estimated_market_rent: number | string;
  desired_monthly_rent: number | string;
}): { monthlyProfit: number; margin: number } {
  const rent = Number(p.estimated_market_rent) || 0;
  const offer = Number(p.desired_monthly_rent) || 0;
  // assume ~20% of rent in operating expenses as a rough default for the card
  const expenses = rent * 0.2;
  const monthlyProfit = rent - offer - expenses;
  const margin = rent > 0 ? (monthlyProfit / rent) * 100 : 0;
  return { monthlyProfit, margin };
}
