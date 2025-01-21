import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Status } from "@prisma/client";

interface Class {
	id: string;
	name: string;
	capacity: number;
	status: Status;
	classGroup: {
		name: string;
		program: {
			name: string;
		};
	};
	students: { id: string }[];
	teachers: {
		teacher: {
			user: {
				name: string;
			};
		};
	}[];
}

interface ClassListProps {
	classes: Class[];
	onSelect: (id: string) => void;
}

export const ClassList = ({ classes, onSelect }: ClassListProps) => {
	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Program</TableHead>
						<TableHead>Class Group</TableHead>
						<TableHead>Capacity</TableHead>
						<TableHead>Students</TableHead>
						<TableHead>Teachers</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{classes.map((cls) => (
						<TableRow key={cls.id}>
							<TableCell>{cls.name}</TableCell>
							<TableCell>{cls.classGroup.program.name}</TableCell>
							<TableCell>{cls.classGroup.name}</TableCell>
							<TableCell>{cls.capacity}</TableCell>
							<TableCell>{cls.students.length}</TableCell>
							<TableCell>
								{cls.teachers.map((t) => t.teacher.user.name).join(", ")}
							</TableCell>
							<TableCell>
								<Badge variant={cls.status === "ACTIVE" ? "success" : "secondary"}>
									{cls.status}
								</Badge>
							</TableCell>
							<TableCell>
								<Button
									variant="outline"
									size="sm"
									onClick={() => onSelect(cls.id)}
								>
									Edit
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
};