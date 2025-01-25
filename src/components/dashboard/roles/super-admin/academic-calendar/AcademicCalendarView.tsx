'use client';

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { api } from "@/utils/api";
import { EventType, Status, CalendarType, Visibility } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { CalendarForm } from "./CalendarForm";
import { EventForm } from "./EventForm";

export const AcademicCalendarView = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [selectedEventType, setSelectedEventType] = useState<EventType | 'ALL'>('ALL');
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');
  const [isAddCalendarOpen, setIsAddCalendarOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

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




  const isDateInEvent = (date: Date) => {
    if (!events) return false;
    return events.some(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return date >= eventStart && date <= eventEnd;
    });
  };

  const getEventStyles = (date: Date) => {
    if (!events) return {};
    const dayEvents = getDayEvents(date);
    if (dayEvents.length === 0) return {};
    
    return {
      backgroundColor: 'var(--primary)',
      color: 'white',
      position: 'relative',
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: '2px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        backgroundColor: 'white'
      }
    };
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
              event: (date) => getEventStyles(date),
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
            <h3 className="text-lg font-medium mb-4">Events on {format(selectedDate, 'MMMM d, yyyy')}</h3>
            <div className="grid gap-4">
              {getDayEvents(selectedDate).map(event => (
              <Card key={event.id} className="p-4 hover:shadow-md transition-shadow">
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
              ))}
            </div>
            </div>
        </div>
      </CardContent>
    </Card>
  )}
  </div>
);
};
