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
	dateOfBirth: z.string().transform((str) => new Date(str)),
	classId: z.string().optional(),
	parentId: z.string().optional(),
	guardianInfo: z.object({
		name: z.string(),
		relationship: z.string(),
		contact: z.string(),
	}).optional(),
	status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]),
});

type FormValues = z.infer<typeof formSchema>;

interface StudentFormProps {
	selectedStudent?: {
		id: string;
		name: string;
		email: string;
		status: Status;
		studentProfile: {
			dateOfBirth: Date;
			class?: { id: string };
			parent?: { id: string };
		};
	};
	classes: { id: string; name: string; classGroup: { name: string } }[];
	onSuccess: () => void;
}

export const StudentForm = ({ selectedStudent, classes, onSuccess }: StudentFormProps) => {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const utils = api.useContext();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: selectedStudent?.name || "",
			email: selectedStudent?.email || "",
			dateOfBirth: selectedStudent?.studentProfile.dateOfBirth.toISOString().split('T')[0] || "",
			classId: selectedStudent?.studentProfile.class?.id || "",
			status: selectedStudent?.status || Status.ACTIVE,
		},
	});

	const createStudent = api.student.createStudent.useMutation({
		onSuccess: () => {
			utils.student.searchStudents.invalidate();
			form.reset();
			onSuccess();
		},
	});

	const updateStudent = api.student.updateStudent.useMutation({
		onSuccess: () => {
			utils.student.searchStudents.invalidate();
			onSuccess();
		},
	});

	const onSubmit = async (values: FormValues) => {
		setIsSubmitting(true);
		try {
			if (selectedStudent) {
				await updateStudent.mutateAsync({
					id: selectedStudent.id,
					...values,
				});
			} else {
				await createStudent.mutateAsync(values);
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
					name="dateOfBirth"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Date of Birth</FormLabel>
							<FormControl>
								<Input {...field} type="date" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="classId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Class</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select a class" />
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
					{selectedStudent ? "Update" : "Create"} Student
				</Button>
			</form>
		</Form>
	);
};