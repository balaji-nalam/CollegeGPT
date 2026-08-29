-- ==========================================================
-- CollegeGPT — Complete PostgreSQL + pgvector Schema
-- ==========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Profiles Table (Students & Administrators)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    department VARCHAR(255) DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 2. Documents Table (Academic Handbooks, Syllabi, Policies)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    storage_provider VARCHAR(50) DEFAULT 'local',
    file_type VARCHAR(50) NOT NULL DEFAULT 'pdf',
    file_size INTEGER NOT NULL,
    total_pages INTEGER DEFAULT 1,
    total_chunks INTEGER DEFAULT 0,
    category VARCHAR(100) DEFAULT 'General',
    department VARCHAR(255) DEFAULT 'General',
    academic_year VARCHAR(50) DEFAULT '2025-2026',
    document_type VARCHAR(100) DEFAULT 'Handbook',
    status VARCHAR(50) NOT NULL DEFAULT 'UPLOADED' CHECK (status IN ('UPLOADED', 'PROCESSING', 'INDEXED', 'FAILED', 'ARCHIVED')),
    error_message TEXT,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_department ON documents(department);

-- 3. Document Versions Table
CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'UPLOADED' CHECK (status IN ('UPLOADED', 'PROCESSING', 'INDEXED', 'FAILED', 'ARCHIVED')),
    change_summary TEXT,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_versions_document_id ON document_versions(document_id);

-- 4. Document Chunks Table (Vector Store with strict EMBEDDING_DIMENSION)
-- Dimension placeholder is dynamically resolved during migration
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    version_id UUID REFERENCES document_versions(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    page_number INTEGER NOT NULL DEFAULT 1,
    embedding vector({{EMBEDDING_DIMENSION}}),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_chunks_version_id ON document_chunks(version_id);
CREATE INDEX IF NOT EXISTS idx_doc_chunks_page ON document_chunks(page_number);

-- HNSW Vector Cosine Index for Fast Similarity Search
CREATE INDEX IF NOT EXISTS document_chunks_embedding_cosine_idx 
ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- 5. Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);

-- 6. Messages Table (Question & Answer Pairs)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL CHECK (sender IN ('user', 'assistant')),
    content TEXT NOT NULL,
    is_fallback BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- 7. Message Sources Table (Grounding Citations & References)
CREATE TABLE IF NOT EXISTS message_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    chunk_id UUID REFERENCES document_chunks(id) ON DELETE SET NULL,
    document_title VARCHAR(255) NOT NULL,
    page_number INTEGER,
    similarity_score REAL NOT NULL,
    snippet TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_sources_message_id ON message_sources(message_id);

-- 8. Feedback Table (Response Evaluation)
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    rating VARCHAR(20) CHECK (rating IN ('helpful', 'unhelpful')),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_message_id ON feedback(message_id);
