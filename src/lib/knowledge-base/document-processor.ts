import { Document } from './types';

export class DocumentProcessor {
	private static readonly CHUNK_SIZE = 1024;
	private static readonly CHUNK_OVERLAP = 50;

	static async extractText(file: File): Promise<string> {
		// For now, handle text files only
		// TODO: Add support for PDF, DOCX etc using appropriate libraries
		return await file.text();
	}

	static chunkText(text: string): string[] {
		const words = text.split(/\s+/);
		const chunks: string[] = [];
		
		for (let i = 0; i < words.length; i += this.CHUNK_SIZE - this.CHUNK_OVERLAP) {
			const chunk = words.slice(i, i + this.CHUNK_SIZE).join(' ');
			if (chunk.length > 0) {
				chunks.push(chunk);
			}
		}
		
		return chunks;
	}

	static processDocument(content: string, metadata: { 
		documentId: string; 
		title: string; 
		type: string; 
		knowledgeBaseId: string; 
		[key: string]: any 
	}) {
		const chunks = this.chunkText(content);
		return chunks.map((chunk, index) => ({
			content: chunk,
			chunkIndex: index,
			metadata: {
				...metadata,
				totalChunks: chunks.length
			}
		}));
	}

	static async processDocumentFromFile(
		file: File, 
		metadata: { 
			knowledgeBaseId: string;
			folderId?: string;
			[key: string]: any 
		}
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
			folderId: metadata.folderId || 'root',
			knowledgeBaseId: metadata.knowledgeBaseId
		};
	}

	static async processDocumentWithChunks(
		file: File,
		metadata: Record<string, any> = {}
	): Promise<{
		document: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'embeddings'>,
		chunks: string[]
	}> {
		const document = await this.processDocumentFromFile(file, metadata);
		const chunks = this.chunkText(document.content);

		return {
			document,
			chunks
		};
	}
}