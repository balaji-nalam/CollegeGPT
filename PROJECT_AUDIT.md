# PROJECT_AUDIT.md

## Executive Summary

This document provides a thorough audit of the **current codebase** versus the requirements for **CollegeGPT — RAG-Based College Information Assistant**.

---

## 1. Current Project Identity and Purpose
- **Current Identity:** Agentflow_AI (Agentic AI Operations Automation Platform).
- **Current Purpose:** An n8n/Zapier-style visual automation platform where operators describe automations in natural language, compile them into React Flow DAGs, and execute them through a 5-agent multi-agent swarm with OAuth tool integrations (Gmail, Slack, Discord, Google Sheets).
- **Target Project Identity:** **CollegeGPT — RAG-Based College Information Assistant**.
- **Target Purpose:** A domain-specific AI assistant that ingests college documents (PDF/text syllabi, policies, admission guidelines, handbooks), processes and chunks them, generates vector embeddings, stores them in a vector database (e.g. PostgreSQL with `pgvector` or hybrid vector store), performs semantic similarity search on student/faculty queries, constructs relevant context windows, and generates grounded answers with exact source citations while handling unknown queries safely.

---

## 2. Current Architecture
- **Client Tier:** Next.js (Pages Router), React 18, Tailwind CSS, Zustand, Axios, React Flow (`@xyflow/react`), Socket.IO client, Lucide icons.
- **Server Tier:** Node.js, Express, Helmet, Morgan, Compression, CORS, express-validator, express-rate-limit.
- **Orchestration / Agents:** 5 cooperating pure agent classes (`PlannerAgent`, `ExecutionAgent`, `ValidationAgent`, `RecoveryAgent`, `MonitoringAgent`) with an in-memory & BullMQ queue dispatcher.
- **Real-Time / Storage:** Socket.IO rooms (`execution:<id>`, `user:<id>`), MongoDB (with `mongodb-memory-server` zero-dependency fallback), BullMQ on Redis (with in-memory async fallback).
- **Security:** AES-256-GCM application-level credential encryption at rest, bcrypt cost factor 12, JWT bearer tokens.

---

## 3. Current Technology Stack

| Layer | Current Stack (Agentflow_AI) | CollegeGPT Required Stack | Status |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js (Pages), React, Tailwind, Zustand, React Flow, Socket.IO | Next.js / React, Tailwind, Chat UI, Document Upload UI, Admin Portal | Reusable with UI repurposing |
| **Backend** | Node.js, Express.js | Node.js / Express.js (or Python FastAPI/Node) | Fully Reusable |
| **Primary Database** | MongoDB / Mongoose | PostgreSQL (with `pgvector`) or MongoDB + Vector Index | Needs PG / pgvector or Vector Integration |
| **Vector Database** | **None** | `pgvector` / Vector Store (Chroma/Pinecone/pgvector) | **Missing** |
| **Document Ingestion** | **None** | `pdf-parse` / `multer` / `pdfjs-dist` / unstructured | **Missing** |
| **Embedding Engine** | **None** | OpenAI `text-embedding-3-small` / Gemini embeddings / HuggingFace | **Missing** |
| **LLM Inference** | Gemini SDK / OpenRouter (Zero-shot workflow graph generator) | Grounded RAG Prompting (Gemini / OpenAI / OpenRouter) | Needs Prompt & Pipeline Overhaul |
| **Auth & Security** | JWT, bcrypt (cost 12), RBAC (`admin`, `operator`) | JWT, bcrypt, RBAC (`admin`, `student`/`user`) | Reusable (role mapping needed) |

---

## 4. Existing Frontend Features
1. **Landing Page (`/`):** Showcase of multi-agent automation capabilities and CTA buttons.
2. **Authentication Pages (`/login`, `/register`):** Login and registration forms with validation, error banners, and demo auto-fill.
3. **Operations Dashboard (`/dashboard`):** `MetricGrid`, active workflow stats, recent execution cards, and AI status indicators.
4. **Workflow Studio (`/workflows/[id]`):** Drag-and-drop React Flow canvas, left `NodePalette`, right `NodeConfigPanel`, top toolbar with save/execute buttons.
5. **AI Workflow Synthesizer (`/workflows/builder`):** Natural-language prompt box, prompt recommendation chips, and interactive graph preview canvas.
6. **Execution Telemetry (`/executions`, `/executions/[id]`):** Live chronological execution timeline with color-coded agent badges (`planner`, `execution`, `validation`, `recovery`, `monitoring`), step inspector, and pause/resume/cancel controls.
7. **Integrations Manager (`/integrations`):** OAuth connectors for Gmail, Slack, Discord, Google Sheets with AES-256 key input modals.
8. **Settings (`/settings`):** Operator profile, AES-256 encryption health check, and system diagnostics.
9. **Notifications Drawer:** Slide-over panel streaming real-time alerts via Socket.IO.

