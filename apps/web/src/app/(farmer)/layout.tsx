import { redirect } from "next/navigation";
import { getMe } from "@/lib/session";
import { FarmerShell } from "@/components/farmer/FarmerShell";

export const dynamic = "force-dynamic";

export default async function FarmerLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me) redirect("/login");
  if (me.user.role !== "farmer") redirect("/admin");

  return <FarmerShell name={me.profile?.fullName ?? me.user.emailMasked}>{children}</FarmerShell>;
}
