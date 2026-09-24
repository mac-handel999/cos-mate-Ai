# COS MATE Database Schema

This folder contains the SQL migration files for the COS MATE database.

## How to Apply

Go to your Supabase project → SQL Editor → New query

Then copy and paste the contents of each file in order:

1. `001_extensions.sql` - Enable pgcrypto and pgvector extensions
2. `002_universities.sql` - Create universities table
3. `003_users.sql` - Create users table
4. `004_courses.sql` - Create courses and user_courses tables
5. `005_conversations.sql` - Create conversations table
6. `006_messages.sql` - Create messages table
7. `007_documents.sql` - Create documents table
8. `008_document_chunks.sql` - Create document_chunks table with vector support
9. `009_quizzes.sql` - Create quizzes, quiz_questions, quiz_attempts, quiz_answers tables
10. `010_usage_events.sql` - Create usage_events table
11. `011_updated_at_triggers.sql` - Auto-update timestamps
12. `012_enable_rls.sql` - Enable Row Level Security

## Schema Overview

```
users
 ├── conversations
 │      │
 │      └── messages
 │
 ├── documents
 │      │
 │      └── document_chunks
 │                  │
 │                  └── embeddings (vector)
 │
 ├── courses
 │
 └── quizzes
        │
        ├── quiz_questions
        │
        └── quiz_attempts
                 │
                 └── quiz_answers
```

## Notes

- All tables use UUID primary keys
- `document_chunks.embedding` uses `vector(1536)` - adjust if using a different embedding model
- Row Level Security is enabled but our backend uses service credentials that bypass RLS
- The HNSW vector index is commented out in `008_document_chunks.sql` - enable it after choosing your embedding model