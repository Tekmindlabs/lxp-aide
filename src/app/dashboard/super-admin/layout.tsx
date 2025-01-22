'use client';

import SuperAdminSidebar from "@/components/dashboard/roles/super-admin/layout/SuperAdminSidebar";

export default function SuperAdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex h-screen">
			<SuperAdminSidebar />
			<main className="flex-1 overflow-y-auto p-8">
				{children}
			</main>
		</div>
	);
}