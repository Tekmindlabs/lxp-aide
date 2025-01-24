import { lanceDbClient } from '../vectorDb/lance';
import { Document, Folder, Workspace } from './types';
import { nanoid } from 'nanoid';
import { jinaEmbedder } from './embedding-service';
import { DocumentProcessor } from './document-processor';

export class KnowledgeBaseService {
	private readonly vectorDimension = 768; // Jina embedding dimension

	constructor() {}

	async createWorkspace(workspace: Omit<Workspace, 'id' | 'vectorCollection'>): Promise<Workspace> {
		const id = nanoid();
		const vectorCollection = `workspace_${id}_vectors`;
		
		// Initialize vector collection
		await lanceDbClient.createOrGetCollection(vectorCollection, {
			vector: Array(this.vectorDimension).fill(0),
			documentId: '',
			content: '',
			metadata: {}
		});

		return {
			id,
			vectorCollection,
			...workspace
		};
	}

	async createFolder(folder: Omit<Folder, 'id'>): Promise<Folder> {
		return {
			id: nanoid(),
			...folder
		};
	}

	async addDocument(
		document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>, 
		workspaceId: string
	): Promise<Document> {
		const now = new Date();
		const id = nanoid();
		
		// Generate embeddings for document chunks
		const chunks = DocumentProcessor.chunkText(document.content);
		const embeddings = await jinaEmbedder.embedChunks(chunks);
		
		// Store document chunks with embeddings
		await lanceDbClient.addDocumentEmbeddings(
			`workspace_${workspaceId}_vectors`,
			embeddings,
			chunks.map((chunk, index) => ({
				documentId: id,
				content: chunk,
				chunkIndex: index,
				metadata: document.metadata
			}))
		);

		const newDocument = {
			id,
			createdAt: now,
			updatedAt: now,
			...document
		};

		return newDocument;
	}

	async searchDocuments(
		workspaceId: string,
		query: string,
		limit: number = 5
	) {
		// Generate embedding for search query
		const queryEmbedding = await jinaEmbedder.embedText(query);
		
		return await lanceDbClient.similaritySearch(
			`workspace_${workspaceId}_vectors`,
			queryEmbedding,
			limit
		);
	}

	async deleteWorkspace(workspaceId: string): Promise<void> {
		await lanceDbClient.deleteCollection(`workspace_${workspaceId}_vectors`);
	}
}

export const knowledgeBaseService = new KnowledgeBaseService();