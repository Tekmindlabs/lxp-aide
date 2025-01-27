import { MilvusClient } from '@zilliz/milvus2-sdk-node';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../../../.env') });

class MilvusDbClient {
	constructor() {
		console.log('Initializing MilvusDbClient...');
		
		if (!process.env.MILVUS_ADDRESS || !process.env.MILVUS_TOKEN) {
			throw new Error("Milvus connection details not provided");
		}

		// Remove https:// if present in the address
		const address = process.env.MILVUS_ADDRESS.replace(/^https?:\/\//, '');
		console.log('Using Milvus address:', address);

		this.client = new MilvusClient({
			address,
			username: 'root', // Default username for cloud
			password: process.env.MILVUS_TOKEN,
			ssl: true,
			secure: true
		});
		this.dimension = 1536;
		console.log('MilvusDbClient initialized successfully');
	}

	async createOrGetCollection(name) {
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
			}
			
			return name;
		} catch (error) {
			console.error('Error in createOrGetCollection:', error);
			throw error;
		}
	}

	async similaritySearch(collectionName, queryEmbedding, limit = 4, similarityThreshold = 0.25) {
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
				.filter(item => item.score >= similarityThreshold)
				.map(item => ({
					...JSON.parse(item.metadata),
					score: item.score
				}))
		};
	}

	async deleteCollection(name) {
		await this.client.dropCollection({ collection_name: name });
	}

	async addDocuments(collectionName, documents) {
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