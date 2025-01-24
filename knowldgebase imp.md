Based on the codebase and requirements, I'll provide detailed requirements for implementing the class group knowledge base using the second approach (Dedicated Collections with Shared Service). This approach aligns well with the existing LXP architecture and class group management system.

# Class Group Knowledge Base Implementation Requirements

## 1. Data Models and Schema Extensions

```typescript
// 1. Extend Prisma Schema
model ClassGroupKnowledgeBase {
  id          String      @id @default(cuid())
  classGroupId String     @unique
  classGroup   ClassGroup @relation(fields: [classGroupId], references: [id])
  name        String
  description String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  documents   Document[]
  collections MilvusCollection[]
}

model Document {
  id          String   @id @default(cuid())
  title       String
  content     String   @db.Text
  type        String   // e.g., "lesson", "assignment", "resource"
  metadata    Json?
  knowledgeBaseId String
  knowledgeBase ClassGroupKnowledgeBase @relation(fields: [knowledgeBaseId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model MilvusCollection {
  id          String   @id @default(cuid())
  name        String   @unique
  dimension   Int      @default(1536)
  metadata    Json?
  knowledgeBaseId String
  knowledgeBase ClassGroupKnowledgeBase @relation(fields: [knowledgeBaseId], references: [id])
}
```

## 2. Service Implementation

```typescript
// 2. Create ClassGroupKnowledgeBase Service
interface KnowledgeBaseConfig {
  dimension: number;
  metricType: string;
  indexType: string;
}

class ClassGroupKnowledgeBaseService {
  private milvusClient: MilvusClient;
  private config: KnowledgeBaseConfig;

  constructor(config: KnowledgeBaseConfig) {
    this.config = config;
    this.milvusClient = new MilvusClient(process.env.MILVUS_URL);
  }

  async createKnowledgeBase(classGroupId: string, name: string) {
    // 1. Create database entry
    const knowledgeBase = await prisma.classGroupKnowledgeBase.create({
      data: {
        classGroupId,
        name,
        collections: {
          create: {
            name: `class_group_${classGroupId}_main`,
            dimension: this.config.dimension
          }
        }
      }
    });

    // 2. Initialize Milvus collection
    await this.milvusClient.createCollection({
      collection_name: `class_group_${classGroupId}_main`,
      dimension: this.config.dimension,
      metric_type: this.config.metricType,
      index_type: this.config.indexType
    });

    return knowledgeBase;
  }

  async addDocument(knowledgeBaseId: string, document: DocumentInput) {
    // 1. Store document in PostgreSQL
    const savedDoc = await prisma.document.create({
      data: {
        ...document,
        knowledgeBaseId
      }
    });

    // 2. Generate embedding
    const embedding = await generateEmbedding(document.content);

    // 3. Store in Milvus
    await this.milvusClient.insert({
      collection_name: `class_group_${knowledgeBaseId}_main`,
      data: [{
        id: savedDoc.id,
        embedding,
        metadata: {
          title: document.title,
          type: document.type
        }
      }]
    });

    return savedDoc;
  }

  async searchContent(knowledgeBaseId: string, query: string) {
    const embedding = await generateEmbedding(query);
    
    return this.milvusClient.search({
      collection_name: `class_group_${knowledgeBaseId}_main`,
      vector: embedding,
      limit: 5
    });
  }
}
```

## 3. API Routes Implementation

```typescript
// 3. Create API endpoints
// src/pages/api/class-group/[id]/knowledge-base/index.ts
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { name } = await req.json();
  const service = new ClassGroupKnowledgeBaseService(defaultConfig);
  
  const knowledgeBase = await service.createKnowledgeBase(
    params.id,
    name
  );

  return Response.json(knowledgeBase);
}

// src/pages/api/class-group/[id]/knowledge-base/documents.ts
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const document = await req.json();
  const service = new ClassGroupKnowledgeBaseService(defaultConfig);
  
  const savedDoc = await service.addDocument(
    params.id,
    document
  );

  return Response.json(savedDoc);
}
```

## 4. Integration with Class Group Management

