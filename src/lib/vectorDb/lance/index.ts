import lancedb from '@lancedb/lancedb';

export class LanceDbClient {
	private uri: string;
	
	constructor() {
		this.uri = `${process.env.STORAGE_DIR ? `${process.env.STORAGE_DIR}/` : "./storage/"}lancedb`;
	}

	async connect() {
		try {
			return await lancedb.connect(this.uri);
		} catch (error) {
			console.error('Failed to connect to LanceDB:', error);
			throw error;
		}
	}

	async createOrGetCollection(name: string, schema?: any) {
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
		metadata: any[]
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
	) {
		const collection = await this.createOrGetCollection(collectionName);
		const results = await collection.search(queryEmbedding).limit(limit).execute();
		return results.map(result => ({
			score: result.score,
			content: result.content,
			documentId: result.documentId,
			metadata: result.metadata
		}));
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