import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/utils/api";
import { EventType, Status } from "@prisma/client";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

interface EventFormData {
	title: string;
	description?: string;
	eventType: EventType;
	startDate: Date;
	endDate: Date;
	academicYearId: string;
	status: Status;
	isRecurring: boolean;
	recurrencePattern?: {
		frequency: 'daily' | 'weekly' | 'monthly';
		interval: number;
		endAfterOccurrences?: number;
		daysOfWeek?: number[]; // For weekly recurrence
		dayOfMonth?: number;   // For monthly recurrence
	};
}

interface EventManagerProps {
	academicYears: any[];
	filteredEvents: any[];
}

export const EventManager = ({ academicYears, filteredEvents }: EventManagerProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [formData, setFormData] = useState<EventFormData>({
		title: "",
		description: "",
		eventType: EventType.ACADEMIC,
		startDate: new Date(),
		endDate: new Date(),
		academicYearId: "none",
		status: Status.ACTIVE,
		isRecurring: false,
	});

	const [dateRange, setDateRange] = useState<{
		from: Date | undefined;
		to: Date | undefined;
	}>({
		from: undefined,
		to: undefined,
	});

	  const utils = api.useContext();


	const createMutation = api.academicCalendar.createEvent.useMutation({
		onSuccess: () => {
			utils.academicCalendar.getEventsByAcademicYear.invalidate(formData.academicYearId);
			setIsOpen(false);
			resetForm();
		},
	});

	const deleteMutation = api.academicCalendar.deleteEvent.useMutation({
		onSuccess: (_, eventId) => {
			const event = filteredEvents.find(e => e.id === eventId);
			if (event) {
				utils.academicCalendar.getEventsByAcademicYear.invalidate(event.academicYearId);
			}
		},
	});

	const resetForm = () => {
		setFormData({
			title: "",
			description: "",
			eventType: EventType.ACADEMIC,
			startDate: new Date(),
			endDate: new Date(),
			academicYearId: "none",
			status: Status.ACTIVE,
			isRecurring: false,
		});
	};

	const generateRecurringEvents = (baseEvent: EventFormData) => {
		const events = [];
		const { recurrencePattern } = baseEvent;
		if (!recurrencePattern) return [baseEvent];

		const { frequency, interval, endAfterOccurrences = 1 } = recurrencePattern;
		let currentDate = new Date(baseEvent.startDate);
		const duration = baseEvent.endDate.getTime() - baseEvent.startDate.getTime();

		for (let i = 0; i < endAfterOccurrences; i++) {
			const event = { ...baseEvent };
			event.startDate = new Date(currentDate);
			event.endDate = new Date(currentDate.getTime() + duration);
			events.push(event);

			switch (frequency) {
				case 'daily':
					currentDate.setDate(currentDate.getDate() + interval);
					break;
				case 'weekly':
					currentDate.setDate(currentDate.getDate() + (interval * 7));
					break;
				case 'monthly':
					currentDate.setMonth(currentDate.getMonth() + interval);
					break;
			}
		}

		return events;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const submissionData = {
			...formData,
			academicYearId: formData.academicYearId === "none" ? undefined : formData.academicYearId,
		};

		if (formData.isRecurring && formData.recurrencePattern) {
			const events = generateRecurringEvents(submissionData);
			events.forEach(event => createMutation.mutate(event));
		} else {
			createMutation.mutate(submissionData);
		}
	};

	return (
		<div className="space-y-4">
			  <Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogTrigger asChild>
				  <Button>Add Event</Button>

					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create Event</DialogTitle>
						</DialogHeader>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<Label htmlFor="title">Title</Label>
								<Input
									id="title"
									value={formData.title}
									onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
							  <Label htmlFor="academicYear">Academic Year</Label>
							  <select
								id="academicYear"
								value={formData.academicYearId}
								onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
								className="w-full border p-2 rounded"
								required
							  >
								<option value="none">Select Academic Year</option>
								{academicYears.map((year) => (
								  <option key={year.id} value={year.id}>
									{year.name}
								  </option>
								))}
							  </select>
							</div>

							<div>
							  <Label htmlFor="eventType">Event Type</Label>
							  <select
								id="eventType"
								value={formData.eventType}
								onChange={(e) => setFormData({ ...formData, eventType: e.target.value as EventType })}
								className="w-full border p-2 rounded"
							  >
								{Object.values(EventType).map((type) => (
								  <option key={type} value={type}>
									{type}
								  </option>
								))}
							  </select>
							</div>

							<div className="flex items-center space-x-2">
							  <Checkbox
								id="isRecurring"
								checked={formData.isRecurring}
								onCheckedChange={(checked) => 
								  setFormData({ 
									...formData, 
									isRecurring: checked as boolean,
									recurrencePattern: checked ? { frequency: 'weekly', interval: 1, endAfterOccurrences: 1 } : undefined
								  })
								}
							  />
							  <Label htmlFor="isRecurring">Recurring Event</Label>
							</div>

							{formData.isRecurring && (
								<div className="space-y-4">
									<div>
										<Label htmlFor="frequency">Frequency</Label>
										<select
											id="frequency"
											value={formData.recurrencePattern?.frequency}
											onChange={(e) => {
												const frequency = e.target.value as 'daily' | 'weekly' | 'monthly';
												setFormData({
													...formData,
													recurrencePattern: {
														frequency,
														interval: 1,
														endAfterOccurrences: 1,
														daysOfWeek: frequency === 'weekly' ? [new Date().getDay()] : undefined,
														dayOfMonth: frequency === 'monthly' ? new Date().getDate() : undefined
													}
												});
											}}
											className="w-full border p-2 rounded"
										>
											<option value="daily">Daily</option>
											<option value="weekly">Weekly</option>
											<option value="monthly">Monthly</option>
										</select>
									</div>

									{formData.recurrencePattern?.frequency === 'weekly' && (
										<div>
											<Label>Days of Week</Label>
											<div className="flex gap-2 flex-wrap">
												{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
													<Button
														key={day}
														type="button"
														variant={formData.recurrencePattern?.daysOfWeek?.includes(index) ? 'default' : 'outline'}
														onClick={() => {
															const daysOfWeek = formData.recurrencePattern?.daysOfWeek || [];
															setFormData({
																...formData,
																recurrencePattern: {
																	...formData.recurrencePattern!,
																	daysOfWeek: daysOfWeek.includes(index)
																		? daysOfWeek.filter(d => d !== index)
																		: [...daysOfWeek, index]
																}
															});
														}}
													>
														{day}
													</Button>
												))}
											</div>
										</div>
									)}

									{formData.recurrencePattern?.frequency === 'monthly' && (
										<div>
											<Label>Day of Month</Label>
											<Input
												type="number"
												min="1"
												max="31"
												value={formData.recurrencePattern.dayOfMonth}
												onChange={(e) => setFormData({
													...formData,
													recurrencePattern: {
														...formData.recurrencePattern!,
														dayOfMonth: parseInt(e.target.value)
													}
												})}
											/>
										</div>
									)}

									<div>
										<Label htmlFor="interval">Interval</Label>
										<Input
											id="interval"
											type="number"
											min="1"
											value={formData.recurrencePattern?.interval}
											onChange={(e) => setFormData({
												...formData,
												recurrencePattern: {
													...formData.recurrencePattern!,
													interval: parseInt(e.target.value)
												}
											})}
										/>
									</div>

									<div>
										<Label htmlFor="occurrences">Number of Occurrences</Label>
										<Input
											id="occurrences"
											type="number"
											min="1"
											value={formData.recurrencePattern?.endAfterOccurrences}
											onChange={(e) => setFormData({
												...formData,
												recurrencePattern: {
													...formData.recurrencePattern!,
													endAfterOccurrences: parseInt(e.target.value)
												}
											})}
										/>
									</div>
								</div>
							)}

							<div className="space-y-4">
								<Label>Date Range</Label>
								<div className="flex flex-col space-y-2">
									<Calendar
										mode="range"
										selected={{ 
											from: dateRange.from, 
											to: dateRange.to 
										}}
										onSelect={(range) => {
											setDateRange(range || { from: undefined, to: undefined });
											if (range?.from) {
												setFormData(prev => ({
													...prev,
													startDate: range.from,
													endDate: range.to || range.from
												}));
											}
										}}
										numberOfMonths={2}
										className="rounded-md border"
									/>
								</div>
							</div>
							<Button type="submit">Create</Button>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{filteredEvents.map((event) => (
				  <Card key={event.id}>
					<CardContent className="p-4">
					  <div className="space-y-2">
						<div className="flex items-center justify-between">
						  <h3 className="font-semibold">{event.title}</h3>
						  <span className="text-sm text-gray-500">{event.eventType}</span>
						</div>
						<p className="text-sm">{event.description}</p>
						<p className="text-sm text-gray-500">
						  {format(new Date(event.startDate), "MMM dd, yyyy")} -{" "}
						  {format(new Date(event.endDate), "MMM dd, yyyy")}
						</p>
						<Button
						  variant="destructive"
						  size="sm"
						  onClick={() => deleteMutation.mutate(event.id)}
						>
						  Delete
						</Button>
					  </div>
					</CardContent>
				  </Card>
				))}
			</div>
		</div>
	);
};