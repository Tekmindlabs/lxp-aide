import { SuperAdminSidebar } from "@/components/dashboard/roles/super-admin/layout/SuperAdminSidebar";

export default function DashboardLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: { role: string };
}) {
	return (
		<div className="flex min-h-screen">
			{params.role === "super-admin" && (
				<div className="hidden md:flex md:w-64 md:flex-col">
					<SuperAdminSidebar />
				</div>
			)}
			<div className="flex-1">
				{children}
			</div>
		</div>
	);
}