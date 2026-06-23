import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/status-badge";
import { formatRelative } from "@/lib/format";
import type { Profile, Property, Proposal } from "@/lib/supabase/database.types";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const user = await requireUser();
  const supabase = await createClient();

  // Every proposal the user participates in is a conversation thread.
  const { data } = await supabase
    .from("proposals")
    .select(
      "*, properties(title), operator:profiles!proposals_operator_id_fkey(full_name, company_name), owner:profiles!proposals_owner_id_fkey(full_name, company_name)"
    )
    .or(`owner_id.eq.${user.id},operator_id.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  const threads = (data ?? []) as unknown as (Proposal & {
    properties: Pick<Property, "title">;
    operator: Pick<Profile, "full_name" | "company_name">;
    owner: Pick<Profile, "full_name" | "company_name">;
  })[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          Your secure conversations, one per proposal.
        </p>
      </div>

      {threads.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No conversations yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {threads.map((t) => {
              const counterpart =
                t.operator_id === user.id ? t.owner : t.operator;
              const name =
                counterpart.company_name || counterpart.full_name || "User";
              const initials = name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              return (
                <Link
                  key={t.id}
                  href={`/proposals/${t.id}`}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                >
                  <Avatar>
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {t.properties.title}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={t.status} />
                    <span className="text-xs text-muted-foreground">
                      {formatRelative(t.updated_at)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
