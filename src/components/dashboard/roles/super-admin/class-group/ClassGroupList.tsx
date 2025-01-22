'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/utils/api";
import { ClassGroup, Status } from "@prisma/client";

interface ClassGroupListProps {
	classGroups: (ClassGroup & {
		program: {
			name: string;
		};
		classes: any[];
		subjects: any[];
	})[];
	onEdit: (id: string) => void;
}

export const ClassGroupList = ({ classGroups, onEdit }: ClassGroupListProps) => {
	const utils = api.useContext();
	const deleteMutation = api.classGroup.deleteClassGroup.useMutation({
		onSuccess: () => {
			utils.classGroup.getAllClassGroups.invalidate();
		},
	});

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{classGroups.map((group) => (
				<Card key={group.id} className="hover:bg-accent/5">
					<CardContent className="p-4">
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<h3 className="font-semibold">{group.name}</h3>
								<span className={`text-sm ${
									group.status === Status.ACTIVE ? 'text-green-500' : 'text-yellow-500'
								}`}>
									{group.status}
								</span>
							</div>
							<p className="text-sm text-muted-foreground">{group.program.name}</p>
							{group.description && (
								<p className="text-sm text-muted-foreground">{group.description}</p>
							)}
							<div className="flex items-center gap-4 text-sm text-muted-foreground">
								<p>Classes: {group.classes.length}</p>
								<p>Subjects: {group.subjects.length}</p>
							</div>
							<div className="flex space-x-2 pt-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => onEdit(group.id)}
								>
									Edit
								</Button>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => {
										if (confirm('Are you sure you want to delete this class group?')) {
											deleteMutation.mutate(group.id);
										}
									}}
								>
									Delete
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
};