```typescript
// 4. Extend ClassGroupForm component
export function ClassGroupForm({ 
  selectedClassGroup,
  onSuccess 
}: ClassGroupFormProps) {
  // ... existing form code ...

  const createMutation = api.classGroup.create.useMutation({
    onSuccess: async (data) => {
      // Create knowledge base after class group creation
      await fetch(`/api/class-group/${data.id}/knowledge-base`, {
        method: 'POST',
        body: JSON.stringify({
          name: `${data.name} Knowledge Base`
        })
      });
      onSuccess();
    }
  });

  // ... rest of component
}
```

## 5. Access Control Requirements

```typescript
// 5. Define access control rules
const knowledgeBaseAccessRules = {
  CREATE: ['SUPER_ADMIN', 'PROGRAM_COORDINATOR'],
  READ: ['SUPER_ADMIN', 'PROGRAM_COORDINATOR', 'TEACHER'],
  UPDATE: ['SUPER_ADMIN', 'PROGRAM_COORDINATOR'],
  DELETE: ['SUPER_ADMIN'],
  MANAGE_DOCUMENTS: ['SUPER_ADMIN', 'PROGRAM_COORDINATOR', 'TEACHER']
};

// Middleware implementation
export async function validateKnowledgeBaseAccess(
  req: NextApiRequest,
  res: NextApiResponse,
  next: NextFunction
) {
  const { user } = req.session;
  const action = req.method;
  
  if (!knowledgeBaseAccessRules[action].includes(user.role)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  next();
}
```

## 6. UI Components

```typescript
// 6. Create knowledge base management components
interface KnowledgeBaseProps {
  classGroupId: string;
}

export function KnowledgeBaseManager({ classGroupId }: KnowledgeBaseProps) {
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // ... implementation of document management UI
  return (
    <div>
      <DocumentUploader classGroupId={classGroupId} />
      <DocumentSearch 
        classGroupId={classGroupId}
        onSearch={setSearchQuery}
      />
      <DocumentList 
        documents={documents}
        onDelete={handleDelete}
      />
    </div>
  );
}
```

## 7. Testing Requirements

```typescript
// 7. Test specifications
describe('ClassGroupKnowledgeBase', () => {
  it('should create knowledge base when class group is created', async () => {
    // Test implementation
  });

  it('should properly handle document uploads and embeddings', async () => {
    // Test implementation
  });

  it('should enforce access control rules', async () => {
    // Test implementation
  });
});
```

## 8. Deployment Considerations

1. **Environment Variables**:
```env
MILVUS_URL=
MILVUS_PORT=
OPENAI_API_KEY=  # For embeddings generation
openai_base_url
Openai_model
```

2. **Infrastructure Requirements**:
- Milvus instance with sufficient capacity
- Storage for document files
- Adequate memory for embedding generation

3. **Monitoring Requirements**:
- Collection size metrics
- Search performance metrics
- Embedding generation latency
- Error rates and types

I'll create detailed requirements for implementing Jina API embeddings integration with the class group knowledge base system. Here's the comprehensive implementation plan:

# Requirements for Class Group Knowledge Base with Jina Embeddings

## 1. Jina API Integration Service

```typescript
// src/lib/jina/embeddings.ts
interface JinaConfig {
  apiKey: string;
  baseUrl: string;
  modelName: string;
  dimension: number;
}

class JinaEmbeddingService {
  private config: JinaConfig;

  constructor(config: JinaConfig) {
    this.config = config;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: text,
          model: this.config.modelName
        })
      });

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: texts,
          model: this.config.modelName
        })
      });

      const data = await response.json();
      return data.data.map((item: any) => item.embedding);
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      throw error;
    }
  }
}
```

## 2. Enhanced Knowledge Base Service with Jina Integration

