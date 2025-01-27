import { MilvusClient } from '@zilliz/milvus2-sdk-node';

interface SearchResult {
	score: number;
	[key: string]: any;
}

interface SimilaritySearchResult {
	contextTexts: string[];
	sourceDocuments: Array<{
		score: number;
		[key: string]: any;
	}>;
}

export class MilvusDbClient {
	private client: MilvusClient;
	private dimension: number = 1536; // Default OpenAI embedding dimension

	constructor() {
		if (!process.env.MILVUS_ADDRESS || !process.env.MILVUS_TOKEN) {
			throw new Error("Milvus connection details not provided");
		}

		this.client = new MilvusClient({
			address: process.env.MILVUS_ADDRESS,
			token: process.env.MILVUS_TOKEN
		});
	}

	async createOrGetCollection(name: string, data: Record<string, any>[] = []) {
		try {
			const exists = await this.client.hasCollection({ collection_name: name });
			
			if (!exists) {
				await this.client.createCollection({
					collection_name: name,
					dimension: this.dimension,
					fields: [
						{ name: 'id', data_type: 'Int64', is_primary_key: true, auto_id: true },
						{ name: 'vector', data_type: 'FloatVector', dim: this.dimension },
						{ name: 'metadata', data_type: 'JSON' }
					]
				});
				
				if (data.length > 0) {
					await this.addDocuments(name, data);
				}
			}
			
			return name;
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
		await this.client.loadCollectionSync({ collection_name: collectionName });

		const searchResults = await this.client.search({
			collection_name: collectionName,
			vector: queryEmbedding,
			limit,
			output_fields: ['metadata'],
			params: { nprobe: 10 }
		});

		return {
			contextTexts: [],
			sourceDocuments: searchResults.results
				.filter((item: SearchResult) => item.score >= similarityThreshold)
				.map((item: SearchResult) => ({
					...JSON.parse(item.metadata),
					score: item.score
				}))
		};
	}

	async deleteCollection(name: string): Promise<void> {
		await this.client.dropCollection({ collection_name: name });
	}

	async addDocuments(
		collectionName: string, 
		documents: Record<string, any>[]
	): Promise<void> {
		const vectors = documents.map(doc => doc.vector);
		const metadata = documents.map(doc => {
			const { vector, ...rest } = doc;
			return JSON.stringify(rest);
		});

		await this.client.insert({
			collection_name: collectionName,
			data: {
				vector: vectors,
				metadata: metadata
			}
		});
	}
}

export const milvusDbClient = new MilvusDbClient();
