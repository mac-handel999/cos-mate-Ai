-- =========================================================
-- COS MATE DATABASE SCHEMA
-- Migration: 004_courses.sql
-- Description: Create courses and user_courses tables
-- =========================================================

-- Courses offered by universities
create table if not exists public.courses (
    id uuid primary key default gen_random_uuid(),

    university_id uuid references public.universities(id)
        on delete cascade,

    code text,
    name text not null,

    description text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Many-to-many relationship: which courses each user is taking
create table if not exists public.user_courses (
    user_id uuid not null references public.users(id)
        on delete cascade,

    course_id uuid not null references public.courses(id)
        on delete cascade,

    created_at timestamptz not null default now(),

    primary key (user_id, course_id)
);

-- Indexes
create index if not exists idx_courses_university_id
    on public.courses(university_id);

create index if not exists idx_user_courses_user_id
    on public.user_courses(user_id);

create index if not exists idx_user_courses_course_id
    on public.user_courses(course_id);