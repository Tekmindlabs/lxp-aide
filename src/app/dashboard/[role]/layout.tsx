import { SuperAdminSidebar } from "@/components/dashboard/roles/super-admin/layout/SuperAdminSidebar";

export default function DashboardLayout({
	children,
	params,
  }: {
	children: React.ReactNode;
	params: { role: string };
  }) {
	console.log("Current role:", params.role); // Debug log
	
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