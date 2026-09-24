-- =========================================================
-- COS MATE DATABASE SCHEMA
-- Migration: 007_documents.sql
-- Description: Create documents table
-- Stores uploaded study materials (PDFs, notes, etc.)
-- =========================================================

create table if not exists public.documents (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null references public.users(id)
        on delete cascade,

    conversation_id uuid references public.conversations(id)
        on delete set null,

    course_id uuid references public.courses(id)
        on delete set null,

    name text not null,

    original_filename text,

    mime_type text,

    file_size bigint,

    storage_path text,

    status text not null default 'uploaded',

    extracted_text text,

    page_count integer,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint documents_status_check
        check (
            status in (
                'uploaded',
                'processing',
                'processed',
                'failed'
            )
        )
);

-- Indexes
create index if not exists idx_documents_user_id
    on public.documents(user_id);

create index if not exists idx_documents_course_id
    on public.documents(course_id);

create index if not exists idx_documents_status
    on public.documents(status);