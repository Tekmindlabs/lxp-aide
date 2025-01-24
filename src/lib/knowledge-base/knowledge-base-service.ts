import { lanceDbClient } from '../vectorDb/lance';
import { Document, Folder, Workspace } from './types';
import { nanoid } from 'nanoid';
import { jinaEmbedder } from './embedding-service';
import { DocumentProcessor } from './document-processor';
import { prisma } from '@/server/db';

export class KnowledgeBaseService {
	private readonly vectorDimension = 768; // Jina embedding dimension
	private readonly prisma;

	constructor() {
    this.prisma = prisma;
}

async getFolders(knowledgeBaseId: string): Promise<Folder[]> {

    try {
      const folders = await this.prisma.folder.findMany({
        where: {
          workspaceId: knowledgeBaseId
        },
        include: {
          children: true,
          documents: true
        }
      });


      return folders.map(folder => ({
        id: folder.id,
        name: folder.name,
        description: folder.description || '',
        parentFolderId: folder.parentId || undefined,
        children: folder.children,
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