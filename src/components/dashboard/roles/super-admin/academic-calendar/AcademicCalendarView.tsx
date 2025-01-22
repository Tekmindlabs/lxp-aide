'use client';

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { api } from "@/utils/api";
import { EventType, Status } from "@prisma/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type NewEvent = {
  title: string;
  description?: string;
  eventType: EventType;
  startDate: Date;
  endDate: Date;
  academicYearId: string;
};


export const AcademicCalendarView = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [selectedEventType, setSelectedEventType] = useState<EventType | 'ALL'>('ALL');
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<NewEvent>({
    title: '',
    description: '',
    eventType: EventType.ACADEMIC,
    startDate: new Date(),
    endDate: new Date(),
    academicYearId: '',
  });

  const { toast } = useToast();

  // Fetch academic years
  const { data: academicYears } = api.academicCalendar.getAllAcademicYears.useQuery();

  // Fetch events based on selected academic year and date range
  const { data: events, refetch: refetchEvents } = api.academicCalendar.getEventsByAcademicYear.useQuery({
    academicYearId: newEvent.academicYearId,
    eventType: selectedEventType === 'ALL' ? undefined : selectedEventType,
    startDate: view === 'week' ? startOfWeek(selectedDate) : undefined,
    endDate: view === 'week' ? endOfWeek(selectedDate) : undefined,
  }, {
    enabled: !!newEvent.academicYearId,
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
    createEvent.mutate({
      ...newEvent,
      status: Status.ACTIVE,
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Academic Calendar Management</CardTitle>
        <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
          <DialogTrigger asChild>
            <Button>Add Event</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Event Title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
              <Textarea
                placeholder="Event Description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              />
                <Select
                value={newEvent.eventType}
                onValueChange={(value: EventType) => setNewEvent({ ...newEvent, eventType: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Event Type" />
                </SelectTrigger>
                <SelectContent>
                    {Object.values(EventType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Start Date</span>
                  <Input
                    type="date"
                    value={format(newEvent.startDate, 'yyyy-MM-dd')}
                    onChange={(e) => setNewEvent({ ...newEvent, startDate: new Date(e.target.value) })}
                  />
                </div>
                <div>
                  <span className="text-sm font-medium">End Date</span>
                  <Input
                    type="date"
                    value={format(newEvent.endDate, 'yyyy-MM-dd')}
                    onChange={(e) => setNewEvent({ ...newEvent, endDate: new Date(e.target.value) })}
                  />
                </div>
              </div>
                <Select
                value={newEvent.academicYearId}
                onValueChange={(value) => setNewEvent({ ...newEvent, academicYearId: value })}
                required
                >
                <SelectTrigger>
                  <SelectValue placeholder="Select Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears?.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                  ))}
                </SelectContent>
                </Select>
                <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Start Date</span>
                  <Input
                  type="date"
                  value={format(newEvent.startDate, 'yyyy-MM-dd')}
                  onChange={(e) => setNewEvent({ ...newEvent, startDate: new Date(e.target.value) })}
                  required
                  />
                </div>
                <div>
                  <span className="text-sm font-medium">End Date</span>
                  <Input
                  type="date"
                  value={format(newEvent.endDate, 'yyyy-MM-dd')}
                  onChange={(e) => setNewEvent({ ...newEvent, endDate: new Date(e.target.value) })}
                  required
                  />
                </div>
                </div>
                <Button 
                onClick={handleAddEvent} 
                disabled={createEvent.isLoading}
                >
                {createEvent.isLoading ? "Creating..." : "Save Event"}
                </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-4">
            <Select value={selectedEventType} onValueChange={(value: Event['type'] | 'ALL') => setSelectedEventType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Events</SelectItem>
                <SelectItem value="ACADEMIC">Academic</SelectItem>
                <SelectItem value="HOLIDAY">Holiday</SelectItem>
                <SelectItem value="EXAM">Exam</SelectItem>
                <SelectItem value="ACTIVITY">Activity</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
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