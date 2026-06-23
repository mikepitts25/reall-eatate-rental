"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/field-error";
import { updateProfileAction } from "./actions";
import type { UserRole } from "@/lib/supabase/database.types";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save changes"}
    </Button>
  );
}

export function AccountForm({
  profile,
  email,
  role,
}: {
  profile: {
    full_name: string | null;
    phone: string | null;
    company_name: string | null;
    bio: string | null;
  };
  email: string | null;
  role: UserRole;
}) {
  const [state, formAction] = useActionState(updateProfileAction, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.success && (
        <FormMessage message="Profile updated." variant="success" />
      )}
      <FormMessage message={state.error} />

      <div>
        <Label>Email</Label>
        <Input value={email ?? ""} disabled className="mt-1.5" />
      </div>

      <div>
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={profile.full_name ?? ""}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          defaultValue={profile.phone ?? ""}
          className="mt-1.5"
        />
      </div>

      {role === "operator" && (
        <div>
          <Label htmlFor="company_name">Company name</Label>
          <Input
            id="company_name"
            name="company_name"
            defaultValue={profile.company_name ?? ""}
            className="mt-1.5"
          />
        </div>
      )}

      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={profile.bio ?? ""}
          className="mt-1.5"
          placeholder={
            role === "operator"
              ? "Tell owners about your operating experience and track record."
              : "Tell operators a little about yourself and your property."
          }
        />
      </div>

      <SaveButton />
    </form>
  );
}
