'use client';

import React from 'react';
import { Folder } from '@/lib/knowledge-base/types';
import { ChevronRight, ChevronDown, FolderIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FolderTreeProps {
	folders: Folder[];
	selectedFolderId?: string;
	onFolderSelect: (folder: Folder) => void;
}

export function FolderTree({ folders, selectedFolderId, onFolderSelect }: FolderTreeProps) {
	const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set());

	const toggleFolder = (folderId: string) => {
		setExpandedFolders(prev => {
			const next = new Set(prev);
			if (next.has(folderId)) {
				next.delete(folderId);
			} else {
				next.add(folderId);
			}
			return next;
		});
	};

	const renderFolder = (folder: Folder, depth = 0) => {
		const isExpanded = expandedFolders.has(folder.id);
		const hasChildren = folder.children && folder.children.length > 0;
		const isSelected = folder.id === selectedFolderId;

		return (
			<div key={folder.id}>
				<Button
					variant={isSelected ? "secondary" : "ghost"}
					className={`w-full justify-start pl-${depth * 4}`}
					onClick={() => onFolderSelect(folder)}
				>
					<div className="flex items-center gap-2">
						{hasChildren && (
							<button
								onClick={(e) => {
									e.stopPropagation();
									toggleFolder(folder.id);
								}}
								className="p-1"
							>
								{isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
							</button>
						)}
						<FolderIcon size={16} />
						<span>{folder.name}</span>
					</div>
				</Button>
				
				{isExpanded && hasChildren && (
					<div className="ml-4">
						{folder.children?.map(child => renderFolder(child, depth + 1))}
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="w-64 border-r p-4 overflow-auto">
			<div className="space-y-1">
				{folders.map(folder => renderFolder(folder))}
			</div>
		</div>
	);
}