---

## 5. Existing Backend Features
1. **JWT & RBAC Middleware:** `protect` and `authorize('admin', 'operator')`.
2. **Workflow CRUD & Lifecycle Engine:** Versioning, duplication, soft/hard deletion, execution snapshotting.
3. **5-Agent Swarm:**
   - `PlannerAgent`: Kahn's topological sort and confidence scoring.
   - `ExecutionAgent`: Parameter interpolation and provider execution.
   - `ValidationAgent`: Output schema and assertion checks.
   - `RecoveryAgent`: 5-category failure taxonomy classification and exponential backoff retry.
   - `MonitoringAgent`: Audit logging and real-time WebSocket event dispatching.
4. **Integration Engine:** `BaseIntegration` with Gmail, Slack, Discord, and Google Sheets implementations.
5. **Encryption Service:** AES-256-GCM encrypt/decrypt with dynamic IV and authentication tag.
6. **Queue System:** BullMQ on Redis with automatic in-memory queue fallback.
7. **Real-time Gateway:** Socket.IO with room multiplexing.

---

## 6. Existing Database / Storage Implementation
- **Database Engine:** MongoDB via Mongoose with automatic `mongodb-memory-server` in-memory fallback.
- **Models:**
  - `User.js` (name, email, password, role: `admin` | `operator`, lastLogin)
  - `Workflow.js` (name, description, owner, status, triggerConfig, nodes, edges, version, tags)
  - `Execution.js` (workflowId, snapshot, status, currentNode, startTime, endTime, duration, inputs, outputs, error, retryCount)
  - `ExecutionLog.js` (executionId, workflowId, nodeId, agent, level, message, metadata, timestamp)
  - `Integration.js` (owner, provider, encryptedAccessToken, encryptedRefreshToken, encryptedApiKey, scopes, expiresAt)
  - `Notification.js` (owner, workflowId, executionId, type, title, message, isRead)
  - `AgentMemory.js` (workflowId, executionId, agentId, key, value, confidenceScore)
- **Vector Storage:** ❌ **NONE.** There are no vector embeddings, cosine distance indexes, or vector collections implemented.

---

## 7. Existing Authentication Implementation
- **Mechanism:** JWT bearer tokens in `Authorization: Bearer <token>` header.
- **Password Security:** Salted hashes generated with bcrypt at cost factor 12.
- **Role Control:** Middleware supporting `admin` and `operator` (needs mapping to `student` / `admin`).
- **Profile Endpoint:** `GET /api/auth/me`.
- **Status:** **100% Fully Functional & Reusable.**

---

## 8. Existing AI / LLM Implementation
- **Current Implementations:**
  - `server/src/services/aiService.js`: Implements prompt-to-workflow JSON graph synthesis using OpenRouter (`google/gemini-2.5-flash`), Google Generative AI SDK (`gemini-1.5-flash`), and deterministic rule fallback templates.
  - `server/src/agents/executionAgent.js`: Simulates/executes AI transformation nodes.
- **Is this RAG?** ❌ **NO.** This is direct zero-shot prompt completion for generating visual node graphs. It does not perform vector retrieval, document search, or grounded knowledge synthesis.

---

## 9. Existing RAG Implementation (Verification of Mandatory Pipeline)

| RAG Pipeline Step | Implemented in Current Codebase? | Details / Findings |
| :--- | :---: | :--- |
| **1. Document Ingestion** | ❌ **NO** | No file upload routes, no `multer`, no document repository. |
| **2. Text Extraction (PDF/Docs)** | ❌ **NO** | No PDF parser (`pdf-parse`, `pdfjs-dist`, or `tesseract`) present. |
| **3. Text Chunking** | ❌ **NO** | No sliding window, token splitters, or recursive character splitters. |
| **4. Embedding Generation** | ❌ **NO** | No embedding model calls (`text-embedding-3-small`, `text-embedding-004`). |
| **5. Vector Database Storage** | ❌ **NO** | No pgvector, Chroma, Pinecone, or vector index configured. |
| **6. Semantic Similarity Search** | ❌ **NO** | No cosine distance / inner product top-$k$ nearest neighbor query. |
| **7. RAG Context Construction** | ❌ **NO** | No context window injection with chunk metadata / source pages. |
| **8. LLM Grounded Generation** | ❌ **NO** | Current LLM calls only generate workflow JSON schemas. |
| **9. Answer + Source Display** | ❌ **NO** | No citation format, no source document/page number rendering. |
| **10. Unknown-Question Handling** | ❌ **NO** | No threshold-based refusal ("I cannot find this in official documents"). |

