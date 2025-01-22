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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";

export default function ProgramPage() {
	const [isCreating, setIsCreating] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		academicYearId: "",
	});

	const { toast } = useToast();
	
	const { data: academicYears } = api.academicCalendar.getAllAcademicYears.useQuery();
	const { data: programs, refetch: refetchPrograms } = api.program.getAll.useQuery();
	
	const createProgram = api.program.create.useMutation({
		onSuccess: () => {
			toast({
				title: "Success",
				description: "Program created successfully",
			});
			setIsCreating(false);
			setFormData({ name: "", description: "", academicYearId: "" });
			void refetchPrograms();
		},
		onError: (error) => {
			toast({
				title: "Error",
				description: error.message,
				variant: "destructive",
			});
		},
	});

	const columns = [
		{
			accessorKey: "name",
			header: "Program Name",
		},
		{
			accessorKey: "description",
			header: "Description",
		},
		{
			accessorKey: "academicYear.name",
			header: "Academic Year",
		},
		{
			accessorKey: "status",
			header: "Status",
		},
	];

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createProgram.mutate(formData);
	};

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
						<form onSubmit={handleSubmit} className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="name">Program Name</Label>
								<Input 
									id="name" 
									placeholder="Enter program name"
									value={formData.name}
									onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="description">Description</Label>
								<Input 
									id="description" 
									placeholder="Enter program description"
									value={formData.description}
									onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="academicYear">Academic Year</Label>
								<Select 
									value={formData.academicYearId}
									onValueChange={(value) => setFormData(prev => ({ ...prev, academicYearId: value }))}
									required
								>
									<SelectTrigger>
										<SelectValue placeholder="Select Academic Year" />
									</SelectTrigger>
									<SelectContent>
										{academicYears?.map((year) => (
											<SelectItem key={year.id} value={year.id}>
												{year.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<Button type="submit" className="w-full" disabled={createProgram.isLoading}>
								{createProgram.isLoading ? "Creating..." : "Create Program"}
							</Button>
						</form>
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
							<DataTable columns={columns} data={programs ?? []} />
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}