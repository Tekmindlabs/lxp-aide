import { getMilvusClient } from './client.js';
import { createCollection, deleteCollection } from './collections.js';
import { insertVector, searchSimilarContent } from './vectors.js';
import dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../../../.env') });

interface MilvusError {
  code?: number;
  details?: string;
  message?: string;
}

async function testMilvusConnection() {
  if (!process.env.MILVUS_ADDRESS || !process.env.MILVUS_TOKEN) {
    console.error('Missing required environment variables: MILVUS_ADDRESS and/or MILVUS_TOKEN');
    process.exit(1);
  }

  try {
    console.log('Testing Milvus connection...');
    console.log('Environment:', {
      address: process.env.MILVUS_ADDRESS,
      tokenLength: process.env.MILVUS_TOKEN?.length
    });
    
    // Test basic connectivity
    const client = await getMilvusClient();
    
    // Try a simple operation first
    const collections = await client.listCollections();
    console.log('Successfully connected! Available collections:', collections);

  } catch (error) {
    const milvusError = error as MilvusError;
    console.error('Connection test failed:', {
      code: milvusError.code,
      details: milvusError.details,
      message: milvusError.message
    });
    
    if (milvusError.code === 14) {
      console.log('DNS resolution failed. Please check:');
      console.log('1. Your internet connection');
      console.log('2. VPN settings (if any)');
      console.log('3. Firewall rules');
      console.log('4. DNS settings');
    }
    
    process.exit(1);
  }
}

// Add proper promise handling
testMilvusConnection().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});