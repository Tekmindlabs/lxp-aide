'use client';

import { ClassActivityFilters } from '@/types/class-activity';
import { Input } from '@/components/ui/input';
import { 
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';

interface ActivityFiltersProps {
	filters: ClassActivityFilters;
	onFilterChange: (filters: ClassActivityFilters) => void;
	searchQuery: string;
	onSearchChange: (query: string) => void;
}

export default function ClassActivityFilters({
	filters,
	onFilterChange,
	searchQuery,
	onSearchChange,
}: ActivityFiltersProps) {
	return (
		<div className="space-y-4">
			<div className="flex gap-4">
				<Input
					placeholder="Search activities..."
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					className="max-w-sm"
				/>
				
				<Select
					value={filters.type || ''}
					onValueChange={(value) => 
						onFilterChange({ ...filters, type: value as any })
					}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Activity Type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="">All Types</SelectItem>
						<SelectItem value="QUIZ">Quiz</SelectItem>
						<SelectItem value="ASSIGNMENT">Assignment</SelectItem>
						<SelectItem value="READING">Reading</SelectItem>
						<SelectItem value="PROJECT">Project</SelectItem>
						<SelectItem value="EXAM">Exam</SelectItem>
					</SelectContent>
				</Select>

				<Select
					value={filters.status || ''}
					onValueChange={(value) =>
						onFilterChange({ ...filters, status: value as any })
					}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="">All Status</SelectItem>
						<SelectItem value="PENDING">Pending</SelectItem>
						<SelectItem value="SUBMITTED">Submitted</SelectItem>
						<SelectItem value="GRADED">Graded</SelectItem>
						<SelectItem value="LATE">Late</SelectItem>
						<SelectItem value="MISSED">Missed</SelectItem>
					</SelectContent>
				</Select>

				<DateRangePicker
					value={filters.dateRange}
					onChange={(range) =>
						onFilterChange({ ...filters, dateRange: range })
					}
				/>
			</div>
		</div>
	);
}