'use client';

import { useState } from "react";
import { Calendar as CalendarModel, CalendarType, Status, Visibility } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

interface CalendarFormProps {
	calendar?: Partial<CalendarModel>;
	onSubmit: (data: Partial<CalendarModel>) => void;
}

export const CalendarForm = ({ calendar, onSubmit }: CalendarFormProps) => {
	const [formData, setFormData] = useState<Partial<CalendarModel>>({
		name: calendar?.name || '',
		description: calendar?.description || '',
		type: calendar?.type || CalendarType.PRIMARY,
		visibility: calendar?.visibility || Visibility.ALL,
		status: calendar?.status || Status.ACTIVE,
		isDefault: calendar?.isDefault || false,
		startDate: calendar?.startDate || new Date(),
		endDate: calendar?.endDate || new Date(),
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(formData);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="name">Name</Label>
				<Input
					id="name"
					value={formData.name}
					onChange={(e) => setFormData({ ...formData, name: e.target.value })}
					required
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="description">Description</Label>
				<Textarea
					id="description"
					value={formData.description}
					onChange={(e) => setFormData({ ...formData, description: e.target.value })}
				/>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label>Type</Label>
					<Select
						value={formData.type}
						onValueChange={(value: CalendarType) =>
							setFormData({ ...formData, type: value })
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select type" />
						</SelectTrigger>
						<SelectContent>
							{Object.values(CalendarType).map((type) => (
								<SelectItem key={type} value={type}>
									{type}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label>Visibility</Label>
					<Select
						value={formData.visibility}
						onValueChange={(value: Visibility) =>
							setFormData({ ...formData, visibility: value })
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select visibility" />
						</SelectTrigger>
						<SelectContent>
							{Object.values(Visibility).map((visibility) => (
								<SelectItem key={visibility} value={visibility}>
									{visibility}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="space-y-2">
				<Label>Date Range</Label>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<Label>Start Date</Label>
						<Calendar
							mode="single"
							selected={formData.startDate}
							onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
						/>
					</div>
					<div>
						<Label>End Date</Label>
						<Calendar
							mode="single"
							selected={formData.endDate}
							onSelect={(date) => date && setFormData({ ...formData, endDate: date })}
						/>
					</div>
				</div>
			</div>

			<div className="flex items-center space-x-2">
				<Switch
					checked={formData.isDefault}
					onCheckedChange={(checked) =>
						setFormData({ ...formData, isDefault: checked })
					}
				/>
				<Label>Set as default calendar</Label>
			</div>

			<Button type="submit">
				{calendar ? 'Update Calendar' : 'Create Calendar'}
			</Button>
		</form>
	);
};