```typescript
// src/lib/services/class-group-knowledge.ts
interface ClassGroupKnowledgeConfig {
  dimension: number;
  similarityMetric: string;
  jinaConfig: JinaConfig;
}

class ClassGroupKnowledgeBase {
  private milvusClient: MilvusClient;
  private jinaService: JinaEmbeddingService;
  private config: ClassGroupKnowledgeConfig;

  constructor(config: ClassGroupKnowledgeConfig) {
    this.config = config;
    this.milvusClient = new MilvusClient(process.env.MILVUS_URL);
    this.jinaService = new JinaEmbeddingService(config.jinaConfig);
  }

  async createCollection(classGroupId: string) {
    const collectionName = `class_group_${classGroupId}`;
    
    await this.milvusClient.createCollection({
      collection_name: collectionName,
      fields: [
        {
          name: 'id',
          data_type: DataType.VARCHAR,
          is_primary_key: true,
          max_length: 100
        },
        {
          name: 'content',
          data_type: DataType.VARCHAR,
          max_length: 65535
        },
        {
          name: 'embedding',
          data_type: DataType.FLOAT_VECTOR,
          dim: this.config.dimension
        },
        {
          name: 'metadata',
          data_type: DataType.JSON
        }
      ]
    });

    // Create index for vector field
    await this.milvusClient.createIndex({
      collection_name: collectionName,
      field_name: 'embedding',
      extra_params: {
        metric_type: this.config.similarityMetric
      }
    });
  }

  async addDocument(classGroupId: string, document: Document) {
    const embedding = await this.jinaService.generateEmbedding(document.content);
    
    await this.milvusClient.insert({
      collection_name: `class_group_${classGroupId}`,
      data: [{
        id: document.id,
        content: document.content,
        embedding,
        metadata: JSON.stringify({
          title: document.title,
          type: document.type,
          created: new Date().toISOString()
        })
      }]
    });
  }

  async searchSimilarDocuments(classGroupId: string, query: string, limit: number = 5) {
    const embedding = await this.jinaService.generateEmbedding(query);
    
    return this.milvusClient.search({
      collection_name: `class_group_${classGroupId}`,
      vector: embedding,
      limit,
      output_fields: ['content', 'metadata']
    });
  }
}
```

## 3. Environment Configuration

```env
# .env
JINA_API_KEY=your_jina_api_key
JINA_BASE_URL=https://api.jina.ai/v1
JINA_MODEL_NAME=jina-embedding-v2
JINA_EMBEDDING_DIMENSION=512

MILVUS_URL=localhost:19530
MILVUS_USERNAME=root
MILVUS_PASSWORD=milvus
```

## 4. API Routes Implementation

```typescript
// src/app/api/class-group/[id]/knowledge/route.ts
import { ClassGroupKnowledgeBase } from '@/lib/services/class-group-knowledge';

const knowledgeConfig = {
  dimension: parseInt(process.env.JINA_EMBEDDING_DIMENSION),
  similarityMetric: 'L2',
  jinaConfig: {
    apiKey: process.env.JINA_API_KEY,
    baseUrl: process.env.JINA_BASE_URL,
    modelName: process.env.JINA_MODEL_NAME,
    dimension: parseInt(process.env.JINA_EMBEDDING_DIMENSION)
  }
};

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const knowledgeBase = new ClassGroupKnowledgeBase(knowledgeConfig);
  const { document } = await req.json();

  try {
    await knowledgeBase.addDocument(params.id, document);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error adding document:', error);
    return Response.json({ error: 'Failed to add document' }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const knowledgeBase = new ClassGroupKnowledgeBase(knowledgeConfig);
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');

  if (!query) {
    return Response.json({ error: 'Query parameter required' }, { status: 400 });
  }

  try {
    const results = await knowledgeBase.searchSimilarDocuments(params.id, query);
    return Response.json(results);
  } catch (error) {
    console.error('Error searching documents:', error);
    return Response.json({ error: 'Search failed' }, { status: 500 });
  }
}
```

## 5. Integration Requirements

1. **Jina API Integration**:
   - Secure API key management
   - Error handling for API rate limits
   - Batch processing capabilities
   - Retry mechanisms for failed requests

2. **Vector Database Management**:
   - Automatic collection creation for new class groups
   - Index optimization for fast similarity search
   - Regular maintenance and cleanup of unused collections

3. **Performance Requirements**:
   - Maximum embedding generation time: 2 seconds
   - Maximum search response time: 1 second
   - Support for batch processing up to 100 documents

4. **Monitoring and Logging**:
   - Track API usage and costs
   - Monitor embedding quality
   - Log search performance metrics
   - Error tracking and reporting

5. **Security Requirements**:
   - Secure storage of API keys
   - Access control per class group
   - Data encryption at rest
   - Audit logging of all operations

This implementation provides a robust foundation for integrating Jina embeddings with the class group knowledge base system, ensuring efficient document management and similarity search capabilities.