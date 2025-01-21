import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/utils/api";
import { AcademicYearManager } from "./AcademicYearManager";
import { EventManager } from "./EventManager";
import { TermManager } from "./TermManager";
import { EventType } from "@prisma/client";

export const AcademicCalendarView = () => {
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
	const [view, setView] = useState<"month" | "week" | "day">("month");
	const [selectedAcademicYear, setSelectedAcademicYear] = useState<string | null>(null);
	const [selectedEventType, setSelectedEventType] = useState<EventType | "ALL">("ALL");
	
	const { data: academicYears, isLoading } = api.academicCalendar.getAllAcademicYears.useQuery();
	const { data: events } = api.academicCalendar.getEventsByAcademicYear.useQuery(
		selectedAcademicYear || "",
		{ enabled: !!selectedAcademicYear }
	);

	const filteredEvents = events?.filter(event => 
		selectedEventType === "ALL" || event.eventType === selectedEventType
	);

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Academic Calendar Management</CardTitle>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="calendar" className="space-y-4">
						<TabsList>
							<TabsTrigger value="calendar">Calendar</TabsTrigger>
							<TabsTrigger value="academic-years">Academic Years</TabsTrigger>
							<TabsTrigger value="terms">Terms</TabsTrigger>
							<TabsTrigger value="events">Events</TabsTrigger>
						</TabsList>

						<TabsContent value="calendar" className="space-y-4">
							<div className="flex space-x-4">
								<Select value={selectedAcademicYear || ""} onValueChange={setSelectedAcademicYear}>
									<SelectTrigger className="w-[200px]">
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

								<Select value={selectedEventType} onValueChange={(value) => setSelectedEventType(value as EventType | "ALL")}>
									<SelectTrigger className="w-[200px]">
										<SelectValue placeholder="Filter Events" />
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

								<select
									value={view}
									onChange={(e) => setView(e.target.value as "month" | "week" | "day")}
									className="border p-2 rounded"
								>
									<option value="month">Month</option>
									<option value="week">Week</option>
									<option value="day">Day</option>
								</select>
							</div>
							<Calendar
								mode="single"
								selected={selectedDate}
								onSelect={setSelectedDate}
								className="rounded-md border"
							/>
						</TabsContent>

						<TabsContent value="academic-years">
							<AcademicYearManager academicYears={academicYears || []} />
						</TabsContent>

						<TabsContent value="terms">
							{selectedAcademicYear ? (
								<TermManager academicYearId={selectedAcademicYear} />
							) : (
								<div>Please select an academic year first</div>
							)}
						</TabsContent>

						<TabsContent value="events">
							<EventManager 
								academicYears={academicYears || []} 
								filteredEvents={filteredEvents || []}
							/>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
};