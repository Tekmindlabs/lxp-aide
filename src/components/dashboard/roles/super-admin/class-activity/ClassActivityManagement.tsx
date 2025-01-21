import { useState } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ClassActivityList from "./ClassActivityList";
import ClassActivityForm from "./ClassActivityForm";

export default function ClassActivityManagement() {
	const [isCreating, setIsCreating] = useState(false);
	const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-3xl font-bold tracking-tight">Class Activities</h2>
				<Button onClick={() => setIsCreating(true)}>Create Activity</Button>
			</div>

			<div className="grid gap-4">
				{(isCreating || selectedActivity) ? (
					<Card className="p-6">
						<ClassActivityForm
							activityId={selectedActivity}
							onClose={() => {
								setIsCreating(false);
								setSelectedActivity(null);
							}}
						/>
					</Card>
				) : (
					<ClassActivityList onEdit={setSelectedActivity} />
				)}
			</div>
		</div>
	);
}