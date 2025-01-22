'use client'

import { useState } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => i).map(hour => ({
	start: `${hour.toString().padStart(2, '0')}:00`,
	end: `${(hour + 1).toString().padStart(2, '0')}:00`
}));

interface TimetableViewProps {
	timetableId: string;
	onBack: () => void;
}

export default function TimetableView({ timetableId, onBack }: TimetableViewProps) {
	const { data: timetable, isLoading } = api.timetable.getById.useQuery(timetableId);
	const [selectedPeriod, setSelectedPeriod] = useState<any>(null);

	if (isLoading) return <div>Loading...</div>;
	if (!timetable) return <div>Timetable not found</div>;

	const getPeriodsByDay = (dayOfWeek: number) => {
		return timetable.periods.filter(period => period.dayOfWeek === dayOfWeek);
	};

	const formatTime = (date: Date) => {
		return format(new Date(date), 'HH:mm');
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Button onClick={onBack} variant="outline">
					Back
				</Button>
				<h2 className="text-2xl font-bold">
					{timetable.classGroup?.name || timetable.class?.name} Timetable
				</h2>
			</div>

			<div className="overflow-x-auto">
				<div className="min-w-[800px]">
					<div className="grid grid-cols-8 gap-2">
						<div className="sticky left-0 bg-background p-2">Time</div>
						{DAYS.map(day => (
							<div key={day} className="p-2 font-semibold text-center">
								{day}
							</div>
						))}
					</div>

					{TIME_SLOTS.map(slot => (
						<div key={slot.start} className="grid grid-cols-8 gap-2 border-t">
							<div className="sticky left-0 bg-background p-2 text-sm">
								{slot.start}
							</div>
							{DAYS.map((_, index) => {
								const periods = getPeriodsByDay(index + 1);
								const periodInSlot = periods.find(period => {
									const startTime = formatTime(period.startTime);
									return startTime === slot.start;
								});

								return (
									<div key={index} className="relative p-2 min-h-[60px]">
										{periodInSlot && (
											<Card 
												className="absolute inset-x-1 cursor-pointer hover:bg-accent"
												style={{
													top: '0',
													height: `${calculatePeriodHeight(periodInSlot)}px`
												}}
												onClick={() => setSelectedPeriod(periodInSlot)}
											>
												<CardContent className="p-2 text-xs">
													<div className="font-semibold">{periodInSlot.subject.name}</div>
													<div>{periodInSlot.classroom.name}</div>
													<div>
														{formatTime(periodInSlot.startTime)} - {formatTime(periodInSlot.endTime)}
													</div>
												</CardContent>
											</Card>
										)}
									</div>
								);
							})}
						</div>
					))}
				</div>
			</div>

			{selectedPeriod && (
				<Card className="mt-4">
					<CardHeader>
						<CardTitle>Period Details</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<p><strong>Subject:</strong> {selectedPeriod.subject.name}</p>
							<p><strong>Classroom:</strong> {selectedPeriod.classroom.name}</p>
							<p><strong>Time:</strong> {formatTime(selectedPeriod.startTime)} - {formatTime(selectedPeriod.endTime)}</p>
							<Button 
								variant="outline" 
								onClick={() => setSelectedPeriod(null)}
							>
								Close
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

function calculatePeriodHeight(period: any) {
	const start = new Date(period.startTime);
	const end = new Date(period.endTime);
	const durationInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
	return durationInHours * 60; // 60px per hour
}