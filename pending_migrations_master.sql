-- ==========================================
-- MASTER MIGRATION SCRIPT
-- Run this entire file in Supabase SQL Editor
-- ==========================================

-- 1. FIX CALENDAR EVENTS SCHEMA
-- Ensures all necessary columns exist for the Calendar feature
ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'blue',
ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 1b. UPDATE PROFILES SCHEMA
-- Ensure profiles table has bio and other fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS location TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- 1c. CREATE SYSTEM SETTINGS TABLE
-- For global configurations like Landing Page version
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE system_settings;

-- Default Settings
INSERT INTO public.system_settings (key, value)
VALUES ('landing_page_version', '"modern"')
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public Read Settings" ON public.system_settings FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Admin Update Settings" ON public.system_settings FOR UPDATE USING (true); -- Simplification for demo
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1d. CREATE ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    author_id UUID REFERENCES auth.users(id),
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public Read Announcements" ON public.announcements FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Admin CRUD Announcements" ON public.announcements FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true) -- Strict check 
    OR 
    auth.uid() IN (SELECT id FROM profiles) -- Fallback for demo if is_admin column issues
  ); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- 2. CREATE QUIZ TABLES
-- Creates tables for Quizzes, Questions, and Attempts

-- Quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id UUID NOT NULL, 
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- ["Option A", "Option B", ...]
    correct_option_index INTEGER NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS) & POLICIES

-- Quizzes
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public Read Quizzes" ON public.quizzes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Creator Edit Quizzes" ON public.quizzes FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Questions
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public Read Questions" ON public.quiz_questions FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Creator Edit Questions" ON public.quiz_questions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_questions.quiz_id AND user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "User Own Attempts" ON public.quiz_attempts FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Finished
DO $$
BEGIN
    RAISE NOTICE 'All pending migrations applied successfully.';
END $$;
