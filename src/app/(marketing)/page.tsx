import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Calculator,
  HandCoins,
  MessagesSquare,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { analyzeDeal } from "@/lib/finance";

const example = analyzeDeal({
  monthlyMortgage: 3000,
  marketRent: 6000,
  operatorOffer: 4000,
  monthlyExpenses: 1200,
  leaseTermMonths: 24,
});

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="container grid gap-10 py-20 lg:grid-cols-2 lg:py-28">
        <div className="flex flex-col justify-center">
          <span className="mb-4 inline-flex w-fit items-center gap-1 rounded-full border bg-muted px-3 py-1 text-xs font-medium">
            <TrendingUp className="h-3.5 w-3.5" /> The lease arbitrage marketplace
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Guaranteed rent for owners.{" "}
            <span className="text-primary">Real deals</span> for operators.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Owners list their property and collect a guaranteed monthly check —
            no tenants, maintenance, or vacancies. Operators lease the property
            and run it for profit. LeaseFlip connects both sides.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/signup?role=owner">
                I own a property <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/signup?role=operator">I operate rentals</Link>
            </Button>
          </div>
        </div>

        {/* Example deal card */}
        <Card className="self-center">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">
              Example deal
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Stat label="Owner mortgage" value={formatCurrency(3000)} />
              <Stat label="Market rent" value={formatCurrency(6000)} />
              <Stat
                label="Operator offer"
                value={formatCurrency(4000)}
                highlight
              />
              <Stat
                label="Owner net / mo"
                value={formatCurrency(example.ownerMonthlyNet)}
                positive
              />
            </div>
            <div className="mt-6 rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                Operator monthly profit
              </p>
              <p className="text-3xl font-bold text-success">
                {formatCurrency(example.monthlyProfit)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {example.profitMargin.toFixed(0)}% margin · after{" "}
                {formatCurrency(1200)} expenses
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* How it works */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            How LeaseFlip works
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Card key={s.title}>
                <CardContent className="p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    STEP {i + 1}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col gap-2">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t py-20">
        <div className="container flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to make the deal?
          </h2>
          <p className="mt-3 max-w-md text-muted-foreground">
            Join LeaseFlip and start listing or browsing opportunities today.
          </p>
          <Button size="lg" className="mt-6" asChild>
            <Link href="/signup">
              Create your account <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function Stat({
  label,
  value,
  highlight,
  positive,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  positive?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          "text-lg font-semibold " +
          (positive ? "text-success " : "") +
          (highlight ? "text-primary" : "")
        }
      >
        {value}
      </p>
    </div>
  );
}

const STEPS = [
  {
    icon: Building2,
    title: "Owners list the property",
    body: "Add photos, mortgage, market rent, and lease restrictions. Set the guaranteed monthly income you want.",
  },
  {
    icon: HandCoins,
    title: "Operators submit proposals",
    body: "Operators browse listings, run the numbers in the profit calculator, and send guaranteed-rent offers.",
  },
  {
    icon: MessagesSquare,
    title: "Negotiate & sign",
    body: "Compare offers, message securely, agree on terms, and generate a draft agreement — all in one place.",
  },
];

const FEATURES = [
  {
    icon: Calculator,
    title: "Profit calculator",
    body: "Instant ROI, margin, and cash-on-cash analysis for every deal.",
  },
  {
    icon: TrendingUp,
    title: "Smart marketplace",
    body: "Search and filter by location, property type, and projected ROI.",
  },
  {
    icon: MessagesSquare,
    title: "Secure messaging",
    body: "Private owner ↔ operator chat scoped to each proposal.",
  },
  {
    icon: ShieldCheck,
    title: "Agreements & payments",
    body: "Generate agreements and track monthly payment obligations.",
  },
];
