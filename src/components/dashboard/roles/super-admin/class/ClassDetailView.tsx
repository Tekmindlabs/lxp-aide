'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Status } from "@prisma/client";
import { api } from "@/trpc/react";

interface StudentProfile {
	id: string;
	user: {
		name: string;
		email: string;
	};
	dateOfBirth?: Date;
	activities: {
		status: string;
		grade?: number;
	}[];
	attendance: {
		status: string;
		date: Date;
	}[];
}

interface ClassDetailViewProps {
	isOpen: boolean;
	onClose: () => void;
	classId: string;
}

export const ClassDetailView = ({ isOpen, onClose, classId }: ClassDetailViewProps) => {
	const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

	const { data: classDetails } = api.class.getClassDetails.useQuery(
		{ id: classId },
		{ enabled: isOpen }
	);

	const { data: studentProfile } = api.student.getStudentProfile.useQuery(
		{ id: selectedStudentId! },
		{ enabled: !!selectedStudentId }
	);

	if (!classDetails) return null;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-4xl">
				<DialogHeader>
					<DialogTitle>{classDetails.name} - Class Dashboard</DialogTitle>
				</DialogHeader>
				<Tabs defaultValue="overview">
					<TabsList>
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="students">Students</TabsTrigger>
						<TabsTrigger value="performance">Performance</TabsTrigger>
					</TabsList>

					<TabsContent value="overview">
						<Card>
							<CardHeader>
								<CardTitle>Class Information</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-sm font-medium">Program</p>
										<p>{classDetails.classGroup.program.name}</p>
									</div>
									<div>
										<p className="text-sm font-medium">Class Group</p>
										<p>{classDetails.classGroup.name}</p>
									</div>
									<div>
										<p className="text-sm font-medium">Capacity</p>
										<p>{classDetails.capacity}</p>
									</div>
									<div>
										<p className="text-sm font-medium">Status</p>
										<Badge variant={classDetails.status === Status.ACTIVE ? "success" : "secondary"}>
											{classDetails.status}
										</Badge>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="students">
						<Card>
							<CardHeader>
								<CardTitle>Students List</CardTitle>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Name</TableHead>
											<TableHead>Email</TableHead>
											<TableHead>Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{classDetails.students.map((student) => (
											<TableRow key={student.id}>
												<TableCell>{student.user.name}</TableCell>
												<TableCell>{student.user.email}</TableCell>
												<TableCell>
													<Button
														variant="outline"
														size="sm"
														onClick={() => setSelectedStudentId(student.id)}
													>
														View Profile
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="performance">
						<Card>
							<CardHeader>
								<CardTitle>Class Performance</CardTitle>
							</CardHeader>
							<CardContent>
								{/* Add performance metrics here */}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{selectedStudentId && (
					<Dialog open={!!selectedStudentId} onOpenChange={() => setSelectedStudentId(null)}>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Student Profile</DialogTitle>
							</DialogHeader>
							{studentProfile && (
								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-medium">{studentProfile.user.name}</h3>
										<p className="text-sm text-gray-500">{studentProfile.user.email}</p>
									</div>
									<div>
										<h4 className="font-medium">Activities</h4>
										<div className="mt-2">
											{studentProfile.activities.map((activity, index) => (
												<div key={index} className="flex justify-between py-1">
													<span>{activity.status}</span>
													{activity.grade && <span>Grade: {activity.grade}</span>}
												</div>
											))}
										</div>
									</div>
									<div>
										<h4 className="font-medium">Attendance</h4>
										<div className="mt-2">
											{studentProfile.attendance.map((record, index) => (
												<div key={index} className="flex justify-between py-1">
													<span>{new Date(record.date).toLocaleDateString()}</span>
													<Badge>{record.status}</Badge>
												</div>
											))}
										</div>
									</div>
								</div>
							)}
						</DialogContent>
					</Dialog>
				)}
			</DialogContent>
		</Dialog>
	);
};