'use client'


import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

type TimetableViewProps = {
	timetableId: string;
	onBack: () => void;
};

const DAYS = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
	"Sunday",
];

export default function TimetableView({ timetableId, onBack }: TimetableViewProps) {
	const { data: timetable, isLoading } = api.timetable.getById.useQuery(timetableId);

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (!timetable) {
		return <div>Timetable not found</div>;
	}

	// Group periods by day
	const periodsByDay = DAYS.map((day, index) => ({
		day,
		periods: timetable.periods
			.filter((period) => period.dayOfWeek === index + 1)
			.sort((a, b) => {
				const aTime = new Date(a.startTime).getTime();
				const bTime = new Date(b.startTime).getTime();
				return aTime - bTime;
			}),
	}));

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

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{periodsByDay.map(({ day, periods }) => (
					<Card key={day}>
						<CardHeader>
							<CardTitle>{day}</CardTitle>
						</CardHeader>
						<CardContent>
							{periods.length === 0 ? (
								<p className="text-muted-foreground">No periods scheduled</p>
							) : (
								<div className="space-y-2">
									{periods.map((period) => (
										<Card key={period.id} className="p-2">
											<div className="text-sm">
												<div className="font-semibold">
													{format(new Date(period.startTime), "HH:mm")} -{" "}
													{format(new Date(period.endTime), "HH:mm")}
												</div>
												<div>{period.subject.name}</div>
												<div className="text-muted-foreground">
													Room: {period.classroom.name}
												</div>
											</div>
										</Card>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}