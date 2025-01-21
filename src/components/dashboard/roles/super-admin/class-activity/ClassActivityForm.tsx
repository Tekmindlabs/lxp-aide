import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ActivityType } from "@prisma/client";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	type: z.nativeEnum(ActivityType),
	classGroupId: z.string().optional(),
	classId: z.string().optional(),
	deadline: z.string().optional(),
	gradingCriteria: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
	activityId?: string | null;
	onClose: () => void;
}

export default function ClassActivityForm({ activityId, onClose }: Props) {
	const utils = api.useContext();
	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: "",
			description: "",
			type: ActivityType.ASSIGNMENT,
			gradingCriteria: "",
		},
	});

	const { data: activity } = api.classActivity.getById.useQuery(activityId as string, {
		enabled: !!activityId,
	});

	const createMutation = api.classActivity.create.useMutation({
		onSuccess: () => {
			utils.classActivity.getAll.invalidate();
			onClose();
		},
	});

	const updateMutation = api.classActivity.update.useMutation({
		onSuccess: () => {
			utils.classActivity.getAll.invalidate();
			onClose();
		},
	});

	useEffect(() => {
		if (activity) {
			form.reset({
				title: activity.title,
				description: activity.description || "",
				type: activity.type,
				deadline: activity.deadline?.toISOString().split('T')[0],
				gradingCriteria: activity.gradingCriteria || "",
			});
		}
	}, [activity, form]);

	const onSubmit = (data: FormData) => {
		if (activityId) {
			updateMutation.mutate({
				id: activityId,
				...data,
				deadline: data.deadline ? new Date(data.deadline) : undefined,
			});
		} else {
			createMutation.mutate({
				...data,
				deadline: data.deadline ? new Date(data.deadline) : undefined,
			});
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Title</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Description</FormLabel>
							<FormControl>
								<Textarea {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="type"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Type</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select activity type" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{Object.values(ActivityType).map((type) => (
										<SelectItem key={type} value={type}>
											{type}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="deadline"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Deadline</FormLabel>
							<FormControl>
								<Input type="date" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="gradingCriteria"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Grading Criteria</FormLabel>
							<FormControl>
								<Textarea {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end space-x-2">
					<Button type="button" variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit">
						{activityId ? "Update" : "Create"} Activity
					</Button>
				</div>
			</form>
		</Form>
	);
}