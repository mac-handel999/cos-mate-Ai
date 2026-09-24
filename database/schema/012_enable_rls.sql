-- =========================================================
-- COS MATE DATABASE SCHEMA
-- Migration: 012_enable_rls.sql
-- Description: Enable Row Level Security on all tables
-- Note: Our backend uses service credentials that bypass RLS.
--       This is for defense-in-depth and future web client access.
-- =========================================================

alter table public.universities enable row level security;
alter table public.users enable row level security;
alter table public.courses enable row level security;
alter table public.user_courses enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.usage_events enable row level security;