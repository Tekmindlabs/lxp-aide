import { ProgramManagement } from "@/components/dashboard/roles/super-admin/program/ProgramManagement";

export default function ProgramPage() {
	return (
		<div className="flex-1 space-y-4 p-8 pt-6">
			<div className="flex items-center justify-between space-y-2">
				<h2 className="text-3xl font-bold tracking-tight">Program Management</h2>
			</div>
			<ProgramManagement />
		</div>
	);
}