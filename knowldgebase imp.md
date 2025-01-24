Based on the provided codebase and requirements, I'll create a comprehensive requirements document for implementing a centralized knowledge base with workspace access in LXP Aide.

# Requirements Document: Centralized Knowledge Base with Workspace Access

## 1. System Architecture Overview

### 1.1 Core Components
- Centralized Document Management System
- Workspace Management System
- AI Integration Layer (OpenAI-compatible providers)
- Vector Database (LanceDB)
- Embedding Service (Jina AI API)
- Access Control System

### 1.2 Integration Points
- LXP Aide Core System
- Class Management System
- User Management System
- Document Processing Pipeline

## 2. Knowledge Base Management

### 2.1 Centralized Document Repository
```typescript
interface CentralizedKnowledgeBase {
  id: string;
  name: string;
  description: string;
  folders: DocumentFolder[];
  documents: Document[];
  createdAt: DateTime;
  updatedAt: DateTime;
}

interface DocumentFolder {
  id: string;
  name: string;
  description: string;
  parentFolderId?: string;
  documents: Document[];
  metadata: JSON;
}

interface Document {
  id: string;
  title: string;
  type: string; // PDF, DOCX, TXT, etc.
  content: string;
  metadata: JSON;
  embeddings: number[];
  folderId: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### 2.2 Document Processing Pipeline
1. Document Upload
2. Text Extraction
3. Content Chunking
4. Embedding Generation using Jina AI
5. Vector Storage in LanceDB
6. Metadata Indexing

## 3. Workspace System

### 3.1 Workspace Structure
```typescript
interface Workspace {
  id: string;
  type: 'CLASS' | 'ADMIN';
  name: string;
  description: string;
  classId?: string; // For class workspaces
  documents: WorkspaceDocument[];
  vectorCollection: string; // LanceDB collection name
  createdAt: DateTime;
  updatedAt: DateTime;
}

interface WorkspaceDocument {
  id: string;
  sourceDocumentId: string; // Reference to centralized document
  workspace: string;
  metadata: JSON;
  permissions: DocumentPermission[];
}
```

### 3.2 Workspace Creation Process
1. Automatic workspace creation on class creation
2. Vector collection initialization
3. Permission setup
4. Document attachment system

## 4. Access Control System

### 4.1 Role-Based Access
```typescript
enum UserRole {
  SUPER_ADMIN,
  PROGRAM_COORDINATOR,
  TEACHER,
  STUDENT
}

interface WorkspacePermission {
  workspaceId: string;
  roleId: UserRole;
  permissions: string[]; // READ, WRITE, MANAGE, etc.
}
```

### 4.2 Permission Levels
- Super Admin: Full access to centralized knowledge base and all workspaces
- Program Coordinator: Access to program-related workspaces
- Teachers: Access to assigned class workspaces
- Students: Read-only access to class workspace documents

I'll create a small guide for LanceDB implementation that can be added to the requirements document. Here's the section to add:

## LanceDB Implementation Guide

### 1. Storage Setup

First, create the necessary storage directory structure:

```bash
mkdir -p storage/lancedb
mkdir -p storage/vector-cache
mkdir -p storage/documents
```

### 2. Environment Configuration

Add these variables to your `.env` file:

```env
# Existing LXP Aide .env configurations...

# LanceDB Storage Configuration
STORAGE_DIR=./storage
VECTOR_CACHE_DIR=./storage/vector-cache
DOCUMENTS_DIR=./storage/documents
```

### 3. LanceDB Client Implementation

Create a new file `utils/vectorDb/lance/index.ts`:

```typescript
import lancedb from '@lancedb/lancedb';
import { TextSplitter } from '../TextSplitter';

export class LanceDbClient {
  private uri: string;
  
  constructor() {
    this.uri = `${process.env.STORAGE_DIR ? `${process.env.STORAGE_DIR}/` : "./storage/"}lancedb`;
  }

  async connect() {
    try {
      return await lancedb.connect(this.uri);
    } catch (error) {
      console.error('Failed to connect to LanceDB:', error);
      throw error;
    }
  }

  async createOrGetCollection(name: string, schema?: any) {
    const db = await this.connect();
    try {
      const existingTable = await db.openTable(name);
      return existingTable;
    } catch {
      // Table doesn't exist, create new
      return await db.createTable(name, [], schema);
    }
  }

  async addDocumentEmbeddings(
    collectionName: string,
    embeddings: number[][],
    metadata: any[]
  ) {
    const collection = await this.createOrGetCollection(collectionName);
    const data = embeddings.map((embedding, index) => ({
      vector: embedding,
      ...metadata[index]
    }));
    
    await collection.add(data);
  }

  async similaritySearch(
    collectionName: string,
    queryEmbedding: number[],
    limit: number = 5
  ) {
    const collection = await this.createOrGetCollection(collectionName);
    return await collection.search(queryEmbedding)
      .limit(limit)
      .execute();
  }

