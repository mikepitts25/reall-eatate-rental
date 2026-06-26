import Link from "next/link";

/** Shared shell for legal/policy pages with a consistent header + review notice. */
export function LegalDoc({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container max-w-3xl py-12">
      <Link
        href="/"
        className="text-sm font-medium text-primary hover:underline"
      >
        ← Back to LeaseFlip
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Last updated: {lastUpdated}
      </p>

      <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        <strong>Template notice:</strong> This document is a placeholder provided
        for the LeaseFlip MVP and is <em>not</em> legal advice. Replace it with
        copy reviewed by a licensed attorney before launch.
      </div>

      <div className="prose-legal mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
        {children}
      </div>
    </div>
  );
}

/** A titled section within a legal document. */
export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
      {children}
    </section>
  );
}
