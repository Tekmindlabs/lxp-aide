"use client";


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/utils/api";
import { Status } from "@prisma/client";

interface ProgramFormData {
	name: string;
	description?: string;
	level: string;
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
		level: selectedProgram?.level || "",
		coordinatorId: selectedProgram?.coordinatorId || "none",
		status: selectedProgram?.status || Status.ACTIVE,
	}));

	const utils = api.useContext();

	const createMutation = api.program.createProgram.useMutation({
		onSuccess: () => {
			utils.program.getAllPrograms.invalidate();
			resetForm();
			onSuccess();
		},
	});

	const updateMutation = api.program.updateProgram.useMutation({
		onSuccess: () => {
			utils.program.getAllPrograms.invalidate();
			resetForm();
			onSuccess();
		},
	});

	const resetForm = () => {
		setFormData({
			name: "",
			description: "",
			level: "",
			coordinatorId: "none",
			status: Status.ACTIVE,
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const submissionData = {
			...formData,
			coordinatorId: formData.coordinatorId === "none" ? undefined : formData.coordinatorId,
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
				<Label htmlFor="level">Level</Label>
				<Input
					id="level"
					value={formData.level}
					onChange={(e) => setFormData({ ...formData, level: e.target.value })}
					required
				/>
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

			<Button type="submit">
				{selectedProgram ? "Update" : "Create"} Program
			</Button>
		</form>
	);
};