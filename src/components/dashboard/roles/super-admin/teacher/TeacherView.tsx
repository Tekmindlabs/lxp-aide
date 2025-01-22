'use client';

import { type FC } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/trpc/react";

interface TeacherViewProps {
	isOpen: boolean;
	onClose: () => void;
	teacherId: string;
	onEdit: () => void;
}

export const TeacherView: FC<TeacherViewProps> = ({ isOpen, onClose, teacherId, onEdit }) => {
	const { data: teacher, isLoading } = api.teacher.getById.useQuery(teacherId);

	if (isLoading) {
		return null;
	}

	if (!teacher) {
		return null;
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-3xl">
				<DialogHeader className="flex flex-row items-center justify-between">
					<DialogTitle>Teacher Profile</DialogTitle>
					<Button onClick={onEdit}>Edit Profile</Button>
				</DialogHeader>

				<div className="grid gap-4 md:grid-cols-2">
					<Card>
						<CardContent className="pt-6">
							<h3 className="mb-4 text-lg font-semibold">Personal Information</h3>
							<dl className="space-y-2">
								<div>
									<dt className="text-sm font-medium text-muted-foreground">Name</dt>
									<dd>{teacher.name}</dd>
								</div>
								<div>
									<dt className="text-sm font-medium text-muted-foreground">Email</dt>
									<dd>{teacher.email}</dd>
								</div>
								<div>
									<dt className="text-sm font-medium text-muted-foreground">Specialization</dt>
									<dd>{teacher.teacherProfile?.specialization || 'Not specified'}</dd>
								</div>
								<div>
									<dt className="text-sm font-medium text-muted-foreground">Availability</dt>
									<dd>{teacher.teacherProfile?.availability || 'Not specified'}</dd>
								</div>
								<div>
									<dt className="text-sm font-medium text-muted-foreground">Status</dt>
									<dd>{teacher.status}</dd>
								</div>
							</dl>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="pt-6">
							<h3 className="mb-4 text-lg font-semibold">Assigned Subjects</h3>
							{teacher.teacherProfile?.subjects.length ? (
								<ul className="space-y-2">
									{teacher.teacherProfile.subjects.map((s) => (
										<li key={s.subject.id} className="flex items-center">
											<span>{s.subject.name}</span>
										</li>
									))}
								</ul>
							) : (
								<p className="text-sm text-muted-foreground">No subjects assigned</p>
							)}
						</CardContent>
					</Card>

					<Card className="md:col-span-2">
						<CardContent className="pt-6">
							<h3 className="mb-4 text-lg font-semibold">Assigned Classes</h3>
							{teacher.teacherProfile?.classes.length ? (
								<div className="grid gap-4 md:grid-cols-2">
									{teacher.teacherProfile.classes.map((c) => (
										<Card key={c.class.id}>
											<CardContent className="p-4">
												<h4 className="font-medium">{c.class.name}</h4>
												<p className="text-sm text-muted-foreground">
													{c.class.classGroup.name}
												</p>
											</CardContent>
										</Card>
									))}
								</div>
							) : (
								<p className="text-sm text-muted-foreground">No classes assigned</p>
							)}
						</CardContent>
					</Card>
				</div>
			</DialogContent>
		</Dialog>
	);
};