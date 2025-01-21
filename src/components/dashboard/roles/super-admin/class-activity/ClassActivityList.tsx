import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface Props {
	onEdit: (id: string) => void;
}

export default function ClassActivityList({ onEdit }: Props) {
	const utils = api.useContext();
	const { data: activities } = api.classActivity.getAll.useQuery({});
	const deleteMutation = api.classActivity.delete.useMutation({
		onSuccess: () => {
			utils.classActivity.getAll.invalidate();
		},
	});

	const handleDelete = (id: string) => {
		if (window.confirm("Are you sure you want to delete this activity?")) {
			deleteMutation.mutate(id);
		}
	};

	return (
		<Card>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Title</TableHead>
						<TableHead>Type</TableHead>
						<TableHead>Deadline</TableHead>
						<TableHead>Class/Group</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{activities?.map((activity) => (
						<TableRow key={activity.id}>
							<TableCell>{activity.title}</TableCell>
							<TableCell>{activity.type}</TableCell>
							<TableCell>
								{activity.deadline
									? format(new Date(activity.deadline), "PPP")
									: "No deadline"}
							</TableCell>
							<TableCell>
								{activity.classGroup?.name || activity.class?.name || "N/A"}
							</TableCell>
							<TableCell>
								<div className="flex space-x-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => onEdit(activity.id)}
									>
										Edit
									</Button>
									<Button
										variant="destructive"
										size="sm"
										onClick={() => handleDelete(activity.id)}
									>
										Delete
									</Button>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</Card>
	);
}