import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/utils/api";
import { ClassGroupList } from "./ClassGroupList";
import { ClassGroupForm } from "./ClassGroupForm";

export const ClassGroupManagement = () => {
	const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
	const { data: classGroups, isLoading } = api.classGroup.getAllClassGroups.useQuery();
	const { data: programs } = api.program.getAllPrograms.useQuery();

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Class Group Management</CardTitle>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="list" className="space-y-4">
						<TabsList>
							<TabsTrigger value="list">Class Groups</TabsTrigger>
							<TabsTrigger value="create">Create Class Group</TabsTrigger>
						</TabsList>

						<TabsContent value="list">
							<ClassGroupList 
								classGroups={classGroups || []} 
								onSelect={setSelectedGroupId}
							/>
						</TabsContent>

						<TabsContent value="create">
							<ClassGroupForm 
								programs={programs || []}
								selectedClassGroup={classGroups?.find(g => g.id === selectedGroupId)}
								onSuccess={() => setSelectedGroupId(null)}
							/>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
};