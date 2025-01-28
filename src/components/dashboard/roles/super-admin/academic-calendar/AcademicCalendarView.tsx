'use client';

import { useState, CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { api } from "@/utils/api";
import { EventType, Status, CalendarType, Visibility } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { CalendarForm } from "./CalendarForm";
import { EventForm } from "./EventForm";
import { TRPCError } from "@trpc/server";
import type { RouterOutput } from "@/server/api/root";

export const AcademicCalendarView = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [selectedEventType, setSelectedEventType] = useState<EventType | 'ALL'>('ALL');
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');
  const [isAddCalendarOpen, setIsAddCalendarOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  type Calendar = RouterOutput['academicCalendar']['getAllCalendars'][number];
  type CalendarEvent = RouterOutput['academicCalendar']['getEventsByDateRange'][number];
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const { toast } = useToast();



  // Fetch calendars with error handling
  const { 
    data: calendars, 
    refetch: refetchCalendars, 
    error: calendarsError, 
    isLoading: isCalendarsLoading 
  } = api.academicCalendar.getAllCalendars.useQuery(undefined, {
    onError: (error: TRPCError) => {
      console.error('Failed to fetch calendars:', error);
      toast({ 
        title: "Error", 
        description: `Failed to load calendars: ${error.message}`, 
        variant: "destructive" 
      });
    },
    retry: 1  // Limit retry attempts
  });

  // Create calendar mutation
  const createCalendar = api.academicCalendar.createCalendar.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Calendar created successfully" });
      setIsAddCalendarOpen(false);
      void refetchCalendars();
    },
    onError: (error: TRPCError) => {
      console.error('Failed to create calendar:', error);
      toast({ 
        title: "Error", 
        description: `Failed to create calendar: ${error.message}`, 
        variant: "destructive" 
      });
    },
  });

  // Fetch events with error handling
  const { 
    data: events, 
    refetch: refetchEvents, 
    error: eventsError, 
    isLoading: isEventsLoading 
  } = api.academicCalendar.getEventsByDateRange.useQuery({
    eventType: selectedEventType === 'ALL' ? undefined : selectedEventType,
    startDate: view === 'week' ? startOfWeek(selectedDate) : undefined,
    endDate: view === 'week' ? endOfWeek(selectedDate) : undefined,
    calendarId: selectedCalendarId
  }, {
    enabled: !!selectedCalendarId,
    onError: (error: TRPCError) => {
      console.error('Failed to fetch events:', error);
      toast({ 
        title: "Error", 
        description: `Failed to load events: ${error.message}`, 
        variant: "destructive" 
      });
    },
    retry: 1  // Limit retry attempts
  });


  // Create event mutation
  const createEvent = api.academicCalendar.createEvent.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Event created successfully",
      });
      setIsAddEventOpen(false);
      void refetchEvents();
    },
    onError: (error: TRPCError) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });




  const isDateInEvent = (date: Date) => {
    if (!events) return false;
    return events.some(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return date >= eventStart && date <= eventEnd;
    });
  };

  const getEventStyles = (date: Date): CSSProperties => {
    if (!events) return {};
    const dayEvents = getDayEvents(date);
    if (dayEvents.length === 0) return {};
    
    return {
      backgroundColor: 'var(--primary)',
      color: 'white',
      fontWeight: 'bold',
      position: 'relative',
      '--event-count': `"${dayEvents.length}"`,
      className: 'event-day'
    } as CSSProperties;
  };



  const getDayEvents = (date: Date): CalendarEvent[] => {
    if (!events) return [];
    return events.filter((event: CalendarEvent) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return date >= eventStart && date <= eventEnd;
    });
  };

  const calendarDays = view === 'week' 
    ? eachDayOfInterval({
        start: startOfWeek(selectedDate),
        end: endOfWeek(selectedDate),
      })
    : undefined;

  return (
    <div className="space-y-4">
      <style jsx>{`
        .event-day::after {
          content: var(--event-count);
          position: absolute;
          bottom: 2px;
          right: 2px;
          font-size: 0.7rem;
          background-color: white;
          color: var(--primary);
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Calendar Management</CardTitle>
          <Dialog open={isAddCalendarOpen} onOpenChange={setIsAddCalendarOpen}>
            <DialogTrigger asChild>
              <Button>Add Calendar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Calendar</DialogTitle>
              </DialogHeader>
                <CalendarForm onSubmit={(data) => {
                if (!data.name || !data.startDate || !data.endDate) return;
                createCalendar.mutate({
                  name: data.name,
                  startDate: data.startDate,
                  endDate: data.endDate,
                  description: data.description ?? undefined,
                  status: Status.ACTIVE,
                  type: data.type ?? CalendarType.PRIMARY,
                  isDefault: false,
                  visibility: data.visibility ?? Visibility.ALL
                });
                }} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isCalendarsLoading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading calendars...</p>
          </div>
          ) : calendarsError ? (
          <div className="text-red-500 text-center p-4">
            Error loading calendars: {calendarsError.message}
          </div>
          ) : calendars && calendars.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {calendars.map((calendar) => (
            <Card key={calendar.id} className="p-4">
              <div className="flex flex-col space-y-2">
              <h3 className="font-semibold">{calendar.name}</h3>
              <p className="text-sm text-gray-500">{calendar.description}</p>
              <div className="flex items-center space-x-2">
                <Badge>{calendar.type}</Badge>
                <Badge variant="outline">{calendar.visibility}</Badge>
              </div>
              <Button
                variant={selectedCalendarId === calendar.id ? "default" : "outline"}
                className="w-full mt-2"
                onClick={() => setSelectedCalendarId(calendar.id)}
              >
                {selectedCalendarId === calendar.id ? "Selected" : "Select Calendar"}
              </Button>
              </div>
            </Card>
            ))}
          </div>
          ) : (
          <div className="text-center text-gray-500 p-4">
            No calendars found. Create a new calendar to get started.
          </div>
          )}
        </CardContent>
      </Card>

      {selectedCalendarId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {calendars?.find(c => c.id === selectedCalendarId)?.name} - Events
            </CardTitle>
            <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
              <DialogTrigger asChild>
                <Button>Add Event</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Event</DialogTitle>
                </DialogHeader>
                <EventForm 
                  calendarId={selectedCalendarId}
                  onSubmit={(data) => {
                  if (!data.title || !data.eventType || !data.startDate || !data.endDate) return;
                  createEvent.mutate({
                    title: data.title,
                    description: data.description ?? undefined,
                    eventType: data.eventType,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    status: Status.ACTIVE,
                    calendarId: selectedCalendarId
                  });
                  }}
                />
              </DialogContent>
            </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            <div className="flex space-x-4">
            <Select value={selectedEventType} onValueChange={(value: EventType | 'ALL') => setSelectedEventType(value)}>

              <SelectTrigger>
                <SelectValue placeholder="Select Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Events</SelectItem>
                {Object.values(EventType).map((type) => (
                  <SelectItem key={type} value={type}>
                  {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={view} onValueChange={(value: 'month' | 'week') => setView(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
              </SelectContent>
            </Select>
          </div>

            {isEventsLoading ? (
              <div className="flex justify-center items-center h-40">
              <p>Loading events...</p>
              </div>
            ) : eventsError ? (
              <div className="text-red-500 text-center p-4">
              Error loading events: {eventsError.message}
              </div>
            ) : (
              <>
              {view === 'month' ? (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
                modifiers={{
                event: (date) => isDateInEvent(date),
                }}
                modifiersStyles={{
                event: getEventStyles(selectedDate)
                }}
                weekStartsOn={1}
                showOutsideDays
              />
              ) : (
              <div className="grid grid-cols-7 gap-2">
                {calendarDays?.map((day) => {
                const dayEvents = getDayEvents(day);
                return (
                <div
                key={day.toISOString()}
                className={cn(
                  "p-4 border rounded-md cursor-pointer hover:border-primary transition-colors",
                  isDateInEvent(day) ? 'bg-primary/10' : '',
                  format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') ? 'ring-2 ring-primary' : ''
                )}
                onClick={() => setSelectedDate(day)}
                >
                <div className="font-medium text-center">{format(day, 'EEE')}</div>
                <div className="text-center mb-2">{format(day, 'd')}</div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event, idx) => (
                  <div
                  key={event.id}
                  className="text-xs p-1 rounded bg-primary/20 truncate"
                  title={event.title}
                  >
                  {event.title}
                  </div>
                  ))}
                  {dayEvents.length > 2 && (
                  <div className="text-xs text-center text-muted-foreground">
                  +{dayEvents.length - 2} more
                  </div>
                  )}
                </div>
                </div>
                );
                })}
              </div>
              )}

              <div className="mt-4">
              <h3 className="text-lg font-medium mb-4">Events on {format(selectedDate, 'MMMM d, yyyy')}</h3>
              <div className="grid gap-4">
                {getDayEvents(selectedDate).length === 0 ? (
                <p className="text-center text-gray-500">No events on this day</p>
                ) : (
                getDayEvents(selectedDate).map(event => (
                <Card 
                key={event.id} 
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedEvent(event)}
                >
                <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-lg">{event.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                </div>
                <Badge variant={event.eventType === 'ACADEMIC' ? 'default' : 'secondary'}>
                  {event.eventType}
                </Badge>
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-500">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>
                  {format(new Date(event.startDate), 'MMM d, yyyy')} - {format(new Date(event.endDate), 'MMM d, yyyy')}
                </span>
                </div>
                </Card>
                ))
                )}
              </div>
              </div>
              </>
            )}
        </div>
      </CardContent>
    </Card>
  )}
  <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>

    <DialogContent>
      <DialogHeader>
        <DialogTitle>{selectedEvent?.title}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label>Description</Label>
          <p className="text-sm text-gray-500">{selectedEvent?.description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge>{selectedEvent?.eventType}</Badge>
          <Badge variant="outline">{selectedEvent?.status}</Badge>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>
            {selectedEvent && format(new Date(selectedEvent.startDate), 'PPP')} - 
            {selectedEvent && format(new Date(selectedEvent.endDate), 'PPP')}
          </span>
        </div>
      </div>
    </DialogContent>
  </Dialog>
  </div>
  );
};
