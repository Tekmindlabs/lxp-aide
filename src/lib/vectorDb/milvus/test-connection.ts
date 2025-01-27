import { getMilvusClient } from './client';
import { createCollection, deleteCollection } from './collections';
import { insertVector, searchSimilarContent } from './vectors';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../../../.env') });

interface MilvusError {
  code?: number;
  details?: string;
  message?: string;
}

async function testMilvusConnection() {
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

testMilvusConnection();