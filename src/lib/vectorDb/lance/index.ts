import { connect } from '@lancedb/lancedb';

export class LanceDbClient {
  private uri: string;

  constructor() {
    this.uri = `${process.env.STORAGE_DIR ? `${process.env.STORAGE_DIR}/` : "./storage/"}lancedb`;
  }

  async connect() {
    try {
      if (process.env.VECTOR_DB !== "lancedb") {
        throw new Error("LanceDB::Invalid ENV settings");
      }
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

  async createOrGetCollection(name: string, data: any[] = []) {
    const db = await this.connect();
    try {
      const existingTable = await db.openTable(name);
      if (data.length > 0) {
        await existingTable.add(data);
      }
      return existingTable;
    } catch {
      return await db.createTable(name, data);
    }
  }

  async similaritySearch(
    collectionName: string,
    queryEmbedding: number[],
    limit: number = 4,
    similarityThreshold: number = 0.25
  ) {
    const collection = await this.createOrGetCollection(collectionName);
    const results = await collection
      .vectorSearch(queryEmbedding)
      .distanceType('cosine')
      .limit(limit)
      .toArray();

    return {
      contextTexts: [],
      sourceDocuments: results
        .filter((item) => this.distanceToSimilarity(item._distance) >= similarityThreshold)
        .map((item) => {
          const { vector: _, ...metadata } = item;
          return {
            ...metadata,
            score: this.distanceToSimilarity(item._distance),
          };
        }),
    };
  }

  async deleteCollection(name: string) {
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

