'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/utils/api";

interface CoordinatorDetailsProps {
	coordinatorId: string;
	onBack: () => void;
}

export const CoordinatorDetails = ({ coordinatorId, onBack }: CoordinatorDetailsProps) => {
	const { data: coordinator, isLoading } = api.coordinator.getCoordinator.useQuery(coordinatorId);

	if (isLoading) return <div>Loading...</div>;
	if (!coordinator) return <div>Coordinator not found</div>;

	return (
		<div className="space-y-4">
			<Button onClick={onBack} variant="outline">Back to List</Button>
			
			<Card>
				<CardHeader>
					<CardTitle>Coordinator Details</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<h3 className="font-semibold">Name</h3>
						<p>{coordinator.name}</p>
					</div>
					
					<div>
						<h3 className="font-semibold">Email</h3>
						<p>{coordinator.email}</p>
					</div>

					<div>
						<h3 className="font-semibold">Status</h3>
						<Badge variant={coordinator.status === "ACTIVE" ? "default" : "outline"}>
							{coordinator.status}
						</Badge>
					</div>

					<div>
						<h3 className="font-semibold">Assigned Programs</h3>
						<div className="flex flex-wrap gap-2 mt-2">
							{coordinator.coordinatorProfile?.programs.map((program: { id: string; name: string; level: string }) => (
								<Badge key={program.id} variant="outline">
									{program.name} ({program.level})
								</Badge>
							))}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};
