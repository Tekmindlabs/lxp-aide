'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Status } from "@prisma/client";
import { api } from "@/utils/api";
import { ClassList } from "./ClassList";
import { ClassForm } from "./ClassForm";

interface SearchFilters {
	search: string;
	classGroupId?: string;
	teacherId?: string;
	status?: Status;
}

export const ClassManagement = () => {
	const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
	const [filters, setFilters] = useState<SearchFilters>({
		search: "",
	});

	const { data: classes, isLoading } = api.class.searchClasses.useQuery(filters);
	const { data: classGroups } = api.classGroup.getAllClassGroups.useQuery();
	const { data: teachers } = api.subject.getAvailableTeachers.useQuery();

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Class Management</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="mb-6 space-y-4">
						<div className="flex space-x-4">
							<Input
								placeholder="Search classes..."
								value={filters.search}
								onChange={(e) => setFilters({ ...filters, search: e.target.value })}
								className="max-w-sm"
							/>
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
						<ClassList 
							classes={classes || []} 
							onSelect={setSelectedClassId}
						/>
						<ClassForm 
							selectedClass={classes?.find(c => c.id === selectedClassId)}
							classGroups={classGroups || []}
							teachers={teachers || []}
							onSuccess={() => setSelectedClassId(null)}
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};