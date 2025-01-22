"use client";

import { type FC, useState } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ClassroomForm from "./ClassroomForm";
import ClassroomView from "./ClassroomView";
import { type RouterOutputs } from "@/utils/api";

type Classroom = RouterOutputs["classroom"]["getAll"][number];

const ClassroomManagement: FC = () => {
	const [isCreating, setIsCreating] = useState(false);
	const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
	const [isEditing, setIsEditing] = useState<string | null>(null);

	const { data: classrooms, isLoading } = api.classroom.getAll.useQuery();

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Classroom Management</CardTitle>
						<Button onClick={() => setIsCreating(true)} disabled={isCreating}>
							Create New Classroom
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{isCreating ? (
						<ClassroomForm onCancel={() => setIsCreating(false)} />
					) : isEditing ? (
						<ClassroomForm 
							classroomId={isEditing} 
							onCancel={() => setIsEditing(null)} 
						/>
					) : selectedClassroomId ? (
						<ClassroomView 
							classroomId={selectedClassroomId} 
							onBack={() => setSelectedClassroomId(null)} 
							onEdit={() => {
								setSelectedClassroomId(null);
								setIsEditing(selectedClassroomId);
							}}
						/>
					) : (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{classrooms?.map((classroom: Classroom) => (
								<Card 
									key={classroom.id} 
									className="cursor-pointer hover:bg-accent"
									onClick={() => setSelectedClassroomId(classroom.id)}
								>
									<CardContent className="p-4">
										<div className="flex justify-between items-start">
											<div>
												<h3 className="font-semibold">{classroom.name}</h3>
												<p className="text-sm text-muted-foreground">
													Capacity: {classroom.capacity}
												</p>
												{classroom.resources && (
													<p className="text-sm text-muted-foreground">
														Resources: {
															(() => {
																try {
																	const parsedResources = JSON.parse(classroom.resources);
																	return Array.isArray(parsedResources) ? parsedResources.join(", ") : classroom.resources;
																} catch (e) {
																	return classroom.resources;
																}
															})()
														}
													</p>
												)}
											</div>
											<Button
												variant="ghost"
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													setIsEditing(classroom.id);
												}}
											>
												Edit
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default ClassroomManagement;