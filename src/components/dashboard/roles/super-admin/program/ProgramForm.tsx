"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/utils/api";
import { Status } from "@prisma/client";
import { toast } from "@/hooks/use-toast";
import type { TRPCClientError } from "@trpc/client";


interface ProgramFormData {
	name: string;
	description?: string;
	calendarId: string;
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
		calendarId: selectedProgram?.calendarId || "none",
		coordinatorId: selectedProgram?.coordinatorId || "none",
		status: selectedProgram?.status || Status.ACTIVE,
	}));

	const { data: calendars } = api.academicCalendar.getAllCalendars.useQuery();
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
			calendarId: "none",
			coordinatorId: "none",
			status: Status.ACTIVE,
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const submissionData = {
			...formData,
			coordinatorId: formData.coordinatorId === "none" ? undefined : formData.coordinatorId,
			calendarId: formData.calendarId === "none" ? undefined : formData.calendarId,
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
				<Label htmlFor="calendar">Calendar</Label>

    <select
        id="calendar"
        value={formData.calendarId}
        onChange={(e) => setFormData({ ...formData, calendarId: e.target.value })}
        className="w-full border p-2 rounded"
        required
        title="Select academic calendar for this program"
    >

        <option value="none">Select Calendar</option>

        {calendars?.map((calendar) => (

            <option key={calendar.id} value={calendar.id}>

                {calendar.name}

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
					title="Select program coordinator"
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
					title="Select program status"
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
