"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { updatePropertyStatusAction } from "@/app/(app)/properties/actions";
import type { ListingStatus } from "@/lib/supabase/database.types";

export function OwnerListingControls({
  propertyId,
  status,
}: {
  propertyId: string;
  status: ListingStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const setStatus = (next: "active" | "draft" | "archived") =>
    startTransition(async () => {
      await updatePropertyStatusAction(propertyId, next);
      router.refresh();
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" disabled={pending}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {status !== "active" && (
          <DropdownMenuItem onClick={() => setStatus("active")}>
            Publish (make active)
          </DropdownMenuItem>
        )}
        {status === "active" && (
          <DropdownMenuItem onClick={() => setStatus("draft")}>
            Unpublish (set draft)
          </DropdownMenuItem>
        )}
        {status !== "archived" && (
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setStatus("archived")}
          >
            Archive listing
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
