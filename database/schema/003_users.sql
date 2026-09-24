-- =========================================================
-- COS MATE DATABASE SCHEMA
-- Migration: 003_users.sql
-- Description: Create users table for COS MATE users
-- Supports Telegram, WhatsApp, and web authentication
-- =========================================================

create table if not exists public.users (
    id uuid primary key default gen_random_uuid(),

    -- Supabase Auth user ID when web authentication is introduced
    auth_user_id uuid unique references auth.users(id)
        on delete set null,

    -- Telegram identity
    telegram_user_id bigint unique,
    telegram_username text,
    telegram_first_name text,
    telegram_last_name text,

    -- WhatsApp identity
    whatsapp_user_id text unique,

    -- Academic information
    university_id uuid references public.universities(id)
        on delete set null,

    department text,
    level integer,

    -- Preferences
    language text default 'en',

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint users_level_check
        check (level is null or level between 1 and 10)
);

-- Indexes
create index if not exists idx_users_telegram_user_id
    on public.users(telegram_user_id);

create index if not exists idx_users_whatsapp_user_id
    on public.users(whatsapp_user_id);

create index if not exists idx_users_auth_user_id
    on public.users(auth_user_id);