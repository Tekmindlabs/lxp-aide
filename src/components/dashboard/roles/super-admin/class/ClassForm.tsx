'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Status } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/utils/api";

const formSchema = z.object({
	name: z.string().min(1, "Name is required"),
	classGroupId: z.string().min(1, "Class Group is required"),
	capacity: z.number().min(1, "Capacity must be at least 1"),
	status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]),
	teacherIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ClassFormProps {
	isOpen: boolean;
	onClose: () => void;
	selectedClass?: {
		id: string;
		name: string;
		capacity: number;
		status: Status;
		classGroup: { id: string };
		teachers: { teacher: { id: string } }[];
	};
	classGroups: { id: string; name: string }[];
	teachers: { id: string; user: { name: string } }[];
}

export const ClassForm = ({ isOpen, onClose, selectedClass, classGroups, teachers }: ClassFormProps) => {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const utils = api.useContext();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: selectedClass?.name || "",
			classGroupId: selectedClass?.classGroup.id || "",
			capacity: selectedClass?.capacity || 30,
			status: selectedClass?.status || Status.ACTIVE,
			teacherIds: selectedClass?.teachers.map(t => t.teacher.id) || [],
		},
	});

	const createClass = api.class.createClass.useMutation({
		onSuccess: () => {
			utils.class.searchClasses.invalidate();
			form.reset();
			onClose();
			toast({
				title: "Success",
				description: "Class created successfully",
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

	const updateClass = api.class.updateClass.useMutation({
		onSuccess: () => {
			utils.class.searchClasses.invalidate();
			onClose();
			toast({
				title: "Success",
				description: "Class updated successfully",
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

	const onSubmit = async (values: FormValues) => {
		setIsSubmitting(true);
		try {
			if (selectedClass) {
				await updateClass.mutateAsync({
					id: selectedClass.id,
					...values,
				});
			} else {
				await createClass.mutateAsync(values);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{selectedClass ? "Edit" : "Create"} Class</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Class Name</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

<FormField
  control={form.control}
  name="classGroupId"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Class Group</FormLabel>
      <Select 
        onValueChange={field.onChange} 
        value={field.value || undefined}  // Ensures an undefined value shows the placeholder
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select a class group" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {classGroups.map((group) => {
            // Ensure group.id is not an empty string
            const groupId = group.id || 'undefined'; // Replace 'undefined' with a suitable placeholder
            return (
              <SelectItem key={groupId} value={groupId}>
                {group.name}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>




				<FormField
					control={form.control}
					name="capacity"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Capacity</FormLabel>
							<FormControl>
								<Input 
									type="number" 
									{...field} 
									onChange={e => field.onChange(parseInt(e.target.value))}
								/>
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
      <Select 
        onValueChange={field.onChange} 
        value={field.value || Status.ACTIVE}  // Changed from defaultValue
      >
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
					name="teacherIds"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Teachers</FormLabel>
							<div className="flex flex-wrap gap-2">
								{teachers.map((teacher) => (
									<div
										key={teacher.id}
										className={`cursor-pointer rounded-md px-3 py-1 text-sm ${
											field.value?.includes(teacher.id)
												? 'bg-primary text-primary-foreground'
												: 'bg-secondary'
										}`}
										onClick={() => {
											const currentValues = field.value || [];
											const newValues = currentValues.includes(teacher.id)
												? currentValues.filter((v) => v !== teacher.id)
												: [...currentValues, teacher.id];
											field.onChange(newValues);
										}}
									>
										{teacher.user.name || 'Unnamed Teacher'}
									</div>
								))}
							</div>
							<FormMessage />
						</FormItem>
					)}
				/>


				<div className="flex justify-end space-x-2">
				  <Button variant="outline" type="button" onClick={onClose}>
					Cancel
				  </Button>
				  <Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? "Saving..." : selectedClass ? "Update" : "Create"}
				  </Button>
				</div>
			  </form>
			</Form>
		  </DialogContent>
		</Dialog>
	  );
};