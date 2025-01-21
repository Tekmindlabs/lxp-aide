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
	onSelect: (id: string) => void;
}

export const ClassGroupList = ({ classGroups, onSelect }: ClassGroupListProps) => {
	const utils = api.useContext();
	const deleteMutation = api.classGroup.deleteClassGroup.useMutation({
		onSuccess: () => {
			utils.classGroup.getAllClassGroups.invalidate();
		},
	});

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{classGroups.map((group) => (
				<Card key={group.id}>
					<CardContent className="p-4">
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<h3 className="font-semibold">{group.name}</h3>
								<span className="text-sm text-gray-500">{group.program.name}</span>
							</div>
							<p className="text-sm">{group.description}</p>
							<p className="text-sm">Classes: {group.classes.length}</p>
							<p className="text-sm">Subjects: {group.subjects.length}</p>
							<p className="text-sm">Status: {group.status}</p>
							<div className="flex space-x-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => onSelect(group.id)}
								>
									Edit
								</Button>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => deleteMutation.mutate(group.id)}
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