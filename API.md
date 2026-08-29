# CollegeGPT — API Documentation

This document provides complete technical specifications for all CollegeGPT REST API endpoints.

---

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://collegegpt-api.onrender.com/api`

---

## Authentication Header
All protected endpoints require a valid JWT Bearer token:
```http
Authorization: Bearer <your_jwt_token>
```

---

## Standard Error Response Format
All errors return consistent JSON responses:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | BAD_REQUEST | INTERNAL_SERVER_ERROR",
    "message": "Human readable explanation of the error."
  }
}
```

---

## Endpoints

### 1. Health & Diagnostics
#### `GET /api/health`
Returns system status, active database backend, vector dimension, and storage provider.

- **Access:** Public
- **Response 200:**
```json
{
  "status": "healthy",
  "system": "CollegeGPT RAG Platform",
  "databaseBackend": "postgresql",
  "vectorBackend": {
    "provider": "google",
    "model": "text-embedding-004",
    "dimension": 768,
    "pgvectorAvailable": true,
    "databaseType": "PostgreSQL + pgvector"
  },
  "storage": {
    "provider": "supabase",
    "supabaseConnected": true,
    "bucket": "collegegpt-documents"
  }
}
```

---

### 2. Authentication
#### `POST /api/auth/register`
Public registration for students. Role is automatically set to `student`.

- **Access:** Public
- **Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@university.edu",
  "password": "StrongPassword2026!",
  "department": "Computer Science"
}
```
- **Response 201:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "c1f7b8a2-...",
      "name": "Jane Doe",
      "email": "jane@university.edu",
      "role": "student",
      "department": "Computer Science"
    }
  }
}
```

#### `POST /api/auth/login`
Authenticates a student or provisioned administrator.

- **Access:** Public
- **Body:**
```json
{
  "email": "admin@college.edu",
  "password": "CollegeAdminSecure2026!"
}
```
- **Response 200:** Returns JWT token and user profile.

#### `GET /api/auth/me`
Retrieves authenticated user profile.

- **Access:** Authenticated (Student or Admin)

---

### 3. Document Management (Admin Only)

#### `POST /api/documents`
Uploads an official college PDF or text document and triggers background extraction, 700-character chunking, and 768-dimensional vector embedding.

- **Access:** Admin Only
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `file`: PDF or TXT binary file (Required)
  - `title`: Document Title (Required)
  - `description`: Optional text
  - `category`: `Academics` | `Admissions` | `Examination` | `Fee Policies` | `Hostel & Campus` | `General`
  - `department`: e.g. `Computer Science`, `Academic Affairs`
  - `academic_year`: e.g. `2025-2026`
  - `document_type`: `Handbook` | `Syllabus` | `Policy Document`
- **Response 201:** Returns document record with initial status `UPLOADED`.

#### `GET /api/documents`
Lists documents with optional search and filters.

- **Query Parameters:**
  - `search`: Filter by title or description
  - `category`: Filter by category
  - `department`: Filter by department
  - `status`: `UPLOADED` | `PROCESSING` | `INDEXED` | `FAILED`
  - `page`: Page number (default: 1)
  - `limit`: Limit per page (default: 20)

#### `GET /api/documents/:id/status`
Polls ingestion status and chunk count.

- **Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "status": "INDEXED",
    "totalPages": 12,
    "totalChunks": 48,
    "errorMessage": null,
    "updatedAt": "2026-08-29T12:00:00Z"
  }
}
```

#### `POST /api/documents/:id/reprocess`
Re-extracts text, recreates chunks, and generates new vector embeddings.

#### `DELETE /api/documents/:id`
Permanently deletes the document from storage, the database, and purges all associated vector chunks.

---

### 4. Student Chat & Grounded RAG

#### `POST /api/chat`
Submits a natural language academic question. Embeds query, performs pgvector cosine similarity search, constructs bounded context, and calls grounded LLM.

- **Access:** Authenticated (Student or Admin)
- **Body:**
```json
{
  "conversationId": "optional-uuid-to-continue-thread",
  "message": "What is the minimum attendance required to appear in exams?",
  "options": {
    "topK": 5,
    "similarityThreshold": 0.15
  }
}
```
- **Response 200 (Grounded Answer):**
```json
{
  "success": true,
  "data": {
    "conversationId": "3a4b3875-...",
    "message": {
      "id": "msg-uuid",
      "sender": "assistant",
      "answer": "Based on official college regulations: The minimum aggregate attendance required to be eligible for end-semester examinations is 75% in each enrolled subject. [Official Academic Handbook 2026, Page 1]",
      "supported": true,
      "sources": [
        {
          "documentId": "doc-uuid",
          "chunkId": "chunk-uuid",
          "title": "Official Academic Handbook 2026",
          "page": 1,
          "similarity": 0.1735,
          "snippet": "The minimum aggregate attendance required to be eligible for end-semester examinations is 75% in each enrolled subject."
        }
      ],
      "latency": {
        "embeddingMs": 42,
        "retrievalMs": 18,
        "llmMs": 180,
        "totalMs": 240
      }
    }
  }
}
```
- **Response 200 (Out-of-Scope / Unknown Question Refusal):**
```json
{
  "success": true,
  "data": {
    "conversationId": "3a4b3875-...",
    "message": {
      "id": "msg-uuid",
      "sender": "assistant",
      "answer": "I couldn't find this information in the college knowledge base.",
      "supported": false,
      "sources": []
    }
  }
}
```

#### `GET /api/conversations`
Lists the authenticated user's conversation threads.

#### `GET /api/conversations/:id`
Retrieves message history and attached source citations for a specific conversation. Enforces cross-user privacy (returns 404/403 for threads owned by other users).

#### `DELETE /api/conversations/:id`
Deletes a conversation thread and its message history.
