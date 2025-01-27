import { MilvusClient } from '@zilliz/milvus2-sdk-node';

class MilvusConnection {
  private static instance: MilvusClient;

  private constructor() {}

  public static async getInstance(): Promise<MilvusClient> {
    if (!MilvusConnection.instance) {
      if (!process.env.MILVUS_ADDRESS || !process.env.MILVUS_TOKEN) {
        throw new Error('Milvus configuration missing');
      }

      const address = process.env.MILVUS_ADDRESS
        .replace(/^https?:\/\//, '')
        .trim();

      console.log('Connecting to Milvus at:', address);

      const config = {
        address,
        token: process.env.MILVUS_TOKEN,
        ssl: true,
        tls: {
          rejectUnauthorized: false
        }
      };

      MilvusConnection.instance = new MilvusClient(config);
    }
    return MilvusConnection.instance;
  }
}

// Make sure this export is present
export const getMilvusClient = () => MilvusConnection.getInstance();