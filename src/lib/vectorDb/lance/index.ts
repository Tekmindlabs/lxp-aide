import { connect } from '@lancedb/lancedb';
import { CreateTableOptions } from '@lancedb/lancedb';

// Add interfaces for type safety
export interface SearchResult {
  score: number;
  content: string;
  documentId: string;
  metadata: Record<string, unknown>;
}

export interface DocumentMetadata {
  content: string;
  documentId: string;
  metadata: Record<string, unknown>;
}

export class LanceDbClient {
  private uri: string;
  
  constructor() {
    this.uri = `${process.env.STORAGE_DIR ? `${process.env.STORAGE_DIR}/` : "./storage/"}lancedb`;
  }

  async connect() {
    try {
      return await connect(this.uri);
    } catch (error) {
      console.error('Failed to connect to LanceDB:', error);
      throw error;
    }
  }

  async createOrGetCollection(name: string, schema?: Partial<CreateTableOptions>) {
    const db = await this.connect();
    try {
      const existingTable = await db.openTable(name);
      return existingTable;
    } catch {
      return await db.createTable(name, [], schema);
    }
  }

  async addDocumentEmbeddings(
    collectionName: string,
    embeddings: number[][],
    metadata: DocumentMetadata[]
  ) {
    const collection = await this.createOrGetCollection(collectionName);
    const data = embeddings.map((embedding, index) => ({
      vector: embedding,
      ...metadata[index]
    }));
    await collection.add(data);
  }

  async similaritySearch(
    collectionName: string,
    queryEmbedding: number[],
    limit: number = 5
  ): Promise<SearchResult[]> {
    const collection = await this.createOrGetCollection(collectionName);
    
    // Create search query and execute
    const searchQuery = collection.search(queryEmbedding).limit(limit);
    const results = await searchQuery.execute();
    
    const searchResults: SearchResult[] = [];
    for await (const batch of results) {
      for (const row of batch) {
        searchResults.push({
          score: row.score,
          content: row.content,
          documentId: row.documentId,
          metadata: row.metadata
        });
      }
    }
  
    return searchResults;
  }

  async deleteCollection(name: string): Promise<void> {
    const db = await this.connect();
    try {
      await db.dropTable(name);
    } catch (error) {
      console.error(`Failed to delete collection ${name}:`, error);
      throw error;
    }
  }
}

export const lanceDbClient = new LanceDbClient();