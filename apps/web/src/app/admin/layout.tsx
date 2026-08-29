import { redirect } from "next/navigation";
import { getMe } from "@/lib/session";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me) redirect("/admin-login");
  if (me.user.role === "farmer") redirect("/dashboard");

  return <AdminShell email={me.user.emailMasked}>{children}</AdminShell>;
}
