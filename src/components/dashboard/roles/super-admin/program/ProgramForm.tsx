"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/utils/api";
import { Status } from "@prisma/client";
import { toast } from "@/components/ui/use-toast";

interface ProgramFormData {
	name: string;
	description?: string;
	academicYearId: string;
	coordinatorId?: string;
	status: Status;
}

interface ProgramFormProps {
	selectedProgram?: any;
	coordinators: any[];
	onSuccess: () => void;
}

export const ProgramForm = ({ selectedProgram, coordinators, onSuccess }: ProgramFormProps) => {
	const [formData, setFormData] = useState<ProgramFormData>(() => ({
		name: selectedProgram?.name || "",
		description: selectedProgram?.description || "",
		academicYearId: selectedProgram?.academicYearId || "none",
		coordinatorId: selectedProgram?.coordinatorId || "none",
		status: selectedProgram?.status || Status.ACTIVE,
	}));

	const { data: academicYears } = api.academicCalendar.getAllAcademicYears.useQuery();
	const utils = api.useContext();

	const createMutation = api.program.createProgram.useMutation({
		onSuccess: () => {
			utils.program.getAllPrograms.invalidate();
			resetForm();
			onSuccess();
			toast({
				title: "Success",
				description: "Program created successfully",
			});
		},
		onError: (error) => {
			toast({
				title: "Error",
				description: error.message,
				variant: "destructive",
			});
		},
	});

	const updateMutation = api.program.updateProgram.useMutation({
		onSuccess: () => {
			utils.program.getAllPrograms.invalidate();
			resetForm();
			onSuccess();
			toast({
				title: "Success",
				description: "Program updated successfully",
			});
		},
		onError: (error) => {
			toast({
				title: "Error",
				description: error.message,
				variant: "destructive",
			});
		},
	});

	const resetForm = () => {
		setFormData({
			name: "",
			description: "",
			academicYearId: "none",
			coordinatorId: "none",
			status: Status.ACTIVE,
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const submissionData = {
			...formData,
			coordinatorId: formData.coordinatorId === "none" ? undefined : formData.coordinatorId,
			academicYearId: formData.academicYearId === "none" ? undefined : formData.academicYearId,
		};

		if (selectedProgram) {
			updateMutation.mutate({
				id: selectedProgram.id,
				...submissionData,
			});
		} else {
			createMutation.mutate(submissionData);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<Label htmlFor="name">Name</Label>
				<Input
					id="name"
					value={formData.name}
					onChange={(e) => setFormData({ ...formData, name: e.target.value })}
					required
				/>
			</div>

			<div>
				<Label htmlFor="description">Description</Label>
				<Textarea
					id="description"
					value={formData.description}
					onChange={(e) => setFormData({ ...formData, description: e.target.value })}
				/>
			</div>

			<div>
				<Label htmlFor="academicYear">Academic Year</Label>
				<select
					id="academicYear"
					value={formData.academicYearId}
					onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
					className="w-full border p-2 rounded"
					required
				>
					<option value="none">Select Academic Year</option>
					{academicYears?.map((year) => (
						<option key={year.id} value={year.id}>
							{year.name}
						</option>
					))}
				</select>
			</div>

			<div>
				<Label htmlFor="coordinator">Coordinator</Label>
				<select
					id="coordinator"
					value={formData.coordinatorId}
					onChange={(e) => setFormData({ ...formData, coordinatorId: e.target.value })}
					className="w-full border p-2 rounded"
				>
					<option value="none">Select Coordinator</option>
					{coordinators.map((coordinator) => (
						<option key={coordinator.id} value={coordinator.id}>
							{coordinator.user.name}
						</option>
					))}
				</select>
			</div>

			<div>
				<Label htmlFor="status">Status</Label>
				<select
					id="status"
					value={formData.status}
					onChange={(e) => setFormData({ ...formData, status: e.target.value as Status })}
					className="w-full border p-2 rounded"
				>
					{Object.values(Status).map((status) => (
						<option key={status} value={status}>
							{status}
						</option>
					))}
				</select>
			</div>

			<Button type="submit" disabled={createMutation.isLoading || updateMutation.isLoading}>
				{createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : selectedProgram ? "Update" : "Create"} Program
			</Button>
		</form>
	);
};