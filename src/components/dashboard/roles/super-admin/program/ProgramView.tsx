"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/utils/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/dashboard/roles/super-admin/class-group/columns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProgramViewProps {
	programId: string;
	onBack: () => void;
}

export function ProgramView({ programId, onBack }: ProgramViewProps) {
	const { data: program } = api.program.getById.useQuery({ id: programId });
	const { data: classGroups } = api.classGroup.getByProgramId.useQuery({ programId });

	if (!program) return null;

	const studentsByGroup = classGroups?.map(group => ({
		name: group.name,
		students: group.classes.reduce((acc, cls) => acc + cls.students.length, 0)
	})) || [];

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-3xl font-bold">{program.name}</h2>
				<button
					onClick={onBack}
					className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
				>
					Back to Programs
				</button>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle>Program Details</CardTitle>
					</CardHeader>
					<CardContent>
						<dl className="space-y-2">
							<div>
								<dt className="text-sm font-medium text-gray-500">Description</dt>
								<dd>{program.description}</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-gray-500">Coordinator</dt>
								<dd>{program.coordinator?.user.name || 'Not assigned'}</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-gray-500">Calendar</dt>
								<dd>{program.calendar?.name || 'Not assigned'}</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-gray-500">Status</dt>
								<dd>{program.status}</dd>
							</div>
						</dl>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Statistics</CardTitle>
					</CardHeader>
					<CardContent>
						<dl className="space-y-2">
							<div>
								<dt className="text-sm font-medium text-gray-500">Total Class Groups</dt>
								<dd className="text-2xl font-bold">{classGroups?.length || 0}</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-gray-500">Total Classes</dt>
								<dd className="text-2xl font-bold">
									{classGroups?.reduce((acc, group) => acc + group.classes.length, 0) || 0}
								</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-gray-500">Total Students</dt>
								<dd className="text-2xl font-bold">
									{studentsByGroup.reduce((acc, group) => acc + group.students, 0)}
								</dd>
							</div>
						</dl>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Students by Class Group</CardTitle>
					</CardHeader>
					<CardContent className="h-[200px]">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={studentsByGroup}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="name" />
								<YAxis />
								<Tooltip />
								<Bar dataKey="students" fill="#8884d8" />
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="classGroups">
				<TabsList>
					<TabsTrigger value="classGroups">Class Groups</TabsTrigger>
					<TabsTrigger value="activities">Recent Activities</TabsTrigger>
				</TabsList>
				<TabsContent value="classGroups">
					<Card>
						<CardHeader>
							<CardTitle>Class Groups</CardTitle>
						</CardHeader>
						<CardContent>
							{classGroups && <DataTable columns={columns} data={classGroups} />}
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value="activities">
					<Card>
						<CardHeader>
							<CardTitle>Recent Activities</CardTitle>
						</CardHeader>
						<CardContent>
							<p>No recent activities</p>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}