import { SystemMetrics } from "@/components/dashboard/SystemMetrics";

export default function SuperAdminDashboardPage() {
	return (
		<div className="space-y-8">
			<h1 className="text-3xl font-bold">Dashboard</h1>
			<SystemMetrics />
		</div>
	);
}
