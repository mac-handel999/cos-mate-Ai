-- =========================================================
-- COS MATE MEMORY + DOCUMENT ENHANCEMENT
-- Migration: 013_memory_enhancement.sql
-- Description: Extend existing schema for conversation memory,
--              document tracking, and attachment support
-- =========================================================

-- ---------------------------------------------------------
-- 1. USERS - Add missing columns
-- ---------------------------------------------------------

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS display_name TEXT;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS phone_number TEXT;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;


-- ---------------------------------------------------------
-- 2. CONVERSATIONS - Add missing columns
-- ---------------------------------------------------------

ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS title TEXT;

ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;

ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;


-- ---------------------------------------------------------
-- 3. MESSAGES - Add missing columns
-- ---------------------------------------------------------

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS platform_message_id TEXT;

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS sender_type TEXT;

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS token_count INTEGER;


-- ---------------------------------------------------------
-- 4. DOCUMENTS - Add missing columns
-- ---------------------------------------------------------

ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS file_hash TEXT;

ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS storage_bucket TEXT;

ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS storage_path TEXT;

ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS extracted_text TEXT;

ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS processing_status TEXT
DEFAULT 'pending';

ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS processing_error TEXT;

ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS page_count INTEGER;

ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS metadata JSONB
DEFAULT '{}'::jsonb;


-- ---------------------------------------------------------
-- 5. DOCUMENT CHUNKS - Add missing columns
-- ---------------------------------------------------------

ALTER TABLE public.document_chunks
ADD COLUMN IF NOT EXISTS chunk_index INTEGER;

ALTER TABLE public.document_chunks
ADD COLUMN IF NOT EXISTS page_number INTEGER;

ALTER TABLE public.document_chunks
ADD COLUMN IF NOT EXISTS token_count INTEGER;

ALTER TABLE public.document_chunks
ADD COLUMN IF NOT EXISTS metadata JSONB
DEFAULT '{}'::jsonb;


-- ---------------------------------------------------------
-- 6. MESSAGE ATTACHMENTS - New table
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    message_id UUID NOT NULL
        REFERENCES public.messages(id)
        ON DELETE CASCADE,

    document_id UUID
        REFERENCES public.documents(id)
        ON DELETE SET NULL,

    attachment_type TEXT NOT NULL,

    original_filename TEXT,

    mime_type TEXT,

    file_size BIGINT,

    file_hash TEXT,

    storage_bucket TEXT,

    storage_path TEXT,

    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ---------------------------------------------------------
-- 7. INDEXES
-- ---------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_users_telegram_user_id
    ON public.users(telegram_user_id);

CREATE INDEX IF NOT EXISTS idx_users_phone_number
    ON public.users(phone_number);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id
    ON public.conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message
    ON public.conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
    ON public.messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_created_at
    ON public.messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_documents_user_id
    ON public.documents(user_id);

CREATE INDEX IF NOT EXISTS idx_documents_file_hash
    ON public.documents(file_hash);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id
    ON public.document_chunks(document_id);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message
    ON public.message_attachments(message_id);

CREATE INDEX IF NOT EXISTS idx_message_attachments_document
    ON public.message_attachments(document_id);

CREATE INDEX IF NOT EXISTS idx_message_attachments_hash
    ON public.message_attachments(file_hash);


-- ---------------------------------------------------------
-- 8. UNIQUE DOCUMENT PER USER (content deduplication)
-- ---------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS
    idx_documents_user_hash
    ON public.documents(user_id, file_hash)
    WHERE file_hash IS NOT NULL;