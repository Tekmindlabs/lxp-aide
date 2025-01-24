'use client';

import React from 'react';
import { Document } from '@/lib/knowledge-base/types';

interface DocumentListProps {
	documents: Document[];
	onDocumentSelect: (document: Document) => void;
}

export function DocumentList({ documents, onDocumentSelect }: DocumentListProps) {
	return (
		<div className="flex-1 overflow-auto p-4">
			<div className="grid gap-4">
				{documents.map((document) => (
					<div
						key={document.id}
						className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
						onClick={() => onDocumentSelect(document)}
					>
						<h3 className="font-medium">{document.title}</h3>
						<p className="text-sm text-gray-500">{document.type}</p>
					</div>
				))}
			</div>
		</div>
	);
}