---

## 10. Existing Vector Database Implementation
- **Status:** ❌ **None.** The current project uses MongoDB solely for relational-style document entities (Users, Workflows, Executions).

---

## 11. Existing Document Ingestion Implementation
- **Status:** ❌ **None.** There is no file upload handler, MIME validation, or document storage.

---

## 12. Existing API Endpoints

```
Auth:
  POST   /api/auth/register
  POST   /api/auth/login
  GET    /api/auth/me
  GET    /api/health

Workflows:
  GET    /api/workflows/dashboard
  GET    /api/workflows
  POST   /api/workflows
  POST   /api/workflows/generate
  GET    /api/workflows/:id
  PUT    /api/workflows/:id
  POST   /api/workflows/:id/duplicate
  DELETE /api/workflows/:id

Executions:
  GET    /api/executions
  GET    /api/executions/:id
  GET    /api/executions/:id/timeline
  POST   /api/executions/:id/pause
  POST   /api/executions/:id/resume
  POST   /api/executions/:id/cancel
  POST   /api/workflows/:id/execute

Integrations & Notifications:
  GET    /api/integrations
  GET    /api/integrations/status
  GET    /api/integrations/oauth/:provider/start
  GET    /api/integrations/oauth/:provider/callback
  POST   /api/integrations
  DELETE /api/integrations/:provider
  GET    /api/notifications
  PATCH  /api/notifications/read-all
  PATCH  /api/notifications/:id/read
```

---

## 13. Existing Tests and Their Results
- **Automated Test Runner:** `server/test_suite.js` (8 test suites covering auth, health, graph generation, workflow persistence, execution lifecycle, agent monitoring, integrations, and notifications).
- **Result:** **8/8 Suites Passed (100% Success).**
- **Client Build:** Next.js production build (`next build`) compiled 13 static pages cleanly.

---

## 14. Existing Deployment Configuration
- `server/package.json` with scripts `start` and `dev`.
- `client/package.json` with scripts `dev`, `build`, `start`, `lint`.
- Environment variable centralizer in `server/src/config/env.js`.

---

## Requirement-by-Requirement Comparison Table

| Requirement | Required by CollegeGPT | Already Implemented | Partially Implemented | Missing | Reusable Code |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **User Authentication** | Yes | ✅ Yes | | | `server/src/services/authService.js`, `middleware/auth.js`, `authStore.js` |
| **Student / Admin Roles** | Yes | | 🟡 Partial | | Role middleware is present (`admin`, `operator`). Needs `operator` $\rightarrow$ `student` rename. |
| **Document Upload (PDF, TXT, DOCX)** | Yes | | | ❌ Missing | Needs `multer` multipart upload controller & storage service. |
| **PDF Processing & Text Extraction** | Yes | | | ❌ Missing | Needs `pdf-parse` / PDF extraction service. |
| **Text Chunking & Sliding Window** | Yes | | | ❌ Missing | Needs recursive character chunker with overlap (e.g. 500 chars / 50 overlap). |
| **Embedding Generation** | Yes | | | ❌ Missing | Needs Google Gemini `text-embedding-004` or OpenAI `text-embedding-3-small`. |
| **Vector Database / pgvector** | Yes | | | ❌ Missing | Needs PostgreSQL with `pgvector` (or fallback vector store). |
| **Semantic Similarity Search** | Yes | | | ❌ Missing | Cosine similarity ($1 - \text{distance}$) search on top-$k$ chunks. |
| **RAG Context Construction** | Yes | | | ❌ Missing | Grounded context builder assembling chunk text + source document + page metadata. |
| **LLM Answer Generation** | Yes | | 🟡 Partial | | `aiService.js` has Gemini/OpenRouter SDKs, but needs RAG generation prompts. |
| **Source & Reference Display** | Yes | | | ❌ Missing | Frontend citation badges (document name, page number, confidence score). |
| **Unknown-Question Handling** | Yes | | | ❌ Missing | Fallback response when cosine similarity is below threshold. |
| **Conversation History** | Yes | | | ❌ Missing | Chat thread / session history model (`Conversation`, `Message`). |
| **Admin Document Management** | Yes | | | ❌ Missing | Admin dashboard to view, upload, re-index, and delete college knowledge documents. |
| **Student Chat Interface** | Yes | | | ❌ Missing | Conversational UI with streaming responses, suggested questions, and citations. |
| **Database Integration** | Yes | 🟡 Partial | | | MongoDB is currently configured; needs PostgreSQL/pgvector integration for vectors. |
| **Frontend/Backend Integration** | Yes | ✅ Yes | | | API client, interceptors, error handling, Zustand architecture are in place. |
| **Production Deployment Config** | Yes | ✅ Yes | | | Environment config, clean builds, zero-dependency fallbacks. |

