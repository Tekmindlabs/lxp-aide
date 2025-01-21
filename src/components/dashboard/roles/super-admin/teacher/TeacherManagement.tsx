'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Status } from "@prisma/client";
import { api } from "@/utils/api";
import { TeacherList } from "./TeacherList";
import { TeacherForm } from "./TeacherForm";

interface SearchFilters {
	search: string;
	subjectId?: string;
	classId?: string;
	status?: Status;
}

export const TeacherManagement = () => {
	const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
	const [filters, setFilters] = useState<SearchFilters>({
		search: "",
	});

	const { data: teachers, isLoading } = api.teacher.searchTeachers.useQuery(filters);
	const { data: subjects } = api.subject.searchSubjects.useQuery({});
	const { data: classes } = api.class.searchClasses.useQuery({});

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Teacher Management</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="mb-6 space-y-4">
						<div className="flex space-x-4">
							<Input
								placeholder="Search teachers..."
								value={filters.search}
								onChange={(e) => setFilters({ ...filters, search: e.target.value })}
								className="max-w-sm"
							/>
							<Select
								value={filters.subjectId}
								onValueChange={(value) => setFilters({ ...filters, subjectId: value })}
							>
								<SelectTrigger className="w-[200px]">
									<SelectValue placeholder="Filter by Subject" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">All Subjects</SelectItem>
									{subjects?.map((subject) => (
										<SelectItem key={subject.id} value={subject.id}>
											{subject.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select
								value={filters.classId}
								onValueChange={(value) => setFilters({ ...filters, classId: value })}
							>
								<SelectTrigger className="w-[200px]">
									<SelectValue placeholder="Filter by Class" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">All Classes</SelectItem>
									{classes?.map((cls) => (
										<SelectItem key={cls.id} value={cls.id}>
											{cls.name}
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
						<TeacherList 
							teachers={teachers || []} 
							onSelect={setSelectedTeacherId}
						/>
						<TeacherForm 
							selectedTeacher={teachers?.find(t => t.id === selectedTeacherId)}
							subjects={subjects || []}
							classes={classes || []}
							onSuccess={() => setSelectedTeacherId(null)}
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};