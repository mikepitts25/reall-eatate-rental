"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { moderateListingAction } from "@/app/admin/actions";
import type { ListingStatus } from "@/lib/supabase/database.types";

export function AdminListingModeration({
  propertyId,
  status,
}: {
  propertyId: string;
  status: ListingStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const moderate = (next: "active" | "archived") =>
    startTransition(async () => {
      await moderateListingAction(propertyId, next);
      router.refresh();
    });

  return (
    <div className="flex gap-2">
      {status !== "archived" ? (
        <Button
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => moderate("archived")}
        >
          Remove
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => moderate("active")}
        >
          Restore
        </Button>
      )}
    </div>
  );
}
