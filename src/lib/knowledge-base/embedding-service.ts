export class JinaEmbeddingService {
	private readonly apiKey: string;
	private readonly baseUrl: string;
	private readonly modelName: string;
	private readonly batchSize: number = 32;

	constructor() {
		this.apiKey = process.env.JINA_API_KEY || '';
		this.baseUrl = process.env.JINA_BASE_URL || 'https://api.jina.ai/v1';
		this.modelName = process.env.JINA_MODEL_NAME || 'jina-embedding-v2';

		if (!this.apiKey) {
			throw new Error('JINA_API_KEY is required');
		}
	}

	private async embedBatch(texts: string[]): Promise<number[][]> {
		const response = await fetch(`${this.baseUrl}/embeddings`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: this.modelName,
				input: texts
			})
		});

		if (!response.ok) {
			throw new Error(`Embedding request failed: ${response.statusText}`);
		}

		const data = await response.json();
		return data.data.map((item: any) => item.embedding);
	}

	async embedText(text: string): Promise<number[]> {
		const embeddings = await this.embedBatch([text]);
		return embeddings[0];
	}

	async embedChunks(chunks: string[]): Promise<number[][]> {
		const embeddings: number[][] = [];
		
		// Process chunks in batches
		for (let i = 0; i < chunks.length; i += this.batchSize) {
			const batch = chunks.slice(i, i + this.batchSize);
			const batchEmbeddings = await this.embedBatch(batch);
			embeddings.push(...batchEmbeddings);
		}

		return embeddings;
	}
}

export const jinaEmbedder = new JinaEmbeddingService();