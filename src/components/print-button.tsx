"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Triggers the browser print dialog (used to save the agreement as a PDF). */
export function PrintButton({ label = "Print / Save as PDF" }: { label?: string }) {
  return (
    <Button variant="outline" onClick={() => window.print()} className="print:hidden">
      <Printer className="h-4 w-4" />
      {label}
    </Button>
  );
}
