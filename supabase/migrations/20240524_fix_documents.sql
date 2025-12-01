-- Fix documents table schema to match frontend expectations
-- Add missing columns and update RLS policies

-- Add user_id column to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Add elements column for rich content (used by document editor)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS elements JSONB DEFAULT '[]'::jsonb;

-- Add type column (separate from document_type for compatibility)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS type TEXT;

-- Update existing documents to have user_id from paragraph ownership
UPDATE documents SET user_id = (
    SELECT subjects.user_id 
    FROM paragraphs
    JOIN units ON units.id = paragraphs.unit_id
    JOIN subjects ON subjects.id = units.subject_id
    WHERE paragraphs.id = documents.paragraph_id
) WHERE user_id IS NULL;

-- Make user_id NOT NULL after populating
ALTER TABLE documents ALTER COLUMN user_id SET NOT NULL;

-- Update RLS policies to include user_id checks
DROP POLICY IF EXISTS "Users can insert documents in own paragraphs." ON documents;
CREATE POLICY "Users can insert documents in own paragraphs."
ON documents FOR INSERT
WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM paragraphs
        JOIN units ON units.id = paragraphs.unit_id
        JOIN subjects ON subjects.id = units.subject_id
        WHERE paragraphs.id = documents.paragraph_id AND subjects.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can update documents in own paragraphs." ON documents;
CREATE POLICY "Users can update documents in own paragraphs."
ON documents FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete documents in own paragraphs." ON documents;
CREATE POLICY "Users can delete documents in own paragraphs."
ON documents FOR DELETE
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
