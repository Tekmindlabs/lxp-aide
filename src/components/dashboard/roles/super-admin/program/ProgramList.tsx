"use client";


import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/utils/api";
import { Program, Status } from "@prisma/client";

interface ProgramListProps {
	programs: (Program & {
		coordinator?: {
			user: {
				name: string | null;
			};
		} | null;
		classGroups: any[];
	})[];
	onSelect: (id: string) => void;
	onAssociateAcademicYear: (programId: string, academicYearId: string) => void;
	academicYears: any[];
}

export const ProgramList = ({ 
	programs, 
	onSelect, 
	onAssociateAcademicYear,
	academicYears 
}: ProgramListProps) => {
	const utils = api.useContext();
	const deleteMutation = api.program.deleteProgram.useMutation({
		onSuccess: () => {
			utils.program.searchPrograms.invalidate();
		},
	});

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{programs.map((program) => (
				<Card key={program.id}>
					<CardContent className="p-4">
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<h3 className="font-semibold">{program.name}</h3>
								<span className="text-sm text-gray-500">{program.level}</span>
							</div>
							<p className="text-sm">{program.description}</p>
							<p className="text-sm">
								Coordinator:{" "}
								{program.coordinator?.user.name || "Not assigned"}
							</p>
							<p className="text-sm">
								Class Groups: {program.classGroups.length}
							</p>
							<p className="text-sm">Status: {program.status}</p>
							
							<div className="pt-2">
								<Select
									onValueChange={(academicYearId) => onAssociateAcademicYear(program.id, academicYearId)}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Associate Academic Year" />
									</SelectTrigger>
									<SelectContent>
										{academicYears.map((year) => (
											<SelectItem key={year.id} value={year.id}>
												{year.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="flex space-x-2 pt-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => onSelect(program.id)}
								>
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
					</CardContent>
				</Card>
			))}
		</div>
	);
};