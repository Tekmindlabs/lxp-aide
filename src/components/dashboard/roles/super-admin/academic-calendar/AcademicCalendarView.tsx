'use client';

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { EventForm } from "./EventForm";

import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { api } from "@/utils/api";
import { EventType, Status } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { CalendarForm } from "./CalendarForm";


type NewEvent = {
  title: string;
  description?: string;
  eventType: EventType;
  startDate: Date;
  endDate: Date;
};



export const AcademicCalendarView = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [selectedEventType, setSelectedEventType] = useState<EventType | 'ALL'>('ALL');
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');
  const [isAddCalendarOpen, setIsAddCalendarOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newCalendar, setNewCalendar] = useState({ name: '', description: '' });



  const { toast } = useToast();

  // Fetch calendars
  const { data: calendars, refetch: refetchCalendars } = api.academicCalendar.getAllCalendars.useQuery();

  // Create calendar mutation
  const createCalendar = api.academicCalendar.createCalendar.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Calendar created successfully" });
      setIsAddCalendarOpen(false);
      void refetchCalendars();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Fetch events based on date range
  const { data: events, refetch: refetchEvents } = api.academicCalendar.getEventsByDateRange.useQuery({
    eventType: selectedEventType === 'ALL' ? undefined : selectedEventType,
    startDate: view === 'week' ? startOfWeek(selectedDate) : undefined,
    endDate: view === 'week' ? endOfWeek(selectedDate) : undefined,
    calendarId: selectedCalendarId
  }, {
    enabled: !!selectedCalendarId,
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
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddEvent = () => {
    if (!selectedCalendarId) {
      toast({
        title: "Error",
        description: "Please select a calendar",
        variant: "destructive",
      });
      return;
    }

    createEvent.mutate({
      ...newEvent,
      status: Status.ACTIVE,
      calendarId: selectedCalendarId,
    });
  };

  const isDateInEvent = (date: Date) => {
    if (!events) return false;
    return events.some(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return date >= eventStart && date <= eventEnd;
    });
  };

  const getDayEvents = (date: Date) => {
    if (!events) return [];
    return events.filter(event => {
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
              <CalendarForm onSubmit={(data) => createCalendar.mutate(data)} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {calendars?.map((calendar) => (
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
              createEvent.mutate({
                ...data,
                status: Status.ACTIVE,
                calendarId: selectedCalendarId,
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
              event: { backgroundColor: 'var(--primary)', color: 'white' },
              }}
              weekStartsOn={1}
              showOutsideDays
            />
            ) : (
            <div className="grid grid-cols-7 gap-2">
              {calendarDays?.map((day) => (
              <div
                key={day.toISOString()}
                className={`p-2 border rounded-md ${
                isDateInEvent(day) ? 'bg-primary text-white' : ''
                }`}
                onClick={() => setSelectedDate(day)}
              >
                <div className="font-medium">{format(day, 'EEE')}</div>
                <div>{format(day, 'd')}</div>
              </div>
              ))}
            </div>
            )}

          <div className="mt-4">
            <h3 className="text-lg font-medium">Events on {format(selectedDate, 'MMMM d, yyyy')}</h3>
            <div className="mt-2 space-y-2">
                {getDayEvents(selectedDate)

                .map(event => (
                  <Card key={event.id} className="p-4">
                    <h4 className="font-medium">{event.title}</h4>
                    <p className="text-sm text-gray-500">{event.description}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(event.startDate), 'MMM d, yyyy')} - {format(new Date(event.endDate), 'MMM d, yyyy')}
                    </p>
                  </Card>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};