import { MilvusClient, ClientConfig } from '@zilliz/milvus2-sdk-node';

class MilvusConnection {
  private static instance: MilvusClient;

  private constructor() {}

  public static async getInstance(): Promise<MilvusClient> {
    try {
      if (!MilvusConnection.instance) {
        if (!process.env.MILVUS_ADDRESS || !process.env.MILVUS_TOKEN) {
          throw new Error('Milvus configuration missing');
        }

        const address = process.env.MILVUS_ADDRESS
          .replace(/^https?:\/\//, '')
          .trim();

        console.log('Connecting to Milvus at:', address);

        const config: ClientConfig = {
          address,
          token: process.env.MILVUS_TOKEN,
          ssl: true,
          tls: {
            skipCertCheck: true
          }
        };

        MilvusConnection.instance = new MilvusClient(config);
        
        // Test the connection
        await MilvusConnection.instance.checkHealth();
      }
      return MilvusConnection.instance;
    } catch (error) {
      console.error('Failed to initialize Milvus client:', error);
      throw error;
    }
  }
}

export const getMilvusClient = () => MilvusConnection.getInstance();