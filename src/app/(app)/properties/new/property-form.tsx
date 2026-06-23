"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldError, FormMessage } from "@/components/field-error";
import {
  createPropertyAction,
  type PropertyFormState,
} from "../actions";

const PROPERTY_TYPES = [
  { value: "single_family", label: "Single Family" },
  { value: "multi_family", label: "Multi Family" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "apartment", label: "Apartment" },
  { value: "other", label: "Other" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Publishing…" : "Publish listing"}
    </Button>
  );
}

export function PropertyForm() {
  const [state, formAction] = useActionState<PropertyFormState, FormData>(
    createPropertyAction,
    {}
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <FormMessage message={state.error} />

      <Card>
        <CardHeader>
          <CardTitle>Property details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Listing title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Modern 3BR Single-Family in Austin"
              className="mt-1.5"
              required
            />
            <FieldError message={fe.title} />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the property, neighborhood, condition, and ideal use."
              className="mt-1.5"
              rows={4}
            />
            <FieldError message={fe.description} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Property type</Label>
              <Select name="property_type" defaultValue="single_family">
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={fe.property_type} />
            </div>
            <div>
              <Label>Publish as</Label>
              <Select name="status" defaultValue="active">
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active (visible)</SelectItem>
                  <SelectItem value="draft">Draft (hidden)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <NumField name="bedrooms" label="Bedrooms" step="0.5" />
            <NumField name="bathrooms" label="Bathrooms" step="0.5" />
            <NumField name="square_feet" label="Square feet" step="1" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address_line1">Street address</Label>
            <Input id="address_line1" name="address_line1" className="mt-1.5" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" className="mt-1.5" required />
              <FieldError message={fe.city} />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" className="mt-1.5" required />
              <FieldError message={fe.state} />
            </div>
            <div>
              <Label htmlFor="postal_code">ZIP</Label>
              <Input id="postal_code" name="postal_code" className="mt-1.5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financials & terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <MoneyField name="monthly_mortgage" label="Monthly mortgage" />
            <MoneyField
              name="estimated_market_rent"
              label="Est. market rent /mo"
            />
            <MoneyField
              name="desired_monthly_rent"
              label="Guaranteed rent you want /mo"
            />
          </div>
          <FieldError message={fe.desired_monthly_rent} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="min_lease_months">Minimum lease (months)</Label>
              <Input
                id="min_lease_months"
                name="min_lease_months"
                type="number"
                defaultValue={12}
                min={1}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="available_from">Available from</Label>
              <Input
                id="available_from"
                name="available_from"
                type="date"
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="lease_restrictions">Lease restrictions</Label>
            <Textarea
              id="lease_restrictions"
              name="lease_restrictions"
              placeholder="e.g. No short-term rentals under 30 days. No pets over 50lbs."
              className="mt-1.5"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <SubmitButton />
      </div>
    </form>
  );
}

function NumField({
  name,
  label,
  step,
}: {
  name: string;
  label: string;
  step: string;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type="number"
        step={step}
        min={0}
        className="mt-1.5"
      />
    </div>
  );
}

function MoneyField({ name, label }: { name: string; label: string }) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <div className="relative mt-1.5">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          $
        </span>
        <Input
          id={name}
          name={name}
          type="number"
          min={0}
          step="1"
          defaultValue={0}
          className="pl-6"
          required
        />
      </div>
    </div>
  );
}
