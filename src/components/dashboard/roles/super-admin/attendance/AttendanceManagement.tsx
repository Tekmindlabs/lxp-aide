'use client';

import { useState } from "react";
import { api } from "@/trpc/react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { AttendanceList } from "./AttendanceList";

interface ClassData {
    id: string;
    name: string;
}

export const AttendanceManagement = () => {
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const { data: classesData } = api.class.getTeacherClasses.useQuery();

    return (
        <Card>
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Select a class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classesData?.map((classItem: ClassData) => (
                                    <SelectItem key={classItem.id} value={classItem.id}>
                                        {classItem.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <DateTimePicker
                            value={selectedDate}
                            onChange={(date) => date && setSelectedDate(date)}
                        />
                    </div>
                    {selectedClassId && (
                        <AttendanceList classId={selectedClassId} date={selectedDate} />
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
