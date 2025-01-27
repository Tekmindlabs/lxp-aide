import { nanoid } from 'nanoid';
import { prisma } from '@/server/db';
import { milvusDbClient } from '../vectorDb/milvus';
import { Document, Folder, KnowledgeBase } from './types';
import { jinaEmbedder } from './embedding-service';
import { DocumentProcessor } from './document-processor';
import { Prisma } from '@prisma/client';

export class KnowledgeBaseService {
  private readonly prisma;

  constructor() {
    this.prisma = prisma;
  }

  async createKnowledgeBase(data: { name: string; description?: string }): Promise<KnowledgeBase> {
    try {
      const id = nanoid();
      const collectionName = `kb_${id}_vectors`;
      
      await milvusDbClient.createOrGetCollection(collectionName);

      const knowledgeBase = await this.prisma.knowledgeBase.create({
        data: {
          id,
          name: data.name,
          description: data.description || '',
          vectorCollection: collectionName
        }
      });

      return {
        id: knowledgeBase.id,
        name: knowledgeBase.name,
        description: knowledgeBase.description || '',
        vectorCollection: collectionName,
        createdAt: knowledgeBase.createdAt,
        updatedAt: knowledgeBase.updatedAt
      };
	} catch (error) {
	  if (error instanceof Error) {
		throw new Error(`Failed to create knowledge base: ${error.message}`);
	  }
	  throw new Error('Failed to create knowledge base: Unknown error');
	}
  }

