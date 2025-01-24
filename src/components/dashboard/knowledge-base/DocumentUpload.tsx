import React from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DocumentUploadProps {
	onUpload: (file: File) => Promise<void>;
	folderId: string;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
	onUpload,
	folderId
}) => {
	const [isUploading, setIsUploading] = React.useState(false);
	const fileInputRef = React.useRef<HTMLInputElement>(null);

	const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			setIsUploading(true);
			await onUpload(file);
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		} catch (error) {
			console.error('Upload failed:', error);
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<div className="p-4 border-b">
			<Input
				ref={fileInputRef}
				type="file"
				onChange={handleFileChange}
				className="hidden"
				accept=".txt,.pdf,.doc,.docx"
			/>
			<Button
				variant="outline"
				className="w-full"
				onClick={() => fileInputRef.current?.click()}
				disabled={isUploading}
			>
				<Upload className="mr-2 h-4 w-4" />
				{isUploading ? 'Uploading...' : 'Upload Document'}
			</Button>
		</div>
	);
};
