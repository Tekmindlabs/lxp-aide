'use client';

import React from 'react';
import { api } from '@/utils/api';
import { DocumentList } from './DocumentList';
import { FolderTree } from './FolderTree';
import { DocumentUpload } from './DocumentUpload';
import { Document, Folder } from '@/lib/knowledge-base/types';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkspaceView } from './WorkspaceView';

export function KnowledgeBaseView() {
	const { data: session } = useSession();
	const [selectedFolder, setSelectedFolder] = React.useState<Folder | null>(null);
	const [selectedDocument, setSelectedDocument] = React.useState<Document | null>(null);
	const [workspaceId] = React.useState(`workspace_${session?.user?.id || 'default'}`);

	const utils = api.useContext();

	const { data: folders = [] } = api.knowledgeBase.getFolders.useQuery(
		{ knowledgeBaseId: workspaceId },
		{ enabled: !!workspaceId }
	);

	const { data: documents = [] } = api.knowledgeBase.getDocuments.useQuery(
		{ folderId: selectedFolder?.id ?? '' },
		{ enabled: !!selectedFolder }
	);

	const { data: workspace } = api.knowledgeBase.getWorkspace.useQuery(
		{ workspaceId },
		{ enabled: !!workspaceId }
	);

	const uploadMutation = api.knowledgeBase.uploadDocument.useMutation({
		onSuccess: () => {
			if (selectedFolder) {
				void utils.knowledgeBase.getDocuments.invalidate({ 
					folderId: selectedFolder.id 
				});
			}
		}
	});

	const handleUpload = async (file: File) => {
		if (!selectedFolder) return;
		
		await uploadMutation.mutateAsync({
			file,
			workspaceId,
			metadata: {
				folderId: selectedFolder.id
			}
		});
	};

	const handleDocumentSelect = (document: Document) => {
		setSelectedDocument(document);
	};

	const handleFolderSelect = (folder: Folder) => {
		setSelectedFolder(folder);
		setSelectedDocument(null);
	};

	return (
		<Tabs defaultValue="documents" className="h-full">
			<TabsList>
				<TabsTrigger value="documents">Documents</TabsTrigger>
				<TabsTrigger value="chat">Workspace Chat</TabsTrigger>
			</TabsList>

			<TabsContent value="documents" className="h-full">
				<div className="flex h-full">
					<FolderTree
						folders={folders}
						onFolderSelect={handleFolderSelect}
						selectedFolderId={selectedFolder?.id}
					/>
					
					<div className="flex-1 flex flex-col">
						<DocumentUpload
							onUpload={handleUpload}
							folderId={selectedFolder?.id || ''}
						/>
						
						<DocumentList
							documents={documents}
							onDocumentSelect={handleDocumentSelect}
						/>
					</div>
				</div>
			</TabsContent>

			<TabsContent value="chat">
				{workspace && <WorkspaceView workspace={workspace} />}
			</TabsContent>
		</Tabs>
	);
}