  async deleteCollection(name: string) {
    const db = await this.connect();
    try {
      await db.dropTable(name);
    } catch (error) {
      console.error(`Failed to delete collection ${name}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const lanceDbClient = new LanceDbClient();
```

### 4. Usage Example

```typescript
import { lanceDbClient } from '../utils/vectorDb/lance';
import { JinaEmbeddingService } from '../services/embedding';

async function processAndStoreDocument(
  workspaceId: string,
  document: Document,
  jinaEmbedder: JinaEmbeddingService
) {
  // 1. Split document into chunks
  const textSplitter = new TextSplitter();
  const chunks = textSplitter.split(document.content);

  // 2. Generate embeddings
  const embeddings = await jinaEmbedder.embedChunks(chunks);

  // 3. Prepare metadata
  const metadata = chunks.map((chunk, index) => ({
    documentId: document.id,
    workspaceId,
    content: chunk,
    chunkIndex: index,
  }));

  // 4. Store in LanceDB
  const collectionName = `workspace_${workspaceId}`;
  await lanceDbClient.addDocumentEmbeddings(
    collectionName,
    embeddings,
    metadata
  );
}

// Example search function
async function searchWorkspace(
  workspaceId: string,
  query: string,
  jinaEmbedder: JinaEmbeddingService
) {
  // 1. Generate query embedding
  const queryEmbedding = await jinaEmbedder.embedText(query);

  // 2. Search in workspace collection
  const results = await lanceDbClient.similaritySearch(
    `workspace_${workspaceId}`,
    queryEmbedding,
    5
  );

  return results;
}
```

### 5. Directory Structure

```
project_root/
├── storage/
│   ├── lancedb/        # LanceDB storage
│   ├── vector-cache/   # Cache for vectors
│   └── documents/      # Original documents
├── utils/
│   └── vectorDb/
│       └── lance/
│           └── index.ts
└── .env
```

This implementation provides a simple yet robust way to manage vector embeddings using LanceDB with local storage. It includes basic CRUD operations and similarity search functionality, which can be extended based on specific requirements.

The guide can be integrated into the main requirements document under the "Implementation Details" section, providing concrete implementation steps for the vector database component.

## 5. AI Integration

### 5.1 Vector Database Configuration
```typescript
interface LanceDBConfig {
  uri: string;
  dimension: number; // Based on Jina AI embedding size
  similarity: string;
  indexes: string[];
}
```

### 5.2 Embedding Service
```typescript
interface JinaEmbeddingService {
  apiKey: string;
  baseUrl: string;
  modelName: string;
  dimension: number;
  batchSize: number;
}
```

### 5.3 LangChain Integration
- Document loaders
- Text splitters
- Vector store integration
- Chain templates for Q&A

## 6. Implementation Instructions

### 6.1 Setup Environment
```bash
# Required environment variables
JINA_API_KEY=your_jina_api_key
JINA_BASE_URL=https://api.jina.ai/v1
JINA_MODEL_NAME=jina-embedding-v2
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=your_openai_api_key
OPENAI_MODEL=your_openai_api_key
LANCEDB_URI=your_lancedb_uri
```

### 6.2 Database Schema Updates
1. Create new tables for knowledge base management
2. Add workspace-related tables
3. Update class tables with workspace references

### 6.3 Implementation Steps

1. **Set up Centralized Knowledge Base**
```typescript
// Initialize knowledge base service
const knowledgeBase = new CentralizedKnowledgeBase({
  embedder: new JinaEmbeddingService(config),
  vectorStore: new LanceDBStore(dbConfig)
});
```

2. **Implement Workspace Creation**
```typescript
// On class creation
async function createClassWorkspace(classId: string) {
  const workspace = await Workspace.create({
    type: 'CLASS',
    classId,
    vectorCollection: `class_${classId}_vectors`
  });
  
  await initializeVectorCollection(workspace.vectorCollection);
}
```

3. **Document Management**
```typescript
// Document processing pipeline
async function processDocument(file: File, folderId: string) {
  const document = await DocumentProcessor.extract(file);
  const chunks = await TextSplitter.split(document.content);
  const embeddings = await jinaEmbedder.embedChunks(chunks);
  
  await lanceDB.insert(embeddings);
  await saveDocument(document, folderId);
}
```

4. **Workspace Document Attachment**
```typescript
async function attachDocumentToWorkspace(
  documentId: string,
  workspaceId: string
) {
  const sourceDoc = await Document.findById(documentId);
  await WorkspaceDocument.create({
    sourceDocumentId: documentId,
    workspaceId,
    metadata: sourceDoc.metadata
  });
}
```

### 6.4 API Endpoints

1. **Knowledge Base Management**
```typescript
// Document management routes
POST /api/knowledge-base/documents
GET /api/knowledge-base/documents
PUT /api/knowledge-base/documents/:id
DELETE /api/knowledge-base/documents/:id

// Folder management routes
POST /api/knowledge-base/folders
GET /api/knowledge-base/folders
PUT /api/knowledge-base/folders/:id
DELETE /api/knowledge-base/folders/:id
```

2. **Workspace Management**
```typescript
// Workspace routes
POST /api/workspaces
GET /api/workspaces
GET /api/workspaces/:id/documents
POST /api/workspaces/:id/documents
DELETE /api/workspaces/:id/documents/:documentId
```
lance db implimenttaion 

## 7. Testing Requirements

1. Unit Tests
- Document processing
- Embedding generation
- Vector storage operations
- Permission checks

2. Integration Tests
- Workspace creation flow
- Document attachment process
- Search functionality
- Access control validation

3. Performance Tests
- Document processing pipeline
- Vector search performance
- Multi-user access scenarios

.