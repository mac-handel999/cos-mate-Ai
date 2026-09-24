-- =========================================================
-- COS MATE DATABASE SCHEMA
-- Migration: 001_extensions.sql
-- Description: Enable required PostgreSQL extensions
-- =========================================================

-- Enable pgcrypto for UUID generation (usually already enabled)
create extension if not exists "pgcrypto";

-- Enable pgvector for future RAG/document search
-- This allows us to store embeddings and perform similarity search
create extension if not exists vector
with schema extensions;