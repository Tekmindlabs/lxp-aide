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
      const vectorCollection = `kb_${id}_vectors`;
      
      await milvusDbClient.createOrGetCollection(vectorCollection);

      const knowledgeBase = await this.prisma.knowledgeBase.create({
        data: {
          id,
          name: data.name,
          description: data.description,
          vector_collection: vectorCollection
        }
      });

      return {
        ...knowledgeBase,
        vectorCollection: knowledgeBase.vector_collection
      };

      } catch (error) {
        if (error instanceof Error) {
        throw new Error(`Failed to create knowledge base: ${error.message}`);
        }
        throw new Error('Failed to create knowledge base: Unknown error');
    }
  }

  async getFolders(knowledgeBaseId: string): Promise<Folder[]> {
    try {
      const folders = await this.prisma.documentFolder.findMany({
        where: { knowledgeBaseId },
        include: {
          subFolders: true
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
          metadata: data.metadata || document.metadata,
          updatedAt: new Date()
        }
      });

      return {
        ...updatedDocument,
        metadata: (updatedDocument.metadata as Record<string, any>) || {}
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
      const knowledgeBase = await this.prisma.knowledgeBase.findUnique({
        where: { id: knowledgeBaseId }
      });

      if (!knowledgeBase) {
        throw new Error(`Knowledge base not found: ${knowledgeBaseId}`);
      }

      const processedChunks = DocumentProcessor.processDocument(document.content, {
        documentId: nanoid(),
        title: document.title,
        type: document.type,
        ...document.metadata
      });

      const embeddings = await jinaEmbedder.embedChunks(
        processedChunks.map(chunk => chunk.content)
      );

      // Store document with flattened embeddings
      const flattenedEmbeddings = embeddings.flat();

      await milvusDbClient.addDocuments(
        knowledgeBase.vector_collection,
        processedChunks.map((chunk, index) => ({
          vector: embeddings[index],
          content: chunk.content,
          metadata: chunk.metadata
        }))
      );

        const newDocument = await this.prisma.document.create({
        data: {
          id: nanoid(),
          ...document,
          knowledgeBaseId,
          embeddings: flattenedEmbeddings,
            metadata: document.metadata || Prisma.JsonNull,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        });

        await milvusDbClient.addDocuments(
        knowledgeBase.vectorCollection,
        processedChunks.map((chunk, index) => ({
          vector: embeddings[index],
          content: chunk.content,
          metadata: chunk.metadata
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
      throw new Error(`Failed to get document: ${error.message}`);
    }
  }

  async searchDocuments(
    knowledgeBaseId: string,
    query: string,
    limit: number = 5
  ): Promise<Document[]> {
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
        metadata: doc.metadata ? (doc.metadata as Record<string, any>) : {}
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