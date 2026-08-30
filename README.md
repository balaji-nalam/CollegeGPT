# CollegeGPT

## 1. Project Name

CollegeGPT - RAG-Based College Information Assistant

## 2. Problem Statement

Students often need information about college academics, policies, learning materials, attendance rules, and experiential learning content. That information may be distributed across several documents and difficult to search manually.

CollegeGPT addresses this problem with a grounded Retrieval-Augmented Generation (RAG) architecture. Administrators can index official college documents, and authenticated users can ask natural-language questions answered from the retrieved document context with page-level source citations.

## 3. Features

- AI-powered college information assistant
- RAG-based question answering over indexed documents
- PostgreSQL with pgvector similarity retrieval
- Grounded answers with page-level source citations
- Multi-document knowledge base
- Semantic retrieval and relevance filtering
- Out-of-knowledge-base refusal instead of fabricated answers
- JWT authentication and protected chat API
- Student registration with protected administrative provisioning
- Conversation history and per-user conversation access control
- Responsive Next.js interface
- Document upload, processing, indexing, status, reprocessing, and deletion
- Admin document management
- Markdown and code response rendering
- Citation and source inspector in the chat experience
- Prompt-injection defense testing

Potential future ideas are listed separately in Section 15 and are not represented as implemented features.

## 4. Technology Stack

### Frontend

- Next.js 14
- React 18
- Tailwind CSS
- Axios
- Zustand
- Lucide React
- Socket.IO client
- React Flow (`@xyflow/react`)

### Backend

- Node.js
- Express.js
- JSON Web Tokens (`jsonwebtoken`)
- `bcryptjs`
- `express-validator`
- Multer for file uploads
- Helmet, CORS, compression, and Morgan
- Socket.IO

### Database and Storage

- PostgreSQL
- Supabase PostgreSQL and Storage configuration
- pgvector for embedding similarity search

### AI

- Google Gemini for grounded answer generation
- Google `text-embedding-004` for 768-dimensional embeddings
- Optional OpenRouter configuration supported by the backend service

## 5. RAG Architecture

```text
User Question
      |
Authentication
      |
Query Processing
      |
Embedding Generation
      |
pgvector Similarity Search
      |
Relevance Filtering
      |
Context Construction
      |
Grounded LLM Response
      |
Page-level Citations
```

Documents are uploaded and processed page by page. Extracted text is chunked, embedded, and stored with document and page metadata. An authenticated question is embedded and compared with indexed chunks. Relevant chunks are assembled into bounded context for the language model, and the response includes the retrieved source metadata.

When relevant information cannot be found in the college knowledge base, the system is designed to refuse the request rather than invent an answer.

## 6. Knowledge Base

The following documents were present in the live verification database at the time of testing:

- `WEEK - 1 EXPERIENTIAL LEARNING`
- `Official Academic Handbook 2026`

The database connection and document contents are environment-specific and are not included in this repository documentation.

## 7. Screenshots

Add project screenshots to a submission media folder when available:

- Login Page
- CollegeGPT Chat Interface
- Grounded Answer with Citations
- Experiential Learning Query
- Document Management
- Dashboard

No screenshot files are fabricated or referenced here because none were found in the repository during preparation.

## 8. Live Demo

Frontend: https://college-gpt-seven.vercel.app/

Backend: https://collegegpt-11xi.onrender.com

## 9. Backend

The backend is an Express API in `server/`. Authentication routes provide student registration, login, and the authenticated profile endpoint. Protected routes require a JWT bearer token. Administrative document operations require the appropriate role, while chat and conversation routes require authentication.

The chat endpoint is `POST /api/chat`. It receives a question and optionally a conversation ID, executes the existing RAG pipeline, persists the exchange, and returns the answer, support decision, and source records. The complete endpoint list is documented in [API.md](API.md).

## 10. Setup Instructions

### Prerequisites

- Node.js 18 or newer
- A PostgreSQL database with pgvector for persistent vector retrieval
- Credentials for the configured AI and storage providers

### 1. Clone the repository

```bat
git clone <repository-url>
cd "project AI"
```

### 2. Install frontend dependencies

```bat
cd client
npm install
```

### 3. Install backend dependencies

```bat
cd ..\server
npm install
```

### 4. Configure environment variables

From the repository root, copy the template and provide your own values:

```bat
copy .env.example server\.env
```

The backend loads `server/.env`. Set the database, JWT, administrator, AI, and storage values required for the environment. Do not commit the resulting `.env` file.

### 5. Start the backend

```bat
cd server
npm run dev
```

The backend defaults to port `5000`.

### 6. Start the frontend

In a second terminal:

```bat
cd client
npm run dev
```

The frontend defaults to port `3000`. The available package scripts are `dev`, `build`, `start`, and `lint` in `client/package.json`; the backend scripts are listed in `server/package.json`.

## 11. Environment Variables

Copy `.env.example` to `server/.env` and provide environment-specific values. Variable names used by the project are:

```text
NODE_ENV
PORT
CLIENT_URL
DATABASE_URL
JWT_SECRET
JWT_EXPIRES_IN
ADMIN_NAME
ADMIN_EMAIL
ADMIN_PASSWORD
EMBEDDING_PROVIDER
EMBEDDING_MODEL
EMBEDDING_DIMENSION
CHUNK_SIZE
CHUNK_OVERLAP
MAX_FILE_SIZE_MB
TOP_K
SIMILARITY_THRESHOLD
MAX_CONTEXT_CHARS
GEMINI_API_KEY
OPENROUTER_API_KEY
STORAGE_PROVIDER
UPLOAD_DIR
SUPABASE_URL
SUPABASE_KEY
SUPABASE_BUCKET
NEXT_PUBLIC_API_URL
```

