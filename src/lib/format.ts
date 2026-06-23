/** Display/formatting helpers used across the UI. */

export function formatCurrency(
  value: number | string | null | undefined,
  opts: { cents?: boolean } = {}
): string {
  const n = typeof value === "string" ? parseFloat(value) : value ?? 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  }).format(Number.isFinite(n) ? n : 0);
}

export function formatPercent(value: number, fractionDigits = 1): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(fractionDigits)}%`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatRelative(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

const TITLE_CASE_OVERRIDES: Record<string, string> = {
  single_family: "Single Family",
  multi_family: "Multi Family",
  under_offer: "Under Offer",
  owner_signed: "Owner Signed",
  operator_signed: "Operator Signed",
};

/** Turn an enum value like `single_family` into `Single Family`. */
export function humanize(value: string | null | undefined): string {
  if (!value) return "—";
  if (TITLE_CASE_OVERRIDES[value]) return TITLE_CASE_OVERRIDES[value];
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
