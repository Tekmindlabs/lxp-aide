import { getMilvusClient } from './client';
import { handleMilvusError } from './error-handler';
import { v4 as uuidv4 } from 'uuid';

export interface VectorResult {
  id: string;
  score?: number;
  metadata: Record<string, any>;
}

export async function insertVector(
  userId: string,
  contentType: string,
  contentId: string,
  embedding: number[],
  metadata: Record<string, any> = {}
): Promise<VectorResult> {
  try {
    console.log(`Inserting vector for user ${userId}, content ${contentId}`);
    
    const client = await getMilvusClient();
    await client.loadCollectionSync({ collection_name: 'content_vectors' });

    const vectorId = uuidv4();
    const data = [{  // Changed to array of objects
      id: vectorId,
      user_id: userId,
      content_type: contentType,
      content_id: contentId,
      vector: embedding,
      metadata: JSON.stringify({
        ...metadata,
        timestamp: new Date().toISOString()
      })
    }];

    await client.insert({
      collection_name: 'content_vectors',
      data
    });

    return {
      id: vectorId,
      metadata: {
        userId,
        contentType,
        contentId,
        ...metadata
      }
    };
  } catch (error) {
    handleMilvusError(error, 'vector insertion');
    // Add explicit return for error case
    throw error; // This ensures the function always returns or throws
  }
}

export async function searchSimilarContent(
  userId: string,
  embedding: number[],
  limit: number = 5,
  contentTypes: string[] = []
): Promise<{ data: VectorResult[]; timestamp: string }> {
  try {
    const client = await getMilvusClient();
    await client.loadCollectionSync({ collection_name: 'content_vectors' });

    const searchParams = {
      collection_name: 'content_vectors',
      vector: embedding,
      limit,
      output_fields: ['metadata', 'content_type', 'content_id'],
      params: { nprobe: 10 }
    };

    const results = await client.search(searchParams);

    if (!results?.results?.length) {
      return { data: [], timestamp: new Date().toISOString() };
    }

    return {
      data: results.results.map(result => ({
        id: result.id,
        score: result.score,
        metadata: JSON.parse(result.metadata)
      })),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    handleMilvusError(error, 'similarity search');
    // Add explicit return for error case
    throw error; // This ensures the function always returns or throws
  }
}