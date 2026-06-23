import { requireUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AccountForm } from "./account-form";
import { humanize } from "@/lib/format";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Account settings</h1>
        <Badge variant="secondary">{humanize(user.profile.role)}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            This information is shown to your counterparties.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccountForm
            profile={{
              full_name: user.profile.full_name,
              phone: user.profile.phone,
              company_name: user.profile.company_name,
              bio: user.profile.bio,
            }}
            email={user.email}
            role={user.profile.role}
          />
        </CardContent>
      </Card>
    </div>
  );
}
