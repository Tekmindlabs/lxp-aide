import { milvusDbClient } from './index';

async function testMilvusConnection() {
	try {
		console.log('Testing Milvus connection...');
		
		// Test collection creation
		const testCollection = 'test_collection';
		await milvusDbClient.createOrGetCollection(testCollection);
		console.log('✓ Successfully created test collection');
		
		// Test vector insertion
		const testVector = Array(1536).fill(0.1);
		await milvusDbClient.addDocuments(testCollection, [{
			vector: testVector,
			metadata: { test: 'data' }
		}]);
		console.log('✓ Successfully inserted test vector');
		
		// Test search
		const searchResults = await milvusDbClient.similaritySearch(
			testCollection,
			testVector,
			1
		);
		console.log('✓ Successfully performed similarity search');
		
		// Cleanup
		await milvusDbClient.deleteCollection(testCollection);
		console.log('✓ Successfully cleaned up test collection');
		
		console.log('\nMilvus connection test completed successfully! ✨');
	} catch (error) {
		console.error('❌ Milvus connection test failed:', error);
		process.exit(1);
	}
}

testMilvusConnection();