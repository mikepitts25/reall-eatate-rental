"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { Building2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FieldError, FormMessage } from "@/components/field-error";
import { signUpAction, type AuthState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating account…" : "Create account"}
    </Button>
  );
}

export function SignupForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(
    signUpAction,
    {}
  );
  const params = useSearchParams();
  const initialRole =
    params.get("role") === "operator" ? "operator" : "owner";
  const [role, setRole] = useState<"owner" | "operator">(initialRole);

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage message={state.error} />

      <div>
        <Label>I want to…</Label>
        <input type="hidden" name="role" value={role} />
        <div className="mt-1.5 grid grid-cols-2 gap-3">
          <RoleCard
            active={role === "owner"}
            onClick={() => setRole("owner")}
            icon={<Building2 className="h-5 w-5" />}
            title="List a property"
            subtitle="Owner"
          />
          <RoleCard
            active={role === "operator"}
            onClick={() => setRole("operator")}
            icon={<KeyRound className="h-5 w-5" />}
            title="Operate rentals"
            subtitle="Operator"
          />
        </div>
        <FieldError message={state.fieldErrors?.role} />
      </div>

      <div>
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          placeholder="Jane Doe"
          className="mt-1.5"
          required
        />
        <FieldError message={state.fieldErrors?.fullName} />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="mt-1.5"
          required
        />
        <FieldError message={state.fieldErrors?.email} />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          className="mt-1.5"
          required
        />
        <FieldError message={state.fieldErrors?.password} />
      </div>

      <div>
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            name="acceptedTerms"
            className="mt-0.5 h-4 w-4 rounded border-input"
          />
          <span>
            I agree to the{" "}
            <a
              href="/legal/terms"
              target="_blank"
              className="font-medium text-primary hover:underline"
            >
              Terms
            </a>
            ,{" "}
            <a
              href="/legal/privacy"
              target="_blank"
              className="font-medium text-primary hover:underline"
            >
              Privacy Policy
            </a>
            , and consent to{" "}
            <a
              href="/legal/esign-consent"
              target="_blank"
              className="font-medium text-primary hover:underline"
            >
              electronic signatures
            </a>
            .
          </span>
        </label>
        <FieldError message={state.fieldErrors?.acceptedTerms} />
      </div>

      <SubmitButton />
    </form>
  );
}

function RoleCard({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
        active
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "hover:bg-accent"
      )}
    >
      <span className={active ? "text-primary" : "text-muted-foreground"}>
        {icon}
      </span>
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs text-muted-foreground">{subtitle}</span>
    </button>
  );
}
