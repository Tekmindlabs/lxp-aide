'use client';

import { useState } from 'react';
import { ClassActivity, ActivityType, ActivityStatus } from '@/types/class-activity';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ClassActivityList from './ClassActivityList';
import ClassActivityForm from './ClassActivityForm';
import ClassActivityFilters from './ClassActivityFilters';
import { Loader2 } from 'lucide-react';

interface ClassActivityManagementProps {
	classId?: string;
	classGroupId?: string;
}

export default function ClassActivityManagement({ classId, classGroupId }: ClassActivityManagementProps) {
	// Basic state management
	const [isCreating, setIsCreating] = useState(false);
	const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	// Pagination state
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [total, setTotal] = useState(0);

	// Filter and search state
	const [filters, setFilters] = useState({
		type: null as ActivityType | null,
		status: null as ActivityStatus | null,
		dateRange: null as { from: Date; to: Date } | null,
	});
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

	const { toast } = useToast();

	// Handle activity selection for bulk actions
	const handleActivitySelect = (activityId: string, selected: boolean) => {
		setSelectedActivities(prev => 
			selected 
				? [...prev, activityId]
				: prev.filter(id => id !== activityId)
		);
	};

	// Handle bulk delete
	const handleBulkDelete = async () => {
		if (!selectedActivities.length) return;
		
		try {
			setIsLoading(true);
			// API call to delete selected activities
			// await deleteActivities(selectedActivities);
			
			toast({
				title: "Success",
				description: `${selectedActivities.length} activities deleted successfully`,
			});
			setSelectedActivities([]);
		} catch (err) {
			setError(err as Error);
			toast({
				title: "Error",
				description: "Failed to delete activities",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">Class Activities</h2>
				<Button onClick={() => setIsCreating(true)}>Create Activity</Button>
			</div>

			<ClassActivityFilters 
				filters={filters}
				onFilterChange={setFilters}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
			/>

			{selectedActivities.length > 0 && (
				<div className="flex items-center gap-2">
					<Button 
						variant="destructive" 
						onClick={handleBulkDelete}
						disabled={isLoading}
					>
						{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Delete Selected ({selectedActivities.length})
					</Button>
				</div>
			)}

			{error && (
				<div className="bg-destructive/15 text-destructive p-3 rounded-md">
					{error.message}
				</div>
			)}

			{isCreating || selectedActivity ? (
				<ClassActivityForm
					activityId={selectedActivity}
					classId={classId}
					classGroupId={classGroupId}
					onClose={() => {
						setIsCreating(false);
						setSelectedActivity(null);
					}}
				/>
			) : (
				<ClassActivityList
					filters={filters}
					searchQuery={searchQuery}
					page={page}
					limit={limit}
					onPageChange={setPage}
					onEdit={setSelectedActivity}
					selectedActivities={selectedActivities}
					onActivitySelect={handleActivitySelect}
					isLoading={isLoading}
				/>
			)}
		</div>
	);
}