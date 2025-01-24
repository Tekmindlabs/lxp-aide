'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/utils/api";
import { Status } from "@prisma/client";

interface ClassGroupFormData {
	name: string;
	description?: string;
	programId: string;
	status: Status;
}

interface ClassGroupFormProps {
	selectedClassGroup?: any;
	programs: any[];
	onSuccess: () => void;
}

export const ClassGroupForm = ({ selectedClassGroup, programs, onSuccess }: ClassGroupFormProps) => {
	const [formData, setFormData] = useState<ClassGroupFormData>(() => ({
		name: selectedClassGroup?.name || "",
		description: selectedClassGroup?.description || "",
		programId: selectedClassGroup?.programId || "none",
		status: selectedClassGroup?.status || Status.ACTIVE,
	}));

	const utils = api.useContext();

	const createMutation = api.classGroup.createClassGroup.useMutation({
		onSuccess: () => {
			utils.classGroup.getAllClassGroups.invalidate();
			resetForm();
			onSuccess();
		},
	});

	const updateMutation = api.classGroup.updateClassGroup.useMutation({
		onSuccess: () => {
			utils.classGroup.getAllClassGroups.invalidate();
			resetForm();
			onSuccess();
		},
	});

	const resetForm = () => {
		setFormData({
			name: "",
			description: "",
			programId: "none",
			status: Status.ACTIVE,
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (formData.programId === "none") {
			alert("Please select a program");
			return;
		}
	
		const submissionData = {
			...formData,
		};
	
		if (selectedClassGroup) {
			updateMutation.mutate({
				id: selectedClassGroup.id,
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
				<Label htmlFor="program">Program</Label>
				<select
					id="program"
					value={formData.programId}
					onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
					className="w-full border p-2 rounded"
					required
				>
					<option value="none">Select Program</option>
					{programs.map((program) => (
						<option key={program.id} value={program.id}>
							{program.name}
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

			<Button type="submit">
				{selectedClassGroup ? "Update" : "Create"} Class Group
			</Button>
		</form>
	);
};