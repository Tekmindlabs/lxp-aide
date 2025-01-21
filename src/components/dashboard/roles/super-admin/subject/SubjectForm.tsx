import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { api } from "@/utils/api";
import { Status } from "@prisma/client";

interface SubjectFormData {
	name: string;
	code: string;
	description?: string;
	classGroupIds: string[];
	teacherIds: string[];
	status: Status;
}

interface SubjectFormProps {
	selectedSubject?: any;
	classGroups: any[];
	teachers: any[];
	onSuccess: () => void;
}

export const SubjectForm = ({ 
	selectedSubject, 
	classGroups, 
	teachers, 
	onSuccess 
}: SubjectFormProps) => {
	const [formData, setFormData] = useState<SubjectFormData>(() => ({
		name: selectedSubject?.name || "",
		code: selectedSubject?.code || "",
		description: selectedSubject?.description || "",
		classGroupIds: selectedSubject?.classGroups?.map((g: any) => g.id) || [],
		teacherIds: selectedSubject?.teachers?.map((t: any) => t.teacher.id) || [],
		status: selectedSubject?.status || Status.ACTIVE,
	}));

	const utils = api.useContext();

	const createMutation = api.subject.createSubject.useMutation({
		onSuccess: () => {
			utils.subject.searchSubjects.invalidate();
			resetForm();
			onSuccess();
		},
	});

	const updateMutation = api.subject.updateSubject.useMutation({
		onSuccess: () => {
			utils.subject.searchSubjects.invalidate();
			resetForm();
			onSuccess();
		},
	});

	const resetForm = () => {
		setFormData({
			name: "",
			code: "",
			description: "",
			classGroupIds: [],
			teacherIds: [],
			status: Status.ACTIVE,
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (selectedSubject) {
			updateMutation.mutate({
				id: selectedSubject.id,
				...formData,
			});
		} else {
			createMutation.mutate(formData);
		}
	};

	return (
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
				<Label htmlFor="code">Code</Label>
				<Input
					id="code"
					value={formData.code}
					onChange={(e) => setFormData({ ...formData, code: e.target.value })}
					required
				/>
			</div>

			<div>
				<Label htmlFor="description">Description</Label>
				<Textarea
					id="description"
					value={formData.description}
					onChange={(e) => setFormData({ ...formData, description: e.target.value })}
				/>
			</div>

			<div>
				<Label>Class Groups</Label>
				<MultiSelect
					options={classGroups.map(group => ({
						label: `${group.name} (${group.program.name})`,
						value: group.id,
					}))}
					selected={formData.classGroupIds}
					onChange={(values) => setFormData({ ...formData, classGroupIds: values })}
					placeholder="Select class groups"
				/>
			</div>

			<div>
				<Label>Teachers</Label>
				<MultiSelect
					options={teachers.map(teacher => ({
						label: teacher.user.name || "Unnamed Teacher",
						value: teacher.id,
					}))}
					selected={formData.teacherIds}
					onChange={(values) => setFormData({ ...formData, teacherIds: values })}
					placeholder="Select teachers"
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

			<Button type="submit">
				{selectedSubject ? "Update" : "Create"} Subject
			</Button>
		</form>
	);
};