-- Migration: StudyGo Importer Support
-- Created: 2026-01-24

-- 1. Create Books table
CREATE TABLE IF NOT EXISTS public.books (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    author TEXT,
    publisher TEXT,
    source_id TEXT UNIQUE, -- StudyGo bookId
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add source_id for idempotency to existing tables
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS source_id TEXT UNIQUE;
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS source_id TEXT UNIQUE;
ALTER TABLE public.paragraphs ADD COLUMN IF NOT EXISTS source_id TEXT UNIQUE;
ALTER TABLE public.leersets ADD COLUMN IF NOT EXISTS source_id TEXT UNIQUE;
ALTER TABLE public.leerset_items ADD COLUMN IF NOT EXISTS source_id TEXT UNIQUE;
ALTER TABLE public.practice_questions ADD COLUMN IF NOT EXISTS source_id TEXT UNIQUE;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS source_id TEXT UNIQUE;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS source_id TEXT UNIQUE;

-- 3. Add source_path to documents/resources for assets tracking
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS source_path TEXT;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS source_path TEXT;

-- 4. Enable RLS for books
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- 5. Books policies
CREATE POLICY "Users can view books of own subjects."
  ON books FOR SELECT
  USING ( EXISTS ( SELECT 1 FROM subjects WHERE id = books.subject_id AND user_id = auth.uid() ) );

CREATE POLICY "Users can manage books for own subjects."
  ON books FOR ALL
  USING ( EXISTS ( SELECT 1 FROM subjects WHERE id = books.subject_id AND user_id = auth.uid() ) );

-- 6. Add trigger for updated_at on books
CREATE OR REPLACE FUNCTION update_books_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_books_updated_at ON books;
CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION update_books_updated_at();
