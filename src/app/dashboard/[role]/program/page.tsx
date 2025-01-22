'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Sample data - replace with actual API calls
const programs = [
	{
		id: "1",
		name: "Elementary School",
		description: "Primary education program for grades 1-5",
		level: "Primary",
		status: "ACTIVE",
		classGroups: 5,
		students: 150,
		teachers: 10,
	},
	// Add more sample programs
];

const columns = [
	{
		accessorKey: "name",
		header: "Program Name",
	},
	{
		accessorKey: "level",
		header: "Level",
	},
	{
		accessorKey: "classGroups",
		header: "Class Groups",
	},
	{
		accessorKey: "students",
		header: "Students",
	},
	{
		accessorKey: "teachers",
		header: "Teachers",
	},
	{
		accessorKey: "status",
		header: "Status",
	},
];

export default function ProgramPage() {
	const [isCreating, setIsCreating] = useState(false);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-3xl font-bold tracking-tight">Program Management</h2>
				<Dialog open={isCreating} onOpenChange={setIsCreating}>
					<DialogTrigger asChild>
						<Button>
							<PlusCircle className="mr-2 h-4 w-4" />
							Create Program
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create New Program</DialogTitle>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="name">Program Name</Label>
								<Input id="name" placeholder="Enter program name" />
							</div>
							<div className="space-y-2">
								<Label htmlFor="level">Level</Label>
								<Input id="level" placeholder="Enter program level" />
							</div>
							<div className="space-y-2">
								<Label htmlFor="description">Description</Label>
								<Input id="description" placeholder="Enter program description" />
							</div>
							<Button className="w-full">Create Program</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			<Tabs defaultValue="all" className="space-y-4">
				<TabsList>
					<TabsTrigger value="all">All Programs</TabsTrigger>
					<TabsTrigger value="active">Active</TabsTrigger>
					<TabsTrigger value="archived">Archived</TabsTrigger>
				</TabsList>
				<TabsContent value="all" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Programs Overview</CardTitle>
						</CardHeader>
						<CardContent>
							<DataTable columns={columns} data={programs} />
						</CardContent>
					</Card>
				</TabsContent>
				{/* Add other tab contents */}
			</Tabs>
		</div>
	);
}