No secret values belong in `.env.example` or in source control.

## 12. Testing & Verification

The completed verification included:

- Frontend production build passed
- Administrator authentication verified
- Protected API access verified
- Live `POST /api/chat` RAG requests verified
- Grounded citations and page metadata verified
- Out-of-knowledge-base refusal verified
- Prompt-injection test verified with no secret disclosure
- Phase 4: 30/30 tests passed
- Phase 5: all production-readiness tests passed

## 13. Project Structure

```text
project AI/
|-- client/
|   |-- package.json
|   `-- src/
|-- server/
|   |-- package.json
|   `-- src/
|-- API.md
|-- ARCHITECTURE.md
|-- DEPLOYMENT.md
|-- PROJECT_AUDIT.md
|-- README.md
|-- specs.md
|-- .env.example
`-- .gitignore
```

`client/` contains the Next.js frontend and user interface. `server/` contains the Express API, authentication, document processing, vector retrieval, RAG services, and database integration.

## 14. Security

- Secrets are supplied through environment variables.
- Local `.env` files are excluded from Git.
- JWT authentication protects private routes.
- Administrative document operations use role protection.
- Conversation access is checked against the authenticated user.
- Prompt-injection and unsupported-question behavior were tested through the live API.
- Credentials and access tokens are not committed to the repository.

## Instructor / Admin Demo

CollegeGPT includes an administrator account for demonstrating the complete document-management and RAG workflow.

### Admin Capabilities

The instructor or administrator can:

- Log in securely using administrator authentication.
- Access the admin document management area.
- Upload college knowledge documents such as PDFs.
- Process documents for the RAG knowledge base.
- Manage the documents used by CollegeGPT.
- Ask questions through the CollegeGPT chat interface.
- Verify that answers are grounded in uploaded college documents.
- View source and page citations associated with retrieved information.
- Test questions outside the knowledge base and verify that CollegeGPT refuses to invent an answer.
- Test prompt-injection attempts and verify that sensitive credentials and system secrets are not disclosed.

### How the System Works

1. The administrator logs in through the frontend.
2. Authentication is handled by the backend using JWT and bcrypt.
3. The administrator uploads a college document.
4. The backend processes the document and extracts its content.
5. The document is divided into chunks.
6. Gemini generates embeddings for the document chunks.
7. The embeddings are stored in PostgreSQL with pgvector.
8. When a student asks a question, the backend generates an embedding for the query.
9. pgvector performs semantic similarity search against the stored document chunks.
10. Relevant chunks are retrieved and passed as context to the AI model.
11. Gemini generates a grounded response using the retrieved context.
12. CollegeGPT returns source and page citations so the user can verify the answer.
13. If relevant information cannot be found in the knowledge base, CollegeGPT returns a refusal instead of making up an answer.

### RAG Architecture

```text
User
      |
      v
CollegeGPT Frontend
      |
      v
Backend API
      |
      +--> Authentication (JWT + bcrypt)
      |
      +--> Query Embedding (Gemini)
      |
      +--> PostgreSQL + pgvector
      |        |
      |        +--> Semantic Retrieval
      |
      +--> Retrieved Context
                               |
                               v
                   Gemini LLM
                               |
                               v
       Grounded Answer
                               |
                               v
             Source Citations
```

### What the Instructor Can Demonstrate

1. Open the live CollegeGPT application.
2. Log in with the provided administrator credentials.
3. Open the admin document management page.
4. Upload a knowledge-base PDF.
5. Allow the document to be processed and indexed.
6. Open the chat.
7. Ask a question whose answer exists in the uploaded document.
8. Verify the grounded response and source citation.
9. Ask a question unrelated to the uploaded knowledge base.
10. Verify that CollegeGPT responds that the information is unavailable rather than hallucinating.
11. Test a prompt-injection question and verify that credentials and secrets are not disclosed.

### Demo Credentials

Admin Email: `admin@college.edu`

Admin Password: Provided separately to the instructor.

> For security, the administrator password is intentionally not stored in this public GitHub repository. The instructor can receive the demo password separately.

### Project Implementation

#### Frontend

- Next.js / React
- Authentication UI
- Dashboard
- Chat interface
- Admin document management
- Settings
- Responsive UI

#### Backend

- Node.js
- Express.js
- JWT authentication
- bcrypt password hashing
- REST API
- Document processing
- RAG pipeline
- Vector retrieval

#### AI

- Google Gemini
- Text embeddings
- LLM-based grounded answer generation

#### Data

- Supabase PostgreSQL
- pgvector
- Supabase Storage

#### Deployment

- GitHub
- Vercel frontend
- Render backend
- Supabase database and storage

### Live Deployment

Frontend: https://college-gpt-seven.vercel.app/

Backend: https://collegegpt-11xi.onrender.com

Health: https://collegegpt-11xi.onrender.com/api/health

GitHub: https://github.com/balaji-nalam/CollegeGPT

## 15. Future Improvements

- Deploy the frontend and backend with production-managed environment variables.
- Add automated CI checks for builds, tests, and secret scanning.
- Add a curated screenshot set and a hosted demo link for submission.
- Expand document administration and observability as the knowledge base grows.
