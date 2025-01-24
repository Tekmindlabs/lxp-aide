'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface DocumentUploadProps {
	onUpload: (file: File) => Promise<void>;
	folderId: string;
}

export function DocumentUpload({ onUpload, folderId }: DocumentUploadProps) {
	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const [isUploading, setIsUploading] = React.useState(false);

	const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file || !folderId) return;

		try {
			setIsUploading(true);
			await onUpload(file);
		} catch (error) {
			console.error('Upload failed:', error);
		} finally {
			setIsUploading(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		}
	};

	return (
		<div className="p-4 border-b">
			<input
				type="file"
				ref={fileInputRef}
				onChange={handleFileChange}
				className="hidden"
				accept=".pdf,.doc,.docx,.txt"
			/>
			<Button
				onClick={() => fileInputRef.current?.click()}
				disabled={isUploading || !folderId}
				className="w-full"
			>
				<Upload className="mr-2 h-4 w-4" />
				{isUploading ? 'Uploading...' : 'Upload Document'}
			</Button>
		</div>
	);
}

