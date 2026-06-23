import { AppNav } from "@/components/app-nav";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("admin");
  return (
    <div className="min-h-screen bg-muted/20">
      <AppNav
        role={user.profile.role}
        name={user.profile.full_name}
        email={user.email}
      />
      <main className="container py-8">{children}</main>
    </div>
  );
}