  async getWorkspace(workspaceId: string) {
    try {
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
          knowledgeBases: true,
          permissions: true
        }
      });

      if (!workspace) {
        throw new Error(`Workspace not found: ${workspaceId}`);
      }

      return {
        id: workspace.id,
        name: workspace.name,
        description: workspace.description || '',
        knowledgeBases: workspace.knowledgeBases,
        permissions: workspace.permissions
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get workspace: ${error.message}`);
      }
      throw new Error('Failed to get workspace: Unknown error');
    }
  }

  async getFolders(knowledgeBaseId: string): Promise<Folder[]> {
    try {
      // First verify the knowledge base exists
      const knowledgeBase = await this.prisma.knowledgeBase.findUnique({
        where: { id: knowledgeBaseId }
      });

      if (!knowledgeBase) {
        throw new Error(`Knowledge base not found: ${knowledgeBaseId}`);
      }

      const folders = await this.prisma.documentFolder.findMany({
        where: { 
          knowledgeBaseId,
          // Only get root level folders (those without parent)
          parentFolderId: null
        },
        include: {
          subFolders: {
            include: {
              subFolders: true // Include nested subfolders
            }
          }
        }
      });

      return folders.map(folder => ({
        id: folder.id,
        name: folder.name,
        description: folder.description || '',
        knowledgeBaseId: folder.knowledgeBaseId,
        children: folder.subFolders,
        metadata: folder.metadata ? (folder.metadata as Record<string, any>) : {},
        parentFolderId: folder.parentFolderId ?? undefined
      }));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get folders: ${error.message}`);
      }
      throw new Error('Failed to get folders: Unknown error');
    }
  }

  async createFolder(folder: Omit<Folder, 'id' | 'children'>): Promise<Folder> {
    try {
      const newFolder = await this.prisma.documentFolder.create({
        data: {
          id: nanoid(),
          name: folder.name,
          description: folder.description,
          knowledgeBaseId: folder.knowledgeBaseId,
          parentFolderId: folder.parentFolderId,
            metadata: folder.metadata || Prisma.JsonNull
        },
        include: {
          subFolders: true
        }
      });

      return {
        ...newFolder,
        description: newFolder.description || '',
        children: newFolder.subFolders,
        metadata: newFolder.metadata ? (newFolder.metadata as Record<string, any>) : {}
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create folder: ${error.message}`);
      }
      throw new Error('Failed to create folder: Unknown error');
    }
  }

  async updateDocument(
    documentId: string,
    data: Partial<Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'embeddings'>>
  ): Promise<Document> {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
        include: {
          knowledgeBase: {
            select: {
              id: true,
          vectorCollection: true
            }
          }
        }
      });

      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      let embeddings = document.embeddings;

      if (data.content) {
        const processedChunks = DocumentProcessor.processDocument(data.content, {
          documentId,
          title: data.title || document.title,
          type: data.type || document.type,
          knowledgeBaseId: document.knowledgeBaseId,
          ...data.metadata
        });

        const newEmbeddings = await jinaEmbedder.embedChunks(
          processedChunks.map(chunk => chunk.content)
        );

        embeddings = newEmbeddings.flat();

        await milvusDbClient.addDocuments(
          document.knowledgeBase.vectorCollection,
          processedChunks.map((chunk, index) => ({
            vector: newEmbeddings[index],
            content: chunk.content,
            metadata: chunk.metadata
          }))
        );
      }

      const updatedDocument = await this.prisma.document.update({
        where: { id: documentId },
        data: {
          ...data,
          embeddings,
          metadata: data.metadata || undefined,
          updatedAt: new Date()
        }
      });

      return {
        ...updatedDocument,
        metadata: updatedDocument.metadata as Record<string, any> || {}
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update document: ${error.message}`);
      }
      throw new Error('Failed to update document: Unknown error');
    }
  }

  async addDocument(
    document: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'embeddings'>,
    knowledgeBaseId: string
  ): Promise<Document> {
    try {
      // Validate input
      if (!document.content || !document.title || !document.type) {
        throw new Error('Document must have content, title, and type');
      }

      const knowledgeBase = await this.prisma.knowledgeBase.findUnique({
        where: { id: knowledgeBaseId }
      });

      if (!knowledgeBase) {
        throw new Error(`Knowledge base not found: ${knowledgeBaseId}`);
      }

      const documentId = nanoid();
      const processedChunks = DocumentProcessor.processDocument(document.content, {
        documentId,
        title: document.title,
        type: document.type,
        knowledgeBaseId,
        ...document.metadata
      });

      const embeddings = await jinaEmbedder.embedChunks(
        processedChunks.map(chunk => chunk.content)
      );

      // Store document with flattened embeddings
      const flattenedEmbeddings = embeddings.flat();

      // First create the document in the database
      const newDocument = await this.prisma.document.create({
        data: {
          id: documentId,
          ...document,
          knowledgeBaseId,
          embeddings: flattenedEmbeddings,
          metadata: document.metadata || Prisma.JsonNull,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Then store the document chunks in the vector database
      await milvusDbClient.addDocuments(
        knowledgeBase.vectorCollection,
        processedChunks.map((chunk, index) => ({
          vector: embeddings[index],
          content: chunk.content,
          metadata: {
            ...chunk.metadata,
            documentId: newDocument.id
          }
        }))
      );

      return {
        ...newDocument,
        metadata: newDocument.metadata as Record<string, any>
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to add document: ${error.message}`);
      }
      throw new Error('Failed to add document: Unknown error');
    }
  }

  async getDocument(documentId: string): Promise<Document | null> {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
        include: {
          folder: true,
          workspaces: {
            include: {
              permissions: true
            }
          }
        }
      });

      if (!document) {
        return null;
      }

      return {
        ...document,
        metadata: document.metadata as Record<string, any>
      };
    } catch (error) {
        if (error instanceof Error) {
        throw new Error(`Failed to get document: ${error.message}`);
        }
        throw new Error('Failed to get document: Unknown error');
    }
  }

  async searchDocuments(knowledgeBaseId: string, query: string, limit: number = 5): Promise<Document[]> {
    try {
      const knowledgeBase = await this.prisma.knowledgeBase.findUnique({
        where: { id: knowledgeBaseId },
        select: {
          id: true,
          vectorCollection: true
        }
      });

      if (!knowledgeBase) {
        throw new Error(`Knowledge base not found: ${knowledgeBaseId}`);
      }

      const queryEmbedding = await jinaEmbedder.embedText(query);
      
      const results = await milvusDbClient.similaritySearch(
        knowledgeBase.vectorCollection,
        queryEmbedding,
        limit
      );

      const documents = await this.prisma.document.findMany({
        where: {
          id: {
            in: results.sourceDocuments.map(doc => doc.id)
          }
        }
      });

        return documents.map(doc => ({
        ...doc,
        metadata: doc.metadata as Record<string, any> || {}
        }));

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to search documents: ${error.message}`);
      }
      throw new Error('Failed to search documents: Unknown error');
    }
  }

  async deleteKnowledgeBase(knowledgeBaseId: string): Promise<void> {
    try {
      const knowledgeBase = await this.prisma.knowledgeBase.findUnique({
        where: { id: knowledgeBaseId },
        select: {
          id: true,
          vectorCollection: true
        }
      });

      if (!knowledgeBase) {
        throw new Error(`Knowledge base not found: ${knowledgeBaseId}`);
      }

      await this.prisma.$transaction(async (tx) => {
      await milvusDbClient.deleteCollection(knowledgeBase.vectorCollection);
        await tx.knowledgeBase.delete({
          where: { id: knowledgeBaseId }
        });
      });

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete knowledge base: ${error.message}`);
      }
      throw new Error('Failed to delete knowledge base: Unknown error');
    }
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
