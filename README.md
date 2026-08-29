# CollegeGPT — RAG-Based College Information Assistant

> **Official, Grounded, and Zero-Hallucination Academic Intelligence Platform**

---

## 1. Problem Statement

College students and administrative staff regularly struggle to navigate dense academic handbooks, multi-page syllabi, examination grading scales, attendance condonation criteria, and complex fee refund policies. Traditional keyword search tools fail on natural language questions, while standard conversational chatbots frequently hallucinate non-existent rules, creating academic risk for students and liability for universities.

---

## 2. Solution Overview

**CollegeGPT** is a production-grade Retrieval-Augmented Generation (RAG) assistant designed specifically for higher education institutions. It connects directly to official college documents, vectorizes extracted text into high-dimensional semantic spaces via PostgreSQL + pgvector, retrieves verified context, and grounds Large Language Model responses with precise page and document citations.

If a question cannot be answered directly from the indexed college knowledge base, the assistant explicitly and safely refuses to answer rather than fabricating false information.

---

## 3. Core Features

- **Grounded Academic QA:** Answers inquiries on attendance requirements, grading formulas, examination rules, and fee refunds with exact citations.
- **Strict Anti-Hallucination Guardrails:** Enforces similarity thresholds; queries without qualifying context receive clear, honest refusals without LLM speculation.
- **Prompt-Injection Defense:** Treats all user queries and retrieved context as untrusted input, neutralizing jailbreak attempts and system prompt extraction attacks.
- **Admin Document Knowledge Portal:** Administrative UI for uploading, inspecting, reprocessing, and deleting official PDFs and handbooks.
- **Document Chunking & Vector Ingestion:** 700-character semantic chunking with 100-character overlap and sentence boundary preservation.
- **Interactive Citation Inspector:** Students can click citations underneath assistant answers to view the source document, page number, similarity score, and relevant excerpt.
- **Role-Based Access Control (RBAC):** Strict separation between student registration and administrative knowledge ingestion.
- **Cross-User Privacy Isolation:** User conversation threads and message history are cryptographically isolated per student.
- **Zero-Dep & Production Agility:** Operates seamlessly on Supabase PostgreSQL + pgvector + Supabase Storage in production, with an automated in-memory vector fallback for rapid offline development.

---

## 4. Mandatory RAG Pipeline

```
College Documents (PDF / TXT)
          ↓
   Text Extraction (Page-by-page)
          ↓
   Text Cleaning & Normalization
          ↓
   Chunking (700 chars / 100 overlap)
          ↓
   Embeddings Generation (text-embedding-004 / 768-dim)
          ↓
   PostgreSQL + pgvector (HNSW Indexing)
          ↓
[ Student Natural Language Query ]
          ↓
   Query Embedding (768-dim)
          ↓
   Cosine Similarity Search (HNSW <=> Index)
          ↓
   Relevance Threshold Filtering & Context Construction
          ↓
   Grounded LLM Prompt (Gemini / OpenRouter)
          ↓
   Grounded Answer + Clickable Page Citations
```

---

## 5. Technology Stack

- **Frontend:** Next.js 14, React 18, Tailwind CSS, Lucide Icons, Axios, Zustand
- **Backend:** Node.js, Express.js, JWT, Bcryptjs, Multer, Helmet, CORS
- **Vector Database:** PostgreSQL 16 + `pgvector` (`vector(768)` with HNSW index `vector_cosine_ops`)
- **Document Storage:** Supabase Storage (Production) / Local Disk (Development)
- **AI Models:** Google `text-embedding-004` (768 dim), Google Gemini 1.5 Flash / OpenRouter LLMs

---

## 6. Database Schema (PostgreSQL + pgvector)

