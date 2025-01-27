
class TensorConversionError extends Error {
	constructor(message: string) {
	  super(message);
	  this.name = 'TensorConversionError';
	}
  }
  
  class ModelLoadError extends Error {
	constructor(message: string) {
	  super(message);
	  this.name = 'ModelLoadError';
	}
  }
  
  export class JinaEmbeddingService {
	private readonly apiKey: string;
	private readonly baseUrl: string;
	private readonly modelName: string;
	private readonly batchSize: number = 32;
	private static instance: JinaEmbeddingService | null = null;
  
	constructor() {
	  this.apiKey = process.env.JINA_API_KEY || '';
	  this.baseUrl = process.env.JINA_BASE_URL || 'https://api.jina.ai/v1';
	  this.modelName = process.env.JINA_MODEL_NAME || 'jina-embedding-v2';
  
	  if (!this.apiKey) {
		throw new ModelLoadError('JINA_API_KEY is required');
	  }
	}
  
	// Singleton pattern from AI Tutor
	public static getInstance(): JinaEmbeddingService {
	  if (!this.instance) {
		this.instance = new JinaEmbeddingService();
	  }
	  return this.instance;
	}
  
	private validateEmbeddingDimension(embedding: number[]) {
		const expectedDimension = parseInt(process.env.VECTOR_DIMENSION || '1024');
		if (embedding.length !== expectedDimension) {
		  throw new Error(`Invalid embedding dimension. Expected ${expectedDimension}, got ${embedding.length}`);
		}
	  }
	  
	private async embedBatch(texts: string[]): Promise<number[][]> {
	  if (!texts || texts.length === 0) {
		throw new Error('Invalid input: texts array must not be empty');
	  }
  
	  // Process and validate texts
	  const processedTexts = texts.map(text => {
		if (typeof text !== 'string' || !text.trim()) {
		  throw new Error('Invalid input: all texts must be non-empty strings');
		}
		return text.trim();
	  });
  
	  try {
		const response = await fetch(`${this.baseUrl}/embeddings`, {
		  method: 'POST',
		  headers: {
			'Authorization': `Bearer ${this.apiKey}`,
			'Content-Type': 'application/json'
		  },
		  body: JSON.stringify({
			model: this.modelName,
			input: processedTexts
		  })
		});
  
		if (!response.ok) {
		  throw new Error(`Embedding request failed: ${response.statusText}`);
		}
  
		const data = await response.json();
		const embeddings = data.data.map((item: any) => item.embedding);
  
		// Validate embeddings
		for (const embedding of embeddings) {
		  if (!embedding || embedding.length === 0) {
			throw new TensorConversionError('Empty embedding generated');
		  }
		}
  
		return embeddings;
	  } catch (error) {
		console.error('Error generating embeddings:', error);
		throw error instanceof Error ? error : new Error('Unknown error during embedding generation');
	  }
	}
  
	async embedText(text: string): Promise<number[]> {
	  if (!text || typeof text !== 'string') {
		throw new Error('Invalid input: text must be a non-empty string');
	  }
  
	  try {
		const embeddings = await this.embedBatch([text]);
		return embeddings[0];
	  } catch (error) {
		console.error('Error embedding single text:', error);
		throw error;
	  }
	}
  
	async embedChunks(chunks: string[]): Promise<number[][]> {
	  if (!chunks || chunks.length === 0) {
		throw new Error('Invalid input: chunks array must not be empty');
	  }
  
	  const embeddings: number[][] = [];
	  
	  try {
		// Process chunks in batches
		for (let i = 0; i < chunks.length; i += this.batchSize) {
		  const batch = chunks.slice(i, i + this.batchSize);
		  const batchEmbeddings = await this.embedBatch(batch);
		  embeddings.push(...batchEmbeddings);
		}
  
		return embeddings;
	  } catch (error) {
		console.error('Error embedding chunks:', error);
		throw error;
	  }
	}
  
	// Method to clear instance (useful for testing)
	public static clearInstance(): void {
	  this.instance = null;
	}
  }
  
  // Export singleton instance
  export const jinaEmbedder = JinaEmbeddingService.getInstance();