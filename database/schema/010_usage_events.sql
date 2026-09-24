-- =========================================================
-- COS MATE DATABASE SCHEMA
-- Migration: 010_usage_events.sql
-- Description: Create usage_events table for tracking AI usage
-- =========================================================

create table if not exists public.usage_events (
    id uuid primary key default gen_random_uuid(),

    user_id uuid references public.users(id)
        on delete set null,

    platform text,

    event_type text not null,

    model text,

    input_tokens integer,
    output_tokens integer,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_usage_events_user_id
    on public.usage_events(user_id);

create index if not exists idx_usage_events_event_type
    on public.usage_events(event_type);

create index if not exists idx_usage_events_created_at
    on public.usage_events(created_at);