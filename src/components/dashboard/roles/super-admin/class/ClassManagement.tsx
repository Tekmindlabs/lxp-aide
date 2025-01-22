'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Status } from "@prisma/client";
import { api } from "@/trpc/react";
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
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [filters, setFilters] = useState<SearchFilters>({
		search: "",
	});

	const { data: classes, isLoading } = api.class.searchClasses.useQuery(filters);
	const { data: classGroups } = api.classGroup.getAllClassGroups.useQuery();
	const { data: teachers } = api.subject.getAvailableTeachers.useQuery();

	const handleEdit = (id: string) => {
		setSelectedClassId(id);
		setIsFormOpen(true);
	};

	const handleCreate = () => {
		setSelectedClassId(null);
		setIsFormOpen(true);
	};

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>Class Management</CardTitle>
					<Button onClick={handleCreate}>Create Class</Button>
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
								value={filters.classGroupId || "all"}
								onValueChange={(value) => setFilters({ ...filters, classGroupId: value === "all" ? undefined : value })}
							>
								<SelectTrigger className="w-[200px]">
									<SelectValue placeholder="Filter by Class Group" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Class Groups</SelectItem>
									{classGroups?.map((group) => (
										<SelectItem key={group.id} value={group.id}>
											{group.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select
								value={filters.teacherId || "all"}
								onValueChange={(value) => setFilters({ ...filters, teacherId: value === "all" ? undefined : value })}
							>
								<SelectTrigger className="w-[200px]">
									<SelectValue placeholder="Filter by Teacher" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Teachers</SelectItem>
									{teachers?.map((teacher) => (
										<SelectItem key={teacher.id} value={teacher.id}>
											{teacher.user.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select
								value={filters.status || "all"}
								onValueChange={(value) => setFilters({ ...filters, status: value === "all" ? undefined : value as Status })}
							>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
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
							onSelect={handleEdit}
						/>
						<ClassForm 
							isOpen={isFormOpen}
							onClose={() => setIsFormOpen(false)}
							selectedClass={classes?.find(c => c.id === selectedClassId)}
							classGroups={classGroups || []}
							teachers={teachers || []}
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};