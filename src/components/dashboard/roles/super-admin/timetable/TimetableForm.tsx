'use client'

import { useState } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast"; 
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";


type Term = {
	id: string;
	name: string;
  };
  
  type ClassGroup = {
	id: string;
	name: string;
  };
  
  type Class = {
	id: string;
	name: string;
  };
  
  type Subject = {
	id: string;
	name: string;
  };
  
  type Classroom = {
	id: string;
	name: string;
  };

const periodSchema = z.object({
	startTime: z.string(),
	endTime: z.string(),
	dayOfWeek: z.number().min(1).max(7),
	subjectId: z.string(),
	classroomId: z.string(),
});

const formSchema = z.object({
	termId: z.string(),
	classGroupId: z.string().optional(),
	classId: z.string().optional(),
	periods: z.array(periodSchema),
});

type TimetableFormProps = {
	onCancel: () => void;
};

export default function TimetableForm({ onCancel }: TimetableFormProps) {
	const { toast } = useToast();
	const utils = api.useContext();

	const [periods, setPeriods] = useState<z.infer<typeof periodSchema>[]>([]);

	const { data: terms } = api.term.list.useQuery();
	const { data: classGroups } = api.classGroup.list.useQuery();
	const { data: classes } = api.class.list.useQuery();
	const { data: subjects } = api.subject.list.useQuery();
	const { data: classrooms } = api.classroom.list.useQuery();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			periods: [],
		},
	});

	const createTimetable = api.timetable.create.useMutation({
		onSuccess: () => {
			toast({
				title: "Success",
				description: "Timetable created successfully",
			});
			utils.timetable.getAll.invalidate();
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

	const addPeriod = () => {
		setPeriods([
			...periods,
			{
				startTime: "",
				endTime: "",
				dayOfWeek: 1,
				subjectId: "none",
				classroomId: "none",
			},
		]);
	};

	const removePeriod = (index: number) => {
		setPeriods(periods.filter((_, i) => i !== index));
	};

	const onSubmit = (data: z.infer<typeof formSchema>) => {
		const formData = {
		  ...data,
		  classGroupId: data.classGroupId === "none" ? undefined : data.classGroupId,
		  classId: data.classId === "none" ? undefined : data.classId,
		  periods: periods
			.filter(period => period.subjectId !== "none" && period.classroomId !== "none")
			.map(period => ({
			  ...period,
			  startTime: new Date(`1970-01-01T${period.startTime}`),
			  endTime: new Date(`1970-01-01T${period.endTime}`),
			  subjectId: period.subjectId,
			  classroomId: period.classroomId,
			  dayOfWeek: period.dayOfWeek,
			})),
		};
		createTimetable.mutate(formData);
	  };

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="termId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Term</FormLabel>
							<Select
								onValueChange={field.onChange}
								defaultValue={field.value}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select term" />
								</SelectTrigger>
								<SelectContent>
									{terms?.map((term: Term) => (
										<SelectItem key={term.id} value={term.id}>
											{term.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="classGroupId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Class Group (Optional)</FormLabel>
							<Select
								onValueChange={field.onChange}
								defaultValue={field.value}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select class group" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">Select Class Group</SelectItem>
									{classGroups?.map((group: ClassGroup) => (
										<SelectItem key={group.id} value={group.id}>
											{group.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="classId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Class (Optional)</FormLabel>
							<Select
								onValueChange={field.onChange}
								defaultValue={field.value}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select class" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">Select Class</SelectItem>
									{classes?.map((cls: Class) => (
										<SelectItem key={cls.id} value={cls.id}>
											{cls.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FormItem>
					)}
				/>

				<div className="space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-semibold">Periods</h3>
						<Button type="button" onClick={addPeriod}>
							Add Period
						</Button>
					</div>

					{periods.map((period, index) => (
						<Card key={index} className="p-4">
							<div className="grid grid-cols-2 gap-4">
								<FormItem>
									<FormLabel>Start Time</FormLabel>
									<Input
										type="time"
										value={period.startTime}
										onChange={(e) => {
											const newPeriods = [...periods];
											newPeriods[index].startTime = e.target.value;
											setPeriods(newPeriods);
										}}
									/>
								</FormItem>

								<FormItem>
									<FormLabel>End Time</FormLabel>
									<Input
										type="time"
										value={period.endTime}
										onChange={(e) => {
											const newPeriods = [...periods];
											newPeriods[index].endTime = e.target.value;
											setPeriods(newPeriods);
										}}
									/>
								</FormItem>

								<FormItem>
									<FormLabel>Day of Week</FormLabel>
									<Select
										value={period.dayOfWeek.toString()}
										onValueChange={(value) => {
											const newPeriods = [...periods];
											newPeriods[index].dayOfWeek = parseInt(value);
											setPeriods(newPeriods);
										}}
									>
										<option value="1">Monday</option>
										<option value="2">Tuesday</option>
										<option value="3">Wednesday</option>
										<option value="4">Thursday</option>
										<option value="5">Friday</option>
										<option value="6">Saturday</option>
										<option value="7">Sunday</option>
									</Select>
								</FormItem>

								<FormItem>
									<FormLabel>Subject</FormLabel>
									<Select
										value={period.subjectId}
										onValueChange={(value) => {
											const newPeriods = [...periods];
											newPeriods[index].subjectId = value;
											setPeriods(newPeriods);
										}}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select subject" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">Select Subject</SelectItem>
											{subjects?.map((subject: Subject) => (
												<SelectItem key={subject.id} value={subject.id}>
													{subject.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormItem>

								<FormItem>
									<FormLabel>Classroom</FormLabel>
									<Select
										value={period.classroomId}
										onValueChange={(value) => {
											const newPeriods = [...periods];
											newPeriods[index].classroomId = value;
											setPeriods(newPeriods);
										}}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select classroom" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">Select Classroom</SelectItem>
											{classrooms?.map((classroom: Classroom) => (
												<SelectItem key={classroom.id} value={classroom.id}>
													{classroom.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormItem>

								<Button
									type="button"
									variant="destructive"
									onClick={() => removePeriod(index)}
								>
									Remove Period
								</Button>
							</div>
						</Card>
					))}
				</div>

				<div className="flex justify-end space-x-4">
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
					<Button type="submit" disabled={createTimetable.isPending}>
  Create Timetable
</Button>
				</div>
			</form>
		</Form>
	);
}
