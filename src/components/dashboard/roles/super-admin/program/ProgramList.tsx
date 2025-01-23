"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/utils/api";

interface ProgramListProps {
	programs: any[];
	onSelect: (id: string) => void;
	calendars: any[];
}

export const ProgramList = ({
	programs,
	onSelect,
	calendars
}: ProgramListProps) => {
	const utils = api.useContext();
	const deleteMutation = api.program.deleteProgram.useMutation({
		onSuccess: () => {
			utils.program.searchPrograms.invalidate();
		},
	});

	return (
		<div className="space-y-4">
			{programs.map((program) => (
				<Card key={program.id}>
					<CardHeader>
						<div className="flex justify-between items-center">
							<CardTitle>{program.name}</CardTitle>
							<div className="flex space-x-2">
								<Button variant="outline" size="sm" onClick={() => onSelect(program.id)}>
									Edit
								</Button>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => deleteMutation.mutate(program.id)}
								>
									Delete
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<p>{program.description}</p>
							<p>Calendar: {program.calendar?.name || 'Not assigned'}</p>
							<p>Coordinator: {program.coordinator?.user.name || 'Not assigned'}</p>
							<p>Status: {program.status}</p>
							<p>Class Groups: {program.classGroups?.length || 0}</p>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
};
