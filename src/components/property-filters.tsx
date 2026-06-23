"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const PROPERTY_TYPES = [
  "single_family",
  "multi_family",
  "condo",
  "townhouse",
  "apartment",
  "other",
] as const;

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "roi", label: "Highest ROI" },
  { value: "rent_low", label: "Rent: low to high" },
  { value: "rent_high", label: "Rent: high to low" },
] as const;

export function PropertyFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value && value !== "all") next.set(key, value);
      else next.delete(key);
      router.replace(`/properties?${next.toString()}`);
    },
    [params, router]
  );

  return (
    <div className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-4">
      <div className="md:col-span-2">
        <Label className="text-xs text-muted-foreground">Search</Label>
        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            defaultValue={params.get("q") ?? ""}
            placeholder="Title, city, description…"
            className="pl-9"
            onChange={(e) => setParam("q", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Property type</Label>
        <Select
          defaultValue={params.get("property_type") ?? "all"}
          onValueChange={(v) => setParam("property_type", v)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {PROPERTY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t
                  .split("_")
                  .map((w) => w[0].toUpperCase() + w.slice(1))
                  .join(" ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Sort by</Label>
        <Select
          defaultValue={params.get("sort") ?? "newest"}
          onValueChange={(v) => setParam("sort", v)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">City</Label>
        <Input
          defaultValue={params.get("city") ?? ""}
          placeholder="e.g. Austin"
          className="mt-1"
          onChange={(e) => setParam("city", e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Min est. ROI ($/mo)</Label>
        <Input
          type="number"
          defaultValue={params.get("min_roi") ?? ""}
          placeholder="0"
          className="mt-1"
          onChange={(e) => setParam("min_roi", e.target.value)}
        />
      </div>
    </div>
  );
}
