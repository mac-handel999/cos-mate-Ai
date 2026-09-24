-- =========================================================
-- COS MATE DATABASE SCHEMA
-- Migration: 006_messages.sql
-- Description: Create messages table
-- Stores all chat messages (user and assistant)
-- =========================================================

create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),

    conversation_id uuid not null references public.conversations(id)
        on delete cascade,

    user_id uuid references public.users(id)
        on delete set null,

    role text not null,

    content text,

    message_type text not null default 'text',

    platform text,

    external_message_id text,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),

    constraint messages_role_check
        check (
            role in (
                'user',
                'assistant',
                'system'
            )
        ),

    constraint messages_type_check
        check (
            message_type in (
                'text',
                'image',
                'document',
                'audio',
                'video',
                'sticker',
                'other'
            )
        )
);

-- Indexes
create index if not exists idx_messages_conversation_id
    on public.messages(conversation_id);

create index if not exists idx_messages_created_at
    on public.messages(created_at);

create index if not exists idx_messages_role
    on public.messages(role);