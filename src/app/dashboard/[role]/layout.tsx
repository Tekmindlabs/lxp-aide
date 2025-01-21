import SuperAdminSidebar from "@/components/dashboard/roles/super-admin/layout/SuperAdminSidebar";

export default function DashboardLayout({
	children,
	params,
  }: {
	children: React.ReactNode;
	params: { role: string };
  }) {
	console.log("Layout Role:", {
	  original: params.role,
	  normalized: params.role.toLowerCase().replace(/-/g, '_')
	});
  
	try {
	  const sidebar = params.role.toLowerCase().replace(/-/g, '_') === "super_admin" ? (
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
	} catch (error) {
	  console.error("Error in DashboardLayout:", error);
	  return <div>Error loading dashboard</div>;
	}
  }