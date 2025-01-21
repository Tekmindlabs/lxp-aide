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
	specialization: z.string().optional(),
	availability: z.string().optional(),
	status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]),
	subjectIds: z.array(z.string()).optional(),
	classIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TeacherFormProps {
	selectedTeacher?: {
		id: string;
		name: string;
		email: string;
		status: Status;
		teacherProfile: {
			specialization: string | null;
			availability: string | null;
			subjects: { subject: { id: string } }[];
			classes: { class: { id: string } }[];
		};
	};
	subjects: { id: string; name: string }[];
	classes: { id: string; name: string; classGroup: { name: string } }[];
	onSuccess: () => void;
}

export const TeacherForm = ({ selectedTeacher, subjects, classes, onSuccess }: TeacherFormProps) => {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const utils = api.useContext();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: selectedTeacher?.name || "",
			email: selectedTeacher?.email || "",
			specialization: selectedTeacher?.teacherProfile?.specialization || "",
			availability: selectedTeacher?.teacherProfile?.availability || "",
			status: selectedTeacher?.status || Status.ACTIVE,
			subjectIds: selectedTeacher?.teacherProfile?.subjects.map(s => s.subject.id) || [],
			classIds: selectedTeacher?.teacherProfile?.classes.map(c => c.class.id) || [],
		},
	});

	const createTeacher = api.teacher.createTeacher.useMutation({
		onSuccess: () => {
			utils.teacher.searchTeachers.invalidate();
			form.reset();
			onSuccess();
		},
	});

	const updateTeacher = api.teacher.updateTeacher.useMutation({
		onSuccess: () => {
			utils.teacher.searchTeachers.invalidate();
			onSuccess();
		},
	});

	const onSubmit = async (values: FormValues) => {
		setIsSubmitting(true);
		try {
			if (selectedTeacher) {
				await updateTeacher.mutateAsync({
					id: selectedTeacher.id,
					...values,
				});
			} else {
				await createTeacher.mutateAsync(values);
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
					name="specialization"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Specialization</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="availability"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Availability</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
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

				<FormField
					control={form.control}
					name="subjectIds"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Subjects</FormLabel>
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
										<SelectValue placeholder="Select subjects" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{subjects.map((subject) => (
										<SelectItem key={subject.id} value={subject.id}>
											{subject.name}
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
					name="classIds"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Classes</FormLabel>
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
										<SelectValue placeholder="Select classes" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{classes.map((cls) => (
										<SelectItem key={cls.id} value={cls.id}>
											{`${cls.name} (${cls.classGroup.name})`}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit" disabled={isSubmitting}>
					{selectedTeacher ? "Update" : "Create"} Teacher
				</Button>
			</form>
		</Form>
	);
};