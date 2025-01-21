import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Status } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/utils/api";

const formSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email address"),
	programIds: z.array(z.string()).optional(),
	responsibilities: z.array(z.string()).optional(),
	status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]),
});

type FormValues = z.infer<typeof formSchema>;

interface CoordinatorFormProps {
	selectedCoordinator?: {
		id: string;
		name: string;
		email: string;
		status: Status;
		coordinatorProfile: {
			programs: { id: string }[];
		};
	};
	programs: { id: string; name: string; level: string }[];
	onSuccess: () => void;
}

export const CoordinatorForm = ({ selectedCoordinator, programs, onSuccess }: CoordinatorFormProps) => {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const utils = api.useContext();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: selectedCoordinator?.name || "",
			email: selectedCoordinator?.email || "",
			programIds: selectedCoordinator?.coordinatorProfile.programs.map(p => p.id) || [],
			status: selectedCoordinator?.status || Status.ACTIVE,
		},
	});

	const createCoordinator = api.coordinator.createCoordinator.useMutation({
		onSuccess: () => {
			utils.coordinator.searchCoordinators.invalidate();
			form.reset();
			onSuccess();
		},
	});

	const updateCoordinator = api.coordinator.updateCoordinator.useMutation({
		onSuccess: () => {
			utils.coordinator.searchCoordinators.invalidate();
			onSuccess();
		},
	});

	const onSubmit = async (values: FormValues) => {
		setIsSubmitting(true);
		try {
			if (selectedCoordinator) {
				await updateCoordinator.mutateAsync({
					id: selectedCoordinator.id,
					...values,
				});
			} else {
				await createCoordinator.mutateAsync(values);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input {...field} type="email" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="programIds"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Programs</FormLabel>
							<Select
								onValueChange={(value) => {
									const currentValues = field.value || [];
									const newValues = currentValues.includes(value)
										? currentValues.filter((v) => v !== value)
										: [...currentValues, value];
									field.onChange(newValues);
								}}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select programs" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{programs.map((program) => (
										<SelectItem key={program.id} value={program.id}>
											{program.name} ({program.level})
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
					name="status"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Status</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select status" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{Object.values(Status).map((status) => (
										<SelectItem key={status} value={status}>
											{status}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit" disabled={isSubmitting}>
					{selectedCoordinator ? "Update" : "Create"} Coordinator
				</Button>
			</form>
		</Form>
	);
};