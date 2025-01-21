import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Status } from "@prisma/client";
import { api } from "@/utils/api";
import { SubjectList } from "./SubjectList";
import { SubjectForm } from "./SubjectForm";

interface SearchFilters {
	search: string;
	classGroupId?: string;
	programId?: string;
	status?: Status;
	teacherId?: string;
}

export const SubjectManagement = () => {
	const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
	const [filters, setFilters] = useState<SearchFilters>({
		search: "",
	});

	const { data: subjects, isLoading } = api.subject.searchSubjects.useQuery(filters);
	const { data: classGroups } = api.classGroup.getAllClassGroups.useQuery();
	const { data: programs } = api.program.getAllPrograms.useQuery();
	const { data: teachers } = api.subject.getAvailableTeachers.useQuery();

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Subject Management</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="mb-6 space-y-4">
						<div className="flex space-x-4">
							<Input
								placeholder="Search subjects..."
								value={filters.search}
								onChange={(e) => setFilters({ ...filters, search: e.target.value })}
								className="max-w-sm"
							/>
							<Select
								value={filters.programId}
								onValueChange={(value) => setFilters({ ...filters, programId: value })}
							>
								<SelectTrigger className="w-[200px]">
									<SelectValue placeholder="Filter by Program" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">All Programs</SelectItem>
									{programs?.map((program) => (
										<SelectItem key={program.id} value={program.id}>
											{program.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select
								value={filters.classGroupId}
								onValueChange={(value) => setFilters({ ...filters, classGroupId: value })}
							>
								<SelectTrigger className="w-[200px]">
									<SelectValue placeholder="Filter by Class Group" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">All Class Groups</SelectItem>
									{classGroups?.map((group) => (
										<SelectItem key={group.id} value={group.id}>
											{group.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select
								value={filters.teacherId}
								onValueChange={(value) => setFilters({ ...filters, teacherId: value })}
							>
								<SelectTrigger className="w-[200px]">
									<SelectValue placeholder="Filter by Teacher" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">All Teachers</SelectItem>
									{teachers?.map((teacher) => (
										<SelectItem key={teacher.id} value={teacher.id}>
											{teacher.user.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select
								value={filters.status}
								onValueChange={(value) => setFilters({ ...filters, status: value as Status })}
							>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">All Status</SelectItem>
									{Object.values(Status).map((status) => (
										<SelectItem key={status} value={status}>
											{status}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-4">
						<SubjectList 
							subjects={subjects || []} 
							onSelect={setSelectedSubjectId}
						/>
						<SubjectForm 
							selectedSubject={subjects?.find(s => s.id === selectedSubjectId)}
							classGroups={classGroups || []}
							teachers={teachers || []}
							onSuccess={() => setSelectedSubjectId(null)}
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};