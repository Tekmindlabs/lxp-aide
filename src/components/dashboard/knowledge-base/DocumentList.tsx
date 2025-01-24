import React from 'react';
import { Document } from '@/lib/knowledge-base/types';
import { File, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DocumentListProps {
	documents: Document[];
	onDocumentSelect: (document: Document) => void;
	onDocumentDelete?: (document: Document) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
	documents,
	onDocumentSelect,
	onDocumentDelete
}) => {
	return (
		<div className="flex-1 p-4">
			<div className="grid gap-2">
				{documents.map(doc => (
					<div
						key={doc.id}
						className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
					>
						<Button
							variant="ghost"
							className="flex items-center gap-2 w-full justify-start"
							onClick={() => onDocumentSelect(doc)}
						>
							<File size={16} />
							<span>{doc.title}</span>
							<span className="text-sm text-gray-500 ml-2">
								{new Date(doc.createdAt).toLocaleDateString()}
							</span>
						</Button>
						
						{onDocumentDelete && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="sm">
										<MoreVertical size={16} />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem onClick={() => onDocumentDelete(doc)}>
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
				))}
				
				{documents.length === 0 && (
					<div className="text-center text-gray-500 py-8">
						No documents in this folder
					</div>
				)}
			</div>
		</div>
	);
};