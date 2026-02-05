-- ===========================================
-- PRACTICE QUESTIONS
-- ===========================================

-- Create practice_questions table
CREATE TABLE IF NOT EXISTS public.practice_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paragraph_id UUID REFERENCES public.paragraphs(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'input', 'drag_drop')),
    options JSONB, -- store MCQ options or Drag & Drop pairs
    correct_answer TEXT, -- for input check or MCQ index
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.practice_questions ENABLE ROW LEVEL SECURITY;

-- Practice questions policies
CREATE POLICY "Practice questions are viewable by everyone if public"
    ON public.practice_questions FOR SELECT
    USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Admins can manage practice questions"
    ON public.practice_questions FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ===========================================
-- SOCIAL & GAMIFICATION
-- ===========================================

-- Add social/gamification fields to profiles if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0;

-- Create friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, friend_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Friendships policies
CREATE POLICY "Users can view their own friendships"
    ON public.friendships FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can manage their own friendship requests"
    ON public.friendships FOR ALL
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- ===========================================
-- QUIZ UPDATES
-- ===========================================
-- Ensure quizzes table has type if not exists
ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS quiz_type TEXT DEFAULT 'quiz';
