-- =========================================================
-- COS MATE DATABASE SCHEMA
-- Migration: 005_conversations.sql
-- Description: Create conversations table
-- Each conversation represents a chat session on a platform
-- =========================================================

create table if not exists public.conversations (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null references public.users(id)
        on delete cascade,

    platform text not null,

    external_chat_id text,

    title text,

    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint conversations_platform_check
        check (
            platform in (
                'telegram',
                'whatsapp',
                'web'
            )
        )
);

-- Indexes
create index if not exists idx_conversations_user_id
    on public.conversations(user_id);

create index if not exists idx_conversations_platform
    on public.conversations(platform);

create index if not exists idx_conversations_external_chat_id
    on public.conversations(external_chat_id);