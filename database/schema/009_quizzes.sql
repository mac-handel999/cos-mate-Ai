-- =========================================================
-- COS MATE DATABASE SCHEMA
-- Migration: 009_quizzes.sql
-- Description: Create quizzes, quiz_questions, quiz_attempts, quiz_answers
-- =========================================================

-- Quizzes generated from documents or course materials
create table if not exists public.quizzes (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null references public.users(id)
        on delete cascade,

    course_id uuid references public.courses(id)
        on delete set null,

    document_id uuid references public.documents(id)
        on delete set null,

    title text not null,

    description text,

    difficulty text,

    question_count integer not null default 0,

    time_limit_seconds integer,

    source_type text not null default 'ai',

    created_at timestamptz not null default now(),

    constraint quizzes_difficulty_check
        check (
            difficulty is null
            or difficulty in (
                'easy',
                'medium',
                'hard',
                'mixed'
            )
        ),

    constraint quizzes_source_type_check
        check (
            source_type in (
                'ai',
                'document',
                'course',
                'manual'
            )
        )
);

-- Individual questions within a quiz
create table if not exists public.quiz_questions (
    id uuid primary key default gen_random_uuid(),

    quiz_id uuid not null references public.quizzes(id)
        on delete cascade,

    question_number integer not null,

    question_text text not null,

    options jsonb not null,

    correct_answer integer not null,

    explanation text,

    difficulty text,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),

    unique (quiz_id, question_number),

    constraint quiz_questions_correct_answer_check
        check (correct_answer >= 0)
);

-- Quiz attempts by users
create table if not exists public.quiz_attempts (
    id uuid primary key default gen_random_uuid(),

    quiz_id uuid not null references public.quizzes(id)
        on delete cascade,

    user_id uuid not null references public.users(id)
        on delete cascade,

    score integer not null default 0,

    total_questions integer not null default 0,

    percentage numeric(5,2),

    started_at timestamptz not null default now(),

    completed_at timestamptz,

    time_taken_seconds integer,

    status text not null default 'in_progress',

    constraint quiz_attempts_status_check
        check (
            status in (
                'in_progress',
                'completed',
                'abandoned'
            )
        )
);

-- Individual answers within a quiz attempt
create table if not exists public.quiz_answers (
    id uuid primary key default gen_random_uuid(),

    attempt_id uuid not null references public.quiz_attempts(id)
        on delete cascade,

    question_id uuid not null references public.quiz_questions(id)
        on delete cascade,

    selected_answer integer,

    is_correct boolean,

    answered_at timestamptz not null default now(),

    unique (attempt_id, question_id)
);

-- Indexes
create index if not exists idx_quizzes_user_id
    on public.quizzes(user_id);

create index if not exists idx_quizzes_document_id
    on public.quizzes(document_id);

create index if not exists idx_quiz_questions_quiz_id
    on public.quiz_questions(quiz_id);

create index if not exists idx_quiz_attempts_user_id
    on public.quiz_attempts(user_id);

create index if not exists idx_quiz_attempts_quiz_id
    on public.quiz_attempts(quiz_id);

create index if not exists idx_quiz_answers_attempt_id
    on public.quiz_answers(attempt_id);