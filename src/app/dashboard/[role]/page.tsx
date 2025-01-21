import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { DefaultRoles } from "@/utils/permissions";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

export default async function RoleDashboard({
  params,
}: {
  params: { role: string };
}) {
  const session = await getServerSession(authOptions);
  
  // Add debugging
  console.log({
    sessionExists: !!session,
    userRoles: session?.user?.roles,
    currentRole: params.role
  });

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Make role check case insensitive
  if (!session.user.roles.map(r => r.toLowerCase())
      .includes(params.role.toLowerCase())) {
    redirect(`/dashboard/${session.user.roles[0]}`);
  }

  return <DashboardContent role={params.role as keyof typeof DefaultRoles} />;
}