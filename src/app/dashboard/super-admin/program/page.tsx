'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, PlusCircle } from "lucide-react";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { ProgramList } from "@/components/dashboard/roles/super-admin/program/ProgramList";
import { ProgramForm } from "@/components/dashboard/roles/super-admin/program/ProgramForm";

export default function ProgramPage() {
    const [isCreating, setIsCreating] = useState(false);
    const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        search: "",
        status: "ACTIVE",
        page: 1,
        pageSize: 10,
    });

    const { toast } = useToast();
    const utils = api.useContext();

    // Optimized query hooks with shared configuration
    const queryConfig = {
        keepPreviousData: true,
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const { data: { programs = [], pagination } = {}, isLoading: programsLoading } = 
        api.program.getAll.useQuery(filters, queryConfig);

    const { data: calendars = [], isLoading: calendarsLoading } = 
        api.academicCalendar.getAllCalendars.useQuery(undefined, queryConfig);

    const { data: coordinators = [], isLoading: coordinatorsLoading } = 
        api.program.getAvailableCoordinators.useQuery(undefined, queryConfig);

    const createProgram = api.program.create.useMutation({
        onSuccess: () => {
            toast({ title: "Success", description: "Program created successfully" });
            setIsCreating(false);
            void utils.program.getAll.invalidate();
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const isLoading = programsLoading || calendarsLoading || coordinatorsLoading;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Program Management</h2>
                <Dialog open={isCreating} onOpenChange={setIsCreating}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Program
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Program</DialogTitle>
                        </DialogHeader>
                        <ProgramForm 
                            calendars={calendars}
                            coordinators={coordinators}
                            onSuccess={() => {
                                setIsCreating(false);
                                void utils.program.getAll.invalidate();
                            }}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Programs Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 space-y-4">
                        <div className="flex space-x-4">
                            <Input
                                placeholder="Search programs..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                                className="max-w-sm"
                            />
                            <Select
                                value={filters.status}
                                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value, page: 1 }))}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <ProgramList 
                            programs={programs}
                            onSelect={setSelectedProgramId}
                            calendars={calendars}
                            pagination={pagination}
                            onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
                        />
                    )}

                    {selectedProgramId && (
                        <Dialog open={!!selectedProgramId} onOpenChange={() => setSelectedProgramId(null)}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Program</DialogTitle>
                                </DialogHeader>
                                <ProgramForm
                                    coordinators={coordinators}
                                    selectedProgram={programs.find(p => p.id === selectedProgramId)}
                                    onSuccess={() => {
                                        setSelectedProgramId(null);
                                        void utils.program.getAll.invalidate();
                                    }}
                                />
                            </DialogContent>
                        </Dialog>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
