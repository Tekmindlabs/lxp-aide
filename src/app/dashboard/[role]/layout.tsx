import { SuperAdminSidebar } from "@/components/dashboard/roles/super-admin/layout/SuperAdminSidebar";

export default function DashboardLayout({
	children,
	params,
  }: {
	children: React.ReactNode;
	params: { role: string };
  }) {
	console.log("Current role:", params.role);
	console.log("Role comparison:", {
	  role: params.role,
	  isLowerCase: params.role.toLowerCase(),
	  matches: params.role.toLowerCase() === "super-admin"
	});
	
	const sidebar = params.role.toLowerCase() === "super-admin" ? (
		<div className="flex w-64 flex-col border-r">
		  <SuperAdminSidebar />
		</div>
	  ) : null;
  
	return (
	  <div className="flex min-h-screen">
		{sidebar}
		<div className="flex-1">{children}</div>
	  </div>
	);
  }