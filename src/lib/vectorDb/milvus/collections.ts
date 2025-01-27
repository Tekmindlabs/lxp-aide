import { getMilvusClient } from './client.js';
import { handleMilvusError } from './error-handler.js';

export async function createCollection(name: string, dimension: number = 1536) {
  try {
    const client = await getMilvusClient();
    
    const exists = await client.hasCollection({ collection_name: name });
    if (exists) {
      console.log(`Collection ${name} already exists`);
      return;
    }

    await client.createCollection({
      collection_name: name,
      fields: [
        {
          name: 'id',
          data_type: 'VarChar',
          is_primary_key: true,
          max_length: 36
        },
        {
          name: 'user_id',
          data_type: 'VarChar',
          max_length: 36
        },
        {
          name: 'content_type',
          data_type: 'VarChar',
          max_length: 50
        },
        {
          name: 'content_id',
          data_type: 'VarChar',
          max_length: 36
        },
        {
          name: 'vector',
          data_type: 'FloatVector',
          dim: dimension
        },
        {
          name: 'metadata',
          data_type: 'JSON'
        }
      ]
    });

    console.log(`Collection ${name} created successfully`);
  } catch (error) {
    handleMilvusError(error, 'collection creation');
  }
}

export async function deleteCollection(name: string) {
  try {
    const client = await getMilvusClient();
    await client.dropCollection({ collection_name: name });
    console.log(`Collection ${name} deleted successfully`);
  } catch (error) {
    handleMilvusError(error, 'collection deletion');
  }
}