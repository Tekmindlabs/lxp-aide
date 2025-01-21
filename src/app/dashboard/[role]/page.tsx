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
  
  // Normalize the role to uppercase and replace hyphens with underscores
  const normalizedRole = params.role.toUpperCase().replace(/-/g, '_');

  console.log({
    sessionExists: !!session,
    userRoles: session?.user?.roles,
    currentRole: normalizedRole,
  });

  if (!session) {
    redirect('/auth/signin');
  }

  // Check if user has the required role (case-insensitive)
  const userRoles = session.user.roles.map(role => role.toLowerCase());
  if (!userRoles.includes(params.role.toLowerCase())) {
    redirect(`/dashboard/${session.user.roles[0]}`);
  }

  return <DashboardContent role={normalizedRole as keyof typeof DefaultRoles} />;
}