'use client';

import { useState } from 'react';
import { Calendar as CalendarModel, Event } from '@prisma/client';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CalendarContentProps {
	calendar: CalendarModel & { events: Event[] };
	view: 'list' | 'calendar';
	filters: any;
}

export const CalendarContent = ({
	calendar,
	view,
	filters,
}: CalendarContentProps) => {
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());

	const filteredEvents = calendar.events.filter((event) => {
		if (filters.type && event.eventType !== filters.type) return false;
		if (filters.visibility && event.visibility !== filters.visibility) return false;
		if (filters.dateRange?.from) {
			const eventDate = new Date(event.startDate);
			if (eventDate < filters.dateRange.from) return false;
			if (filters.dateRange.to && eventDate > filters.dateRange.to) return false;
		}
		return true;
	});

	const getDayEvents = (date: Date) => {
		return filteredEvents.filter((event) => {
			const eventStart = new Date(event.startDate);
			const eventEnd = new Date(event.endDate);
			return date >= eventStart && date <= eventEnd;
		});
	};

	if (view === 'list') {
		return (
			<ScrollArea className="h-[calc(100vh-12rem)]">
				<div className="space-y-4 p-4">
					{filteredEvents.map((event) => (
						<Card key={event.id}>
							<CardContent className="p-4">
								<div className="flex justify-between items-start">
									<div>
										<h3 className="font-medium">{event.title}</h3>
										<p className="text-sm text-muted-foreground">
											{event.description}
										</p>
									</div>
									<Badge>{event.eventType}</Badge>
								</div>
								<div className="mt-2 text-sm text-muted-foreground">
									{format(new Date(event.startDate), 'PPP')} -{' '}
									{format(new Date(event.endDate), 'PPP')}
								</div>
							</CardContent>
						</Card>
					))}
					{filteredEvents.length === 0 && (
						<div className="text-center text-muted-foreground py-8">
							No events found
						</div>
					)}
				</div>
			</ScrollArea>
		);
	}

	return (
		<div className="p-4">
			<Calendar
				mode="single"
				selected={selectedDate}
				onSelect={(date) => date && setSelectedDate(date)}
				className="rounded-md border"
				modifiers={{
					event: (date) => getDayEvents(date).length > 0,
				}}
				modifiersStyles={{
					event: { backgroundColor: 'var(--primary)', color: 'white' },
				}}
			/>

			<div className="mt-4">
				<h3 className="font-medium mb-2">
					Events on {format(selectedDate, 'MMMM d, yyyy')}
				</h3>
				<div className="space-y-2">
					{getDayEvents(selectedDate).map((event) => (
						<Card key={event.id}>
							<CardContent className="p-4">
								<div className="flex justify-between items-start">
									<div>
										<h4 className="font-medium">{event.title}</h4>
										<p className="text-sm text-muted-foreground">
											{event.description}
										</p>
									</div>
									<Badge>{event.eventType}</Badge>
								</div>
							</CardContent>
						</Card>
					))}
					{getDayEvents(selectedDate).length === 0 && (
						<div className="text-center text-muted-foreground py-4">
							No events on this day
						</div>
					)}
				</div>
			</div>
		</div>
	);
};