```sql
-- 1. Profiles & RBAC
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  department VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'General',
  department VARCHAR(100) DEFAULT 'General',
  academic_year VARCHAR(50) DEFAULT '2025-2026',
  document_type VARCHAR(100) DEFAULT 'Handbook',
  filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'UPLOADED' CHECK (status IN ('UPLOADED', 'PROCESSING', 'INDEXED', 'FAILED', 'ARCHIVED')),
  error_message TEXT,
  total_pages INT DEFAULT 0,
  total_chunks INT DEFAULT 0,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Document Versions
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INT NOT NULL DEFAULT 1,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Document Chunks & High-Dimensional Vectors
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_id UUID REFERENCES document_versions(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  page_number INT NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  character_count INT NOT NULL,
  embedding vector(768) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW Vector Cosine Index
CREATE INDEX document_chunks_embedding_hnsw_idx 
ON document_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 5. Conversations & Messages
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender VARCHAR(50) NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  is_fallback BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Grounded Message Sources
CREATE TABLE message_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  chunk_id UUID REFERENCES document_chunks(id) ON DELETE SET NULL,
  document_title VARCHAR(255) NOT NULL,
  page_number INT NOT NULL DEFAULT 1,
  similarity_score FLOAT NOT NULL DEFAULT 0.0,
  snippet TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Local Quickstart Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v15+) with `pgvector` (optional; zero-dep fallback activates automatically if `DATABASE_URL` is omitted)

### Step 1: Clone and Configure Backend
```bash
cd server
cp .env.example .env
npm install
```

### Step 2: Seed Administrator Account
```bash
npm run seed:admin
# Default Admin credentials: admin@college.edu / CollegeAdminSecure2026!
```

### Step 3: Start Backend Server
```bash
npm run dev
# Running on http://localhost:5000
```

### Step 4: Start Frontend Client
```bash
cd ../client
npm install
npm run dev
# Accessible at http://localhost:3000
```

---

## 8. Environment Variables

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment Mode | `development` / `production` |
| `PORT` | Backend HTTP Port | `5000` |
| `CLIENT_URL` | Frontend Origin for CORS | `http://localhost:3000` |
| `DATABASE_URL` | PostgreSQL Connection URI with pgvector | `postgresql://postgres:...` |
| `JWT_SECRET` | Secret token signing key | `[Min 32 characters]` |
| `EMBEDDING_PROVIDER` | Vector Embedding Provider | `google` |
| `EMBEDDING_MODEL` | Embedding Model Name | `text-embedding-004` |
| `EMBEDDING_DIMENSION`| Embedding Vector Length | `768` |
| `TOP_K` | Number of chunks retrieved per query | `5` |
| `SIMILARITY_THRESHOLD`| Cosine similarity cutoff | `0.15` |
| `MAX_CONTEXT_CHARS` | Upper bound on prompt context | `4000` |
| `GEMINI_API_KEY` | Google Gemini API Key | `AIzaSy...` |
| `OPENROUTER_API_KEY`| OpenRouter API Key | `sk-or-v1-...` |
| `STORAGE_PROVIDER` | Document Storage Adapter | `local` / `supabase` |
| `SUPABASE_URL` | Supabase Project URL | `https://xyz.supabase.co` |
| `SUPABASE_KEY` | Supabase Service Role Key | `[Server-Side Key]` |
| `SUPABASE_BUCKET` | Supabase Storage Bucket | `collegegpt-documents` |

---

## 9. Comprehensive API Reference

### Authentication
- `POST /api/auth/register` — Public Student Registration (strictly enforces student role)
- `POST /api/auth/login` — Authenticate and receive signed JWT
- `GET /api/auth/me` — Retrieve authenticated user profile

### Document Knowledge Base (Admin Only)
- `POST /api/documents` — Upload PDF/TXT and trigger background chunking + vectorization
- `GET /api/documents` — List documents with category, department, and status filters
- `GET /api/documents/:id` — Retrieve document details
- `GET /api/documents/:id/status` — Live status poll (`UPLOADED`, `PROCESSING`, `INDEXED`, `FAILED`)
- `PATCH /api/documents/:id` — Update document metadata
- `POST /api/documents/:id/reprocess` — Re-extract text, re-chunk, and re-embed
- `DELETE /api/documents/:id` — Permanently purge document and cascade-delete vector chunks

### Student Chat & RAG
- `POST /api/chat` — Submit natural language question; returns grounded answer with page citations
- `GET /api/conversations` — List authenticated student's conversation threads
- `GET /api/conversations/:id` — Retrieve conversation message history with citations
- `DELETE /api/conversations/:id` — Delete conversation thread

### System Health
- `GET /api/health` — Diagnostics reporting database type, pgvector status, and storage configuration

---

## 10. Automated Testing

All 4 test suites validate 100% of functional, security, and quality requirements:

```bash
# Run Phase 2 Foundation & Auth tests (6 tests)
node test_phase2.js

# Run Phase 3 Document Ingestion & RAG Indexing tests (27 tests)
node test_phase3.js

# Run Phase 4 RAG Question Answering & Chat tests (30 tests)
node test_phase4.js

# Run Phase 5 Production Readiness & Quality Benchmark (10 tests)
node test_phase5.js
```

---

## 11. Production Deployment

### Frontend (Vercel)
- Framework Preset: **Next.js**
- Root Directory: `client`
- Environment Variables: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api`

### Backend (Render)
- Environment: **Node**
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variables: `NODE_ENV=production`, `DATABASE_URL=...`, `JWT_SECRET=...`, `GEMINI_API_KEY=...`, `STORAGE_PROVIDER=supabase`

### Database & Storage (Supabase)
- Enable `pgvector` extension: `CREATE EXTENSION IF NOT EXISTS vector;`
- Execute [server/src/database/schema.sql](file:///c:/Users/nalam/Desktop/project%20AI/server/src/database/schema.sql)
- Create private bucket: `collegegpt-documents`

---

## 12. Security & Compliance Notes

1. **No Frontend Secrets:** Supabase service-role keys and LLM API keys are strictly confined to the backend server.
2. **Path Traversal Prevention:** Files are written to server-generated unique paths with sanitization.
3. **Privilege Escalation Defense:** Public registration endpoints ignore client-supplied roles and force `student`.
4. **Prompt-Injection Neutralization:** Grounded prompts isolate retrieved text within XML/bracket boundaries and instruct the model to disregard embedded commands.

---

## 13. Deployment URLs & Demo

- **Live Application Demo:** `https://collegegpt.vercel.app` *(Placeholder for deployment)*
- **Production API Endpoint:** `https://collegegpt-api.onrender.com/api` *(Placeholder for deployment)*
