import { Document } from './types';

export class DocumentProcessor {
	private static readonly DEFAULT_CHUNK_SIZE = 1000;
	private static readonly DEFAULT_CHUNK_OVERLAP = 200;

	static async extractText(file: File): Promise<string> {
		// For now, handle text files only
		// TODO: Add support for PDF, DOCX etc using appropriate libraries
		return await file.text();
	}

	static chunkText(text: string, chunkSize = this.DEFAULT_CHUNK_SIZE, overlap = this.DEFAULT_CHUNK_OVERLAP): string[] {
		const chunks: string[] = [];
		let startIndex = 0;

		while (startIndex < text.length) {
			// Find the end of the current chunk
			let endIndex = startIndex + chunkSize;
			
			// If not at the end of text, try to find a natural break point
			if (endIndex < text.length) {
				// Look for next period, question mark, or exclamation point
				const nextBreak = text.substring(endIndex - 20, endIndex + 20).search(/[.!?]/);
				if (nextBreak !== -1) {
					endIndex = endIndex - 20 + nextBreak + 1;
				}
			}

			chunks.push(text.substring(startIndex, endIndex).trim());
			startIndex = endIndex - overlap;
		}

		return chunks;
	}

	static async processDocument(
		file: File, 
		metadata: Record<string, any> = {}
	): Promise<Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'embeddings'>> {
		const content = await this.extractText(file);
		
		return {
			title: file.name,
			type: file.type || 'text/plain',
			content,
			metadata: {
				...metadata,
				size: file.size,
				lastModified: new Date(file.lastModified)
			},
			folderId: metadata.folderId || 'root'
		};
	}

	static async processDocumentWithChunks(
		file: File,
		metadata: Record<string, any> = {}
	): Promise<{
		document: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'embeddings'>,
		chunks: string[]
	}> {
		const document = await this.processDocument(file, metadata);
		const chunks = this.chunkText(document.content);

		return {
			document,
			chunks
		};
	}
}