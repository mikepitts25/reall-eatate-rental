import { Badge, type BadgeProps } from "@/components/ui/badge";
import { humanize } from "@/lib/format";
import type {
  AgreementStatus,
  ListingStatus,
  PaymentStatus,
  ProposalStatus,
} from "@/lib/supabase/database.types";

type AnyStatus =
  | ListingStatus
  | ProposalStatus
  | AgreementStatus
  | PaymentStatus;

const VARIANT: Record<string, BadgeProps["variant"]> = {
  // listings
  draft: "secondary",
  active: "success",
  under_offer: "warning",
  leased: "default",
  archived: "outline",
  // proposals
  pending: "warning",
  countered: "default",
  accepted: "success",
  rejected: "destructive",
  withdrawn: "outline",
  // agreements
  sent: "secondary",
  owner_signed: "default",
  operator_signed: "default",
  terminated: "destructive",
  // payments
  scheduled: "secondary",
  paid: "success",
  late: "warning",
  missed: "destructive",
};

export function StatusBadge({ status }: { status: AnyStatus | string }) {
  return (
    <Badge variant={VARIANT[status] ?? "secondary"}>{humanize(status)}</Badge>
  );
}
