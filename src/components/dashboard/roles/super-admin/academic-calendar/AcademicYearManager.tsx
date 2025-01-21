import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/utils/api";
import { Status } from "@prisma/client";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

interface AcademicYearFormData {
	name: string;
	startDate: Date;
	endDate: Date;
	status: Status;
}

export const AcademicYearManager = ({ academicYears }: { academicYears: any[] }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [formData, setFormData] = useState<AcademicYearFormData>({
		name: "",
		startDate: new Date(),
		endDate: new Date(),
		status: Status.ACTIVE,
	});

	const utils = api.useContext();
	const createMutation = api.academicCalendar.createAcademicYear.useMutation({
		onSuccess: () => {
			utils.academicCalendar.getAllAcademicYears.invalidate();
			setIsOpen(false);
			resetForm();
		},
	});

	const deleteMutation = api.academicCalendar.deleteAcademicYear.useMutation({
		onSuccess: () => {
			utils.academicCalendar.getAllAcademicYears.invalidate();
		},
	});

	const resetForm = () => {
		setFormData({
			name: "",
			startDate: new Date(),
			endDate: new Date(),
			status: Status.ACTIVE,
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createMutation.mutate(formData);
	};

	return (
		<div className="space-y-4">
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogTrigger asChild>
					<Button>Add Academic Year</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create Academic Year</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								required
							/>
						</div>
						<div>
							<Label>Start Date</Label>
							<Calendar
								mode="single"
								selected={formData.startDate}
								onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
								className="rounded-md border"
							/>
						</div>
						<div>
							<Label>End Date</Label>
							<Calendar
								mode="single"
								selected={formData.endDate}
								onSelect={(date) => date && setFormData({ ...formData, endDate: date })}
								className="rounded-md border"
							/>
						</div>
						<div>
							<Label htmlFor="status">Status</Label>
							<select
								id="status"
								value={formData.status}
								onChange={(e) => setFormData({ ...formData, status: e.target.value as Status })}
								className="w-full border p-2 rounded"
							>
								{Object.values(Status).map((status) => (
									<option key={status} value={status}>
										{status}
									</option>
								))}
							</select>
						</div>
						<Button type="submit">Create</Button>
					</form>
				</DialogContent>
			</Dialog>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{academicYears?.map((year) => (
					<Card key={year.id}>
						<CardContent className="p-4">
							<div className="space-y-2">
								<h3 className="font-semibold">{year.name}</h3>
								<p className="text-sm text-gray-500">
									{format(new Date(year.startDate), "MMM dd, yyyy")} -{" "}
									{format(new Date(year.endDate), "MMM dd, yyyy")}
								</p>
								<p className="text-sm">Status: {year.status}</p>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => deleteMutation.mutate(year.id)}
								>
									Delete
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
};