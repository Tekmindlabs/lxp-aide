'use client';

import SuperAdminSidebar from "@/components/dashboard/roles/super-admin/layout/SuperAdminSidebar";

export default function SuperAdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="container">
			<div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 pt-6">
				<aside className="lg:w-1/5">
					<SuperAdminSidebar />
				</aside>
				<div className="flex-1">
					{children}
				</div>
			</div>
		</div>
	);
}