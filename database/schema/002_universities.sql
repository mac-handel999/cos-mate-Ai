-- =========================================================
-- COS MATE DATABASE SCHEMA
-- Migration: 002_universities.sql
-- Description: Create universities table for Nigerian universities
-- =========================================================

create table if not exists public.universities (
    id uuid primary key default gen_random_uuid(),

    name text not null,
    short_name text,

    country text not null default 'Nigeria',

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Index for faster lookups
create index if not exists idx_universities_name
    on public.universities(name);