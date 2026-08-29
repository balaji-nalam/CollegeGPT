# CollegeGPT — Production Deployment Guide

This guide provides end-to-end instructions for deploying CollegeGPT to production using **Supabase** (PostgreSQL + pgvector + Object Storage), **Render** (Node.js Backend), and **Vercel** (Next.js Frontend).

---

## 1. Database & Storage Setup (Supabase)

### Step 1.1: Create a Supabase Project
1. Navigate to [Supabase](https://supabase.com) and create a new project.
2. Note your database connection string and password.

### Step 1.2: Enable `pgvector` & Run Migrations
1. In the Supabase dashboard, go to **SQL Editor**.
2. Open [server/src/database/schema.sql](file:///c:/Users/nalam/Desktop/project%20AI/server/src/database/schema.sql) from this repository.
3. Paste the complete SQL script into the SQL Editor and click **Run**.
4. Verify all 8 tables (`profiles`, `documents`, `document_versions`, `document_chunks`, `conversations`, `messages`, `message_sources`, `feedback`) and the HNSW vector index were created.

### Step 1.3: Create Storage Bucket
1. Go to **Storage** in the Supabase dashboard.
2. Click **New Bucket**.
3. Name the bucket: `collegegpt-documents`.
4. Set the bucket to **Private** (documents are served securely via server-signed routes only).

---

## 2. Backend Deployment (Render)

### Step 2.1: Create Web Service on Render
1. Connect your GitHub repository to Render.
2. Select **Web Service**.
3. Configure the service:
   - **Name:** `collegegpt-api`
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Starter or Standard (recommended for PDF processing)

### Step 2.2: Set Environment Variables
In the Render dashboard under **Environment**, add the following:

| Key | Value / Instructions |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `CLIENT_URL` | `https://collegegpt.vercel.app` *(Your Vercel frontend URL)* |
| `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres` |
| `JWT_SECRET` | `[Generate a random 64-character string]` |
| `JWT_EXPIRES_IN` | `7d` |
| `ADMIN_NAME` | `"College Administrator"` |
| `ADMIN_EMAIL` | `admin@college.edu` |
| `ADMIN_PASSWORD` | `[StrongAdminPassword2026!]` |
| `EMBEDDING_PROVIDER` | `google` |
| `EMBEDDING_MODEL` | `text-embedding-004` |
| `EMBEDDING_DIMENSION` | `768` |
| `TOP_K` | `5` |
| `SIMILARITY_THRESHOLD` | `0.15` |
| `MAX_CONTEXT_CHARS` | `4000` |
| `GEMINI_API_KEY` | `[Your Google Gemini API Key]` |
| `STORAGE_PROVIDER` | `supabase` |
| `SUPABASE_URL` | `https://[YOUR-PROJECT].supabase.co` |
| `SUPABASE_KEY` | `[Your Supabase service_role secret key]` |
| `SUPABASE_BUCKET` | `collegegpt-documents` |

### Step 2.3: Verify Backend Health
Once deployed, make a GET request to:
`https://collegegpt-api.onrender.com/api/health`

Verify the response shows:
- `databaseBackend: "postgresql"`
- `vectorBackend.pgvectorAvailable: true`
- `storage.provider: "supabase"`

---

## 3. Frontend Deployment (Vercel)

### Step 3.1: Import Project to Vercel
1. Navigate to [Vercel](https://vercel.com) and import the repository.
2. Set **Root Directory** to `client`.
3. Framework Preset will automatically detect **Next.js**.

### Step 3.2: Configure Environment Variables
Add the following variable in Vercel settings:

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://collegegpt-api.onrender.com/api` |

### Step 3.3: Deploy & Verify
1. Click **Deploy**.
2. Once deployed, open the Vercel URL.
3. Log in with the provisioned administrator credentials (`admin@college.edu` / your password).
4. Upload an academic PDF handbook in `/admin/documents`.
5. Log out and register a student account.
6. Submit a question in the student chat portal and verify grounded answers and clickable source citations.

---

## 4. Re-Indexing & Model Migration Strategy

If the production embedding model is changed in the future (e.g. from 768-dim to 1536-dim):

1. **Do not alter the existing table in-place:** This prevents downtime or knowledge base corruption.
2. **Execute migration:** Create a new column or table `document_chunks_v2` with `vector(NEW_DIM)`.
3. **Run background re-indexing job:** Re-extract text from stored PDFs and generate vectors using the new model.
4. **Validate vector integrity:** Ensure all active documents have complete chunks and dimensions.
5. **Switch retrieval pointer:** Update `EMBEDDING_MODEL` and `EMBEDDING_DIMENSION` environment variables.
6. **Purge legacy chunks:** Drop the old table/column once the new vectors are verified.
