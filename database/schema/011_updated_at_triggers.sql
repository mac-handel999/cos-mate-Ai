-- =========================================================
-- COS MATE DATABASE SCHEMA
-- Migration: 011_updated_at_triggers.sql
-- Description: Auto-update updated_at timestamp on row updates
-- =========================================================

-- Function to set updated_at to current timestamp
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- Apply trigger to all tables with updated_at column
create or replace trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

create or replace trigger universities_set_updated_at
before update on public.universities
for each row
execute function public.set_updated_at();

create or replace trigger courses_set_updated_at
before update on public.courses
for each row
execute function public.set_updated_at();

create or replace trigger conversations_set_updated_at
before update on public.conversations
for each row
execute function public.set_updated_at();

create or replace trigger documents_set_updated_at
before update on public.documents
for each row
execute function public.set_updated_at();