'use client';

import { useState } from "react";
import { Event, EventType, Priority, Status, Visibility } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

interface EventFormProps {
	event?: Partial<Event>;
	calendarId: string;
	onSubmit: (data: Partial<Event>) => void;
}

interface RecurrencePattern {
	frequency: 'daily' | 'weekly' | 'monthly';
	interval: number;
	endAfterOccurrences?: number;
	daysOfWeek?: number[];
}

export const EventForm = ({ event, calendarId, onSubmit }: EventFormProps) => {
	const [formData, setFormData] = useState<Partial<Event> & { recurrencePattern?: RecurrencePattern }>({
		title: event?.title || '',
		description: event?.description || '',
		eventType: event?.eventType || EventType.ACADEMIC,
		startDate: event?.startDate || new Date(),
		endDate: event?.endDate || new Date(),
		calendarId: calendarId,
		status: event?.status || Status.ACTIVE,
		priority: event?.priority || Priority.MEDIUM,
		visibility: event?.visibility || Visibility.ALL,
		recurrence: event?.recurrence || null,
	});

	const [isRecurring, setIsRecurring] = useState(false);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(formData);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="title">Title</Label>
				<Input
					id="title"
					value={formData.title}
					onChange={(e) => setFormData({ ...formData, title: e.target.value })}
					required
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="description">Description</Label>
				<Textarea
					id="description"
					value={formData.description}
					onChange={(e) => setFormData({ ...formData, description: e.target.value })}
				/>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label>Event Type</Label>
					<Select
						value={formData.eventType}
						onValueChange={(value: EventType) =>
							setFormData({ ...formData, eventType: value })
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select type" />
						</SelectTrigger>
						<SelectContent>
							{Object.values(EventType).map((type) => (
								<SelectItem key={type} value={type}>
									{type}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label>Priority</Label>
					<Select
						value={formData.priority}
						onValueChange={(value: Priority) =>
							setFormData({ ...formData, priority: value })
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select priority" />
						</SelectTrigger>
						<SelectContent>
							{Object.values(Priority).map((priority) => (
								<SelectItem key={priority} value={priority}>
									{priority}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="space-y-2">
				<Label>Date Range</Label>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<Label>Start Date</Label>
						<Calendar
							mode="single"
							selected={formData.startDate}
							onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
						/>
					</div>
					<div>
						<Label>End Date</Label>
						<Calendar
							mode="single"
							selected={formData.endDate}
							onSelect={(date) => date && setFormData({ ...formData, endDate: date })}
						/>
					</div>
				</div>
			</div>

			<div className="flex items-center space-x-2">
				<Switch
					checked={isRecurring}
					onCheckedChange={setIsRecurring}
				/>
				<Label>Recurring Event</Label>
			</div>

			{isRecurring && (
				<div className="space-y-4">
					<div className="space-y-2">
						<Label>Frequency</Label>
						<Select
							value={formData.recurrencePattern?.frequency}
							onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
								setFormData({
									...formData,
									recurrencePattern: {
										...formData.recurrencePattern,
										frequency: value,
										interval: 1,
									} as RecurrencePattern,
								})
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select frequency" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="daily">Daily</SelectItem>
								<SelectItem value="weekly">Weekly</SelectItem>
								<SelectItem value="monthly">Monthly</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Repeat every</Label>
						<Input
							type="number"
							min="1"
							value={formData.recurrencePattern?.interval || 1}
							onChange={(e) =>
								setFormData({
									...formData,
									recurrencePattern: {
										...formData.recurrencePattern,
										interval: parseInt(e.target.value),
									} as RecurrencePattern,
								})
							}
						/>
					</div>
				</div>
			)}

			<Button type="submit">
				{event ? 'Update Event' : 'Create Event'}
			</Button>
		</form>
	);
};