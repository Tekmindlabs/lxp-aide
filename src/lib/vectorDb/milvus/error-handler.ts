export const handleMilvusError = (error: any, operation: string) => {
    console.error(`Milvus error during ${operation}:`, error);
    
    if (error.code === 14) {
      throw new Error(`Connection error: ${error.details}`);
    }
    
    throw error;
  };