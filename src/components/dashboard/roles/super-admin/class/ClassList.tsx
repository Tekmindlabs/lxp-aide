'use client';

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Class } from "@/types/class"; // Import the shared interface
import { ClassDetailView } from "./ClassDetailView";

interface ClassListProps {
    classes: Class[];
    onSelect: (id: string) => void;
}

export const ClassList = ({ classes, onSelect }: ClassListProps) => {
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>{/* Remove any whitespace between these tags */}
                            <TableHead>Name</TableHead>
                            <TableHead>Program</TableHead>
                            <TableHead>Class Group</TableHead>
                            <TableHead>Capacity</TableHead>
                            <TableHead>Students</TableHead>
                            <TableHead>Teachers</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>{/* Remove any whitespace between these tags */}
                        {classes.map((cls) => (
                            <TableRow key={cls.id}>{/* Remove any whitespace between these tags */}
                                <TableCell>{cls.name}</TableCell>
                                <TableCell>{cls.classGroup.program.name}</TableCell>
                                <TableCell>{cls.classGroup.name}</TableCell>
                                <TableCell>{cls.capacity}</TableCell>
                                <TableCell>{cls.students?.length || 0}</TableCell>
                                <TableCell>{cls.teachers.map((t) => t.teacher.user.name).join(", ")}</TableCell>
                                <TableCell>
                                    <Badge variant={cls.status === "ACTIVE" ? "success" : "secondary"}>
                                        {cls.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onSelect(cls.id)}
                                        >Edit</Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setSelectedClassId(cls.id)}
                                        >View</Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {selectedClassId && (
                <ClassDetailView
                    isOpen={!!selectedClassId}
                    onClose={() => setSelectedClassId(null)}
                    classId={selectedClassId}
                />
            )}
        </>
    );
};