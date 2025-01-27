import { getMilvusClient } from './client';
import { createCollection, deleteCollection } from './collections';
import { insertVector, searchSimilarContent } from './vectors';

async function testMilvusConnection() {
  try {
    console.log('Testing Milvus connection...');
    
    // Test basic connectivity
    const client = await getMilvusClient();
    console.log('✓ Connected to Milvus successfully');

    // Test collection operations
    const testCollection = 'test_collection';
    await createCollection(testCollection);
    console.log('✓ Created test collection');

    // Test vector operations
    const testVector = Array(1536).fill(0.1);
    const vectorResult = await insertVector(
      'test-user',
      'test-content',
      'test-id',
      testVector,
      { test: 'metadata' }
    );
    console.log('✓ Inserted test vector:', vectorResult.id);

    // Test search
    const searchResults = await searchSimilarContent(
      'test-user',
      testVector,
      1
    );
    console.log('✓ Search results:', searchResults);

    // Cleanup
    await deleteCollection(testCollection);
    console.log('✓ Cleaned up test collection');

    console.log('\nAll tests completed successfully! ✨');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testMilvusConnection();