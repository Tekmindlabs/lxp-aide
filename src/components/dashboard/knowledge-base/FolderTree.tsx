import React from 'react';
import { Folder } from '@/lib/knowledge-base/types';
import { ChevronRight, ChevronDown, Folder as FolderIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FolderTreeProps {
	folders: Folder[];
	onFolderSelect: (folder: Folder) => void;
	selectedFolderId?: string;
}

export const FolderTree: React.FC<FolderTreeProps> = ({
	folders,
	onFolderSelect,
	selectedFolderId
}) => {
	const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set());

	const toggleFolder = (folderId: string) => {
		const newExpanded = new Set(expandedFolders);
		if (newExpanded.has(folderId)) {
			newExpanded.delete(folderId);
		} else {
			newExpanded.add(folderId);
		}
		setExpandedFolders(newExpanded);
	};

	const renderFolder = (folder: Folder, level = 0) => {
		const isExpanded = expandedFolders.has(folder.id);
		const isSelected = folder.id === selectedFolderId;
		const hasSubFolders = folder.subFolders && folder.subFolders.length > 0;

		return (
			<div key={folder.id} style={{ marginLeft: `${level * 16}px` }}>
				<Button
					variant={isSelected ? "secondary" : "ghost"}
					className="w-full justify-start gap-2 px-2"
					onClick={() => onFolderSelect(folder)}
				>
					{hasSubFolders && (
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
				</Button>
				
				{isExpanded && hasSubFolders && (
					<div className="mt-1">
						{folder.subFolders?.map(subFolder => renderFolder(subFolder, level + 1))}
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="w-64 p-4 border-r">
			{folders.map(folder => renderFolder(folder))}
		</div>
	);
};