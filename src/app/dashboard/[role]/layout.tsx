import { SuperAdminSidebar } from "@/components/dashboard/roles/super-admin/layout/SuperAdminSidebar";

export default function DashboardLayout({
	children,
	params,
  }: {
	children: React.ReactNode;
	params: { role: string };
  }) {
	// Remove hidden class and add debugging
	const sidebar = params.role === "super-admin" ? (
	  <div className="md:flex md:w-64 md:flex-col border-r">  {/* Added border-r for visibility */}
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