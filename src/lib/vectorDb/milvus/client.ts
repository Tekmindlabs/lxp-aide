import { MilvusClient } from '@zilliz/milvus2-sdk-node';

class MilvusConnection {
  private static instance: MilvusClient;

  private constructor() {}

  static async getInstance(): Promise<MilvusClient> {
    if (!MilvusConnection.instance) {
      if (!process.env.MILVUS_ADDRESS || !process.env.MILVUS_TOKEN) {
        throw new Error('Milvus connection details not provided');
      }

      const config = {
        address: process.env.MILVUS_ADDRESS.replace(/^https?:\/\//, ''),
        token: process.env.MILVUS_TOKEN,
        ssl: true
      };

      MilvusConnection.instance = new MilvusClient(config);
    }
    return MilvusConnection.instance;
  }
}

export const getMilvusClient = () => MilvusConnection.getInstance();