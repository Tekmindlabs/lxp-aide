"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Program, Status } from "@prisma/client";
import { api } from "@/utils/api";
import { ProgramList } from "./ProgramList";
import { ProgramForm } from "./ProgramForm";

interface AcademicYear {
	id: string;
	name: string;
  }
  
  interface ProgramWithDetails extends Program {
	coordinator?: {
	  user: {
		name: string | null;
	  };
	} | null;
	classGroups: any[]; // You can make this more specific based on your needs
  }

interface SearchFilters {
    search: string;
    level: string;
    status?: Status;
    academicYearId?: string;
    sortBy?: 'name' | 'level' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
}

export const ProgramManagement = () => {
    const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
    const [filters, setFilters] = useState<SearchFilters>({
        search: "",
        level: "",
    });

    const utils = api.useContext();
    
    const { data: academicYears } = api.academicCalendar.getAllAcademicYears.useQuery();
    const { data: programs, isLoading } = api.program.searchPrograms.useQuery(filters);
    const { data: coordinators } = api.program.getAvailableCoordinators.useQuery();

    const associateAcademicYear = api.program.associateAcademicYear.useMutation({
        onSuccess: () => {
            utils.program.searchPrograms.invalidate();
        },
    });

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Program Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 space-y-4">
                        <div className="flex space-x-4">
                            <Input
                                placeholder="Search programs..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="max-w-sm"
                            />
                            <Input
                                placeholder="Level"
                                value={filters.level}
                                onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                                className="max-w-sm"
                            />
                            <Select
                                value={filters.status}
                                onValueChange={(value) => setFilters({ ...filters, status: value as Status })}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(Status).map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.academicYearId}
                                onValueChange={(value) => setFilters({ ...filters, academicYearId: value })}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Academic Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {academicYears?.map((year: AcademicYear) => (
    <SelectItem key={year.id} value={year.id}>
        {year.name}
    </SelectItem>
))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex space-x-4">
                            <Select
                                value={filters.sortBy}
                                onValueChange={(value) => setFilters({ ...filters, sortBy: value as 'name' | 'level' | 'createdAt' })}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="name">Name</SelectItem>
                                    <SelectItem value="level">Level</SelectItem>
                                    <SelectItem value="createdAt">Created Date</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.sortOrder}
                                onValueChange={(value) => setFilters({ ...filters, sortOrder: value as 'asc' | 'desc' })}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Sort order" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="asc">Ascending</SelectItem>
                                    <SelectItem value="desc">Descending</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <ProgramList 
                            programs={programs || []} 
                            onSelect={setSelectedProgramId}
                            onAssociateAcademicYear={(programId, academicYearId) => 
                                associateAcademicYear.mutate({ programId, academicYearId })
                            }
                            academicYears={academicYears || []}
                        />
                        <ProgramForm 
                            coordinators={coordinators || []}
                            selectedProgram={programs?.find((p: ProgramWithDetails) => p.id === selectedProgramId)}
                            onSuccess={() => setSelectedProgramId(null)}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};