---

## Action Plan & Assessment

### A. What Can Be Reused
1. **Authentication & Session System:**
   - `authService.js`, `authController.js`, `authRoutes.js`, `middleware/auth.js`, `middleware/rbac.js`.
   - Client `authStore.js`, `ProtectedRoute.jsx`, `login.js`, `register.js`.
2. **API & Frontend Architecture:**
   - Next.js + Tailwind CSS design system and AppShell layout structure.
   - Axios client `api.js` with bearer token injection and error interception.
   - Server structure: `env.js`, `errorHandler.js`, `validate.js`, `logger.js`.
3. **AI Provider SDKs & Credentials Vault:**
   - Google Generative AI SDK and OpenRouter connectivity in `aiService.js`.
   - AES-256-GCM encryption in `encryptionService.js` for securing keys.

### B. What Must Be Modified
1. **User Roles:**
   - Update `User.js` schema and `rbac.js` from `['admin', 'operator']` to `['admin', 'student']`.
2. **AI Service:**
   - Pivot `aiService.js` from visual graph generation to embedding generation (`text-embedding-004`) and grounded RAG answer generation with system prompt enforcement.
3. **Navigation & AppShell:**
   - Update `Sidebar.jsx` and `Header.jsx` to show **CollegeGPT** navigation: Chat Assistant, Document Repository, Knowledge Base, Conversation History, Admin Console, and Profile Settings.

### C. What Must Be Newly Implemented
1. **Document Processing & Chunking Subsystem:**
   - `multer` file upload handler for PDF, TXT, and DOCX documents.
   - `documentService.js` for text extraction (`pdf-parse`) and chunking with configurable chunk size (e.g. 500-1000 tokens) and overlap (e.g. 100 tokens).
2. **Vector Store & pgvector Engine:**
   - `vectorService.js`: Embedding generation, cosine similarity search query, and vector indexing.
   - Support for PostgreSQL with `pgvector` extension (with in-memory/embedded vector similarity fallback for zero-dependency local development).
3. **RAG Pipeline Engine:**
   - `ragService.js`: Similarity search $\rightarrow$ Context assembly $\rightarrow$ Grounded LLM prompting $\rightarrow$ Citation formatting $\rightarrow$ Unknown query threshold guard ("I am sorry, but this information is not found in the official college documents.").
4. **Chat & Conversation System:**
   - `Conversation.js` and `Message.js` database models storing user questions, LLM responses, sources, and timestamps.
   - `chatService.js`, `chatController.js`, `chatRoutes.js`.
5. **Frontend CollegeGPT Interfaces:**
   - **Student Chat Console (`/chat` or `/`):** Real-time conversational interface with message history, markdown rendering, clickable source references, and suggested query chips.
   - **Admin Document Manager (`/admin/documents`):** File upload dropzone, ingestion progress bar, chunk inspector, document status toggles, and deletion.
   - **Knowledge Base Viewer (`/knowledge`):** Public catalogue of indexed college documents (e.g. Course Catalogs, Academic Calendars, Campus Policies).

### D. What Should Be Removed Only If It Conflicts
- React Flow Canvas (`WorkflowCanvas`, `NodePalette`, `NodeConfigPanel`, `@xyflow/react`) and the 5 automation agents (`plannerAgent`, `executionAgent`, etc.) belong to Agentflow_AI.
- These can either be retired cleanly or isolated so they do not conflict with the CollegeGPT RAG core.

### E. Recommended Migration Strategy
1. **Step 1 (Models & Database):** Introduce `Document`, `DocumentChunk`, `Conversation`, and `Message` models, and set up `pgvector` / vector storage.
2. **Step 2 (Ingestion & Embedding):** Implement file upload, PDF text extraction, chunking, and embedding generation via Google Gemini / OpenAI embeddings.
3. **Step 3 (RAG Pipeline):** Implement similarity search, grounded context prompt builder, source citation extractor, and unknown-question guard.
4. **Step 4 (Chat API & Controller):** Expose `/api/chat/query`, `/api/chat/history`, `/api/documents/upload`, `/api/documents`.
5. **Step 5 (UI Transformation):** Build the CollegeGPT Student Chat UI with source citations, document upload portal, and admin management console.

---

> **Awaiting your approval before executing any code modifications.**
