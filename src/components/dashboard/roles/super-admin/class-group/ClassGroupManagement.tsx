'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/utils/api";
import { ClassGroupList } from "./ClassGroupList";
import { ClassGroupForm } from "./ClassGroupForm";
import { Button } from "@/components/ui/button";

export const ClassGroupManagement = () => {
	const [activeTab, setActiveTab] = useState("list");
	const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
	const { data: classGroups, isLoading } = api.classGroup.getAllClassGroups.useQuery();
	const { data: programs } = api.program.getAllPrograms.useQuery({
		page: 1,
		pageSize: 10
	});

	const handleEdit = (groupId: string) => {
		setSelectedGroupId(groupId);
		setActiveTab("edit");
	};

	const handleSuccess = () => {
		setSelectedGroupId(null);
		setActiveTab("list");
	};

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Class Group Management</CardTitle>
						<Button 
							onClick={() => {
								setSelectedGroupId(null);
								setActiveTab("create");
							}}
							disabled={activeTab === "create"}
						>
							Create New Class Group
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
						<TabsList>
							<TabsTrigger value="list">Class Groups</TabsTrigger>
							<TabsTrigger value="create">Create</TabsTrigger>
							{selectedGroupId && <TabsTrigger value="edit">Edit</TabsTrigger>}
						</TabsList>

						<TabsContent value="list">
							<ClassGroupList 
								classGroups={classGroups || []} 
								onEdit={handleEdit}
							/>
						</TabsContent>

						<TabsContent value="create">
							<ClassGroupForm 
								programs={programs?.programs || []}
								onSuccess={handleSuccess}
							/>
						</TabsContent>

						<TabsContent value="edit">
							{selectedGroupId && (
								<ClassGroupForm 
									programs={programs?.programs || []}
									selectedClassGroup={classGroups?.find(g => g.id === selectedGroupId)}
									onSuccess={handleSuccess}
								/>
							)}
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
};
