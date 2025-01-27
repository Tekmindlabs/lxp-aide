import { connect, Table } from '@lancedb/lancedb';
import path from 'path';

interface SearchResult {
  _distance?: number;
  vector?: number[];
  [key: string]: any;
}

interface SimilaritySearchResult {
  contextTexts: string[];
  sourceDocuments: Array<{
    score: number;
    [key: string]: any;
  }>;
}

export class LanceDbClient {
  private uri: string;

  constructor() {
    // Use absolute path for storage
    const baseDir = process.cwd();
    const storageDir = process.env.STORAGE_DIR || './storage';
    this.uri = path.resolve(baseDir, storageDir, 'lancedb');
  }

  async connect() {
    try {
      if (process.env.VECTOR_DB !== "lancedb") {
        throw new Error("LanceDB::Invalid ENV settings");
      }
      // Ensure directory exists
      return await connect(this.uri);
    } catch (error) {
      console.error('Failed to connect to LanceDB:', error);
      throw error;
    }
  }

  distanceToSimilarity(distance: number | null = null): number {
    if (distance === null || typeof distance !== "number") return 0.0;
    if (distance >= 1.0) return 1;
    if (distance < 0) return 1 - Math.abs(distance);
    return 1 - distance;
  }

  async createOrGetCollection(name: string, data: Record<string, any>[] = []): Promise<Table> {
    const db = await this.connect();
    try {
      let table: Table;
      try {
        table = await db.openTable(name);
        if (data.length > 0) {
          await table.add(data);
        }
      } catch {
        table = await db.createTable(name, data);
      }
      return table;
    } catch (error) {
      console.error('Error in createOrGetCollection:', error);
      throw error;
    }
  }

  async similaritySearch(
    collectionName: string,
    queryEmbedding: number[],
    limit: number = 4,
    similarityThreshold: number = 0.25
  ): Promise<SimilaritySearchResult> {
    const collection = await this.createOrGetCollection(collectionName);
    const results = await collection
      .search(queryEmbedding)
      .distanceType('cosine')
      .limit(limit)
      .execute();

    return {
      contextTexts: [],
      sourceDocuments: results
        .filter((item: SearchResult) => 
          this.distanceToSimilarity(item._distance) >= similarityThreshold
        )
        .map((item: SearchResult) => {
          const { vector, _distance, ...metadata } = item;
          return {
            ...metadata,
            score: this.distanceToSimilarity(_distance),
          };
        }),
    };
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

  // Additional utility methods
  async createIndex(collectionName: string, columnName: string = 'vector'): Promise<void> {
    const collection = await this.createOrGetCollection(collectionName);
    await collection.createIndex(columnName);
  }

  async addDocuments(
    collectionName: string, 
    documents: Record<string, any>[]
  ): Promise<void> {
    const collection = await this.createOrGetCollection(collectionName);
    await collection.add(documents);
  }
}

export const lanceDbClient = new LanceDbClient();