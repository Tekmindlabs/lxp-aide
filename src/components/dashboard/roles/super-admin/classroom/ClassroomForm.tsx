"use client";

import { type FC, useState, type ChangeEvent } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast"; 
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
	name: z.string().min(1, "Name is required"),
	capacity: z.number().min(1, "Capacity must be at least 1"),
	resources: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ClassroomFormProps {
	onCancel: () => void;
}

interface Props {

	onCancel: () => void;
  
  }

const ClassroomForm: FC<Props> = ({ onCancel }) => {
	const { toast } = useToast();
	const utils = api.useContext();
	const [resources, setResources] = useState<string[]>([]);
	const [newResource, setNewResource] = useState("");

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			capacity: 1,
			resources: [],
		},
	});

	const createClassroom = api.classroom.create.useMutation({
		onSuccess: () => {
			toast({
				title: "Success",
				description: "Classroom created successfully",
			});
			utils.classroom.getAll.invalidate();
			onCancel();
		},
		onError: (error) => {
			toast({
				title: "Error",
				description: error.message,
				variant: "destructive",
			});
		},
	});

	const addResource = () => {
		if (newResource.trim()) {
			setResources([...resources, newResource.trim()]);
			setNewResource("");
		}
	};

	const removeResource = (index: number) => {
		setResources(resources.filter((_, i) => i !== index));
	};

	const onSubmit = (data: FormValues) => {
		createClassroom.mutate({
			...data,
			resources: JSON.stringify(resources),
		});
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
								<Input {...field} placeholder="Enter classroom name" />
							</FormControl>
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
									onChange={(e) => field.onChange(parseInt(e.target.value))}
									min={1}
								/>
							</FormControl>
						</FormItem>
					)}
				/>

				<div className="space-y-2">
					<FormLabel>Resources</FormLabel>
					<div className="flex gap-2">
						<Input
							value={newResource}
							onChange={(e: ChangeEvent<HTMLInputElement>) => setNewResource(e.target.value)}
							placeholder="Add resource (e.g., Projector)"
						/>
						<Button type="button" onClick={addResource}>
							Add
						</Button>
					</div>
					<div className="space-y-2">
						{resources.map((resource, index) => (
							<div key={index} className="flex items-center gap-2">
								<span>{resource}</span>
								<Button
									type="button"
									variant="destructive"
									size="sm"
									onClick={() => removeResource(index)}
								>
									Remove
								</Button>
							</div>
						))}
					</div>
				</div>

				<div className="flex justify-end space-x-4">
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
					<Button type="submit" disabled={createClassroom.isLoading}>
						Create Classroom
					</Button>
				</div>
			</form>
		</Form>
	);
}