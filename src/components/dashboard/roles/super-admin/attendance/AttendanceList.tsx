import { api } from "@/trpc/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AttendanceStatus } from "@prisma/client";

interface StudentData {
    id: string;
    name: string | null;
}

interface AttendanceData {
    status: AttendanceStatus;
}

interface AttendanceListProps {
    classId: string;
    date: Date;
}

export const AttendanceList = ({ classId, date }: AttendanceListProps) => {
    const { data: studentsData } = api.class.getClassStudents.useQuery({ classId });
    const { data: attendanceData } = api.attendance.getAttendance.useQuery({ 
        classId, 
        date: date.toISOString() 
    });

    const updateAttendanceMutation = api.attendance.updateAttendance.useMutation();

    const handleAttendanceChange = async (studentId: string, status: AttendanceStatus) => {
        await updateAttendanceMutation.mutateAsync({
            studentId,
            classId,
            date: date.toISOString(),
            status
        });
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {studentsData?.map((student: StudentData) => (
                    <TableRow key={student.id}>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>
                            <Select
                                value={attendanceData?.[student.id]?.status || AttendanceStatus.ABSENT}
                                onValueChange={(value) => handleAttendanceChange(student.id, value as AttendanceStatus)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={AttendanceStatus.PRESENT}>Present</SelectItem>
                                    <SelectItem value={AttendanceStatus.ABSENT}>Absent</SelectItem>
                                    <SelectItem value={AttendanceStatus.LATE}>Late</SelectItem>
                                    <SelectItem value={AttendanceStatus.EXCUSED}>Excused</SelectItem>
                                </SelectContent>
                            </Select>
                        </TableCell>
                        <TableCell>
                            <Button variant="ghost" size="sm">
                                View History
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};