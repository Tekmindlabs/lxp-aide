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
		academicYearId: "",
		status: Status.ACTIVE,
		isRecurring: false,
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
			academicYearId: "",
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
		if (formData.isRecurring && formData.recurrencePattern) {
			const events = generateRecurringEvents(formData);
			events.forEach(event => createMutation.mutate(event));
		} else {
			createMutation.mutate(formData);
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
								<option value="">Select Academic Year</option>
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
									onChange={(e) => setFormData({
									  ...formData,
									  recurrencePattern: {
										...formData.recurrencePattern!,
										frequency: e.target.value as 'daily' | 'weekly' | 'monthly'
									  }
									})}
									className="w-full border p-2 rounded"
								  >
									<option value="daily">Daily</option>
									<option value="weekly">Weekly</option>
									<option value="monthly">Monthly</option>
								  </select>
								</div>

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

							<div>
							  <Label>Start Date</Label>
							  <Calendar
								mode="single"
								selected={formData.startDate}
								onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
								className="rounded-md border"
							  />
							</div>
							<div>
								<Label>End Date</Label>
								<Calendar
									mode="single"
									selected={formData.endDate}
									onSelect={(date) => date && setFormData({ ...formData, endDate: date })}
									className="rounded-md border"
								/>
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