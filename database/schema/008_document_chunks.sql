-- =========================================================
-- COS MATE DATABASE SCHEMA
-- Migration: 008_document_chunks.sql
-- Description: Create document_chunks table
-- Stores text chunks from documents with embeddings for RAG
-- =========================================================

create table if not exists public.document_chunks (
    id uuid primary key default gen_random_uuid(),

    document_id uuid not null references public.documents(id)
        on delete cascade,

    chunk_index integer not null,

    content text not null,

    page_number integer,

    token_count integer,

    -- Embedding vector (1536 dimensions for OpenAI embeddings)
    -- We'll determine the exact dimension when choosing the embedding model
    embedding extensions.vector(1536),

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),

    unique (document_id, chunk_index)
);

-- Indexes
create index if not exists idx_document_chunks_document_id
    on public.document_chunks(document_id);

-- HNSW index for vector similarity search (will be added after choosing embedding model)
-- create index if not exists idx_document_chunks_embedding
--     on public.document_chunks using hnsw (embedding vector_l2_ops);