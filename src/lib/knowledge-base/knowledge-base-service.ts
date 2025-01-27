// External dependencies
import { nanoid } from 'nanoid';

// Database clients
import { prisma } from '@/server/db';
import { milvusDbClient } from '../vectorDb/milvus';

// Types
import { Document, Folder, KnowledgeBase } from './types';

// Services
import { jinaEmbedder } from './embedding-service';
import { DocumentProcessor } from './document-processor';

export class KnowledgeBaseService {
	private readonly vectorDimension = 1536; // OpenAI embedding dimension
	private readonly prisma;

	constructor() {
		this.prisma = prisma;
	}

	async createKnowledgeBase(data: { name: string; description?: string }): Promise<KnowledgeBase> {
		const id = nanoid();
		const vectorCollection = `kb_${id}_vectors`;
		
		// Initialize vector collection
		await milvusDbClient.createOrGetCollection(vectorCollection);



		return await this.prisma.knowledgeBase.create({
			data: {
				id,
				vectorCollection,
				...data,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		});
	}

	async getFolders(knowledgeBaseId: string): Promise<Folder[]> {
		try {
			const folders = await this.prisma.documentFolder.findMany({
				where: {
					knowledgeBaseId
				},
				include: {
					subFolders: true,
					documents: true
				}
			});

			return folders.map(folder => ({
				id: folder.id,
				name: folder.name,
				description: folder.description || '',
				parentFolderId: folder.parentFolderId || undefined,
				knowledgeBaseId: folder.knowledgeBaseId,
				children: folder.subFolders,
				metadata: folder.metadata as Record<string, any>
			}));
		} catch (error) {
			console.error('Error fetching folders:', error);
			throw error;
		}
	}

	async getDocuments(folderId: string): Promise<Document[]> {
		const documents = await prisma.document.findMany({
			where: {
				folderId
			}
		});

		return documents.map(doc => ({
			id: doc.id,
			title: doc.title,
			type: doc.type,
			content: doc.content,
			metadata: doc.metadata as Record<string, any>,
			embeddings: [],  // We don't need to send embeddings to the client
			folderId: doc.folderId,
			createdAt: doc.createdAt,
			updatedAt: doc.updatedAt
		}));
	}

	async createFolder(folder: Omit<Folder, 'id'>): Promise<Folder> {
		return await this.prisma.documentFolder.create({
			data: {
				id: nanoid(),
				...folder
			}
		});
	}

	async addDocument(
		document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>, 
		knowledgeBaseId: string
	): Promise<Document> {
		const now = new Date();
		const id = nanoid();
		
		// Process document into optimized chunks
		const processedChunks = DocumentProcessor.processDocument(document.content, {
			documentId: id,
			title: document.title,
			type: document.type,
			...document.metadata
		});
		
		// Generate embeddings for chunks
		const embeddings = await jinaEmbedder.embedChunks(
			processedChunks.map(chunk => chunk.content)
		);
		
		const knowledgeBase = await this.prisma.knowledgeBase.findUnique({
			where: { id: knowledgeBaseId }
		});
		
		// Store document chunks with embeddings in Milvus
		await milvusDbClient.addDocuments(
			knowledgeBase.vectorCollection,
			processedChunks.map((chunk, index) => ({
				vector: embeddings[index],
				content: chunk.content,
				metadata: chunk.metadata
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
		knowledgeBaseId: string,
		query: string,
		limit: number = 5
	) {
		const knowledgeBase = await this.prisma.knowledgeBase.findUnique({
			where: { id: knowledgeBaseId }
		});
		
		// Generate embedding for search query
		const queryEmbedding = await jinaEmbedder.embedText(query);
		
		return await milvusDbClient.similaritySearch(
			knowledgeBase.vectorCollection,
			queryEmbedding,
			limit
		);
	}

	async deleteKnowledgeBase(knowledgeBaseId: string): Promise<void> {
		const knowledgeBase = await this.prisma.knowledgeBase.findUnique({
			where: { id: knowledgeBaseId }
		});
		
		await milvusDbClient.deleteCollection(knowledgeBase.vectorCollection);
		await this.prisma.knowledgeBase.delete({
			where: { id: knowledgeBaseId }
		});
	}
}

export const knowledgeBaseService = new KnowledgeBaseService();