-- ==============================================================================
-- FINAL SUPABASE FIX: RLS Policies for 'documents' table
-- ==============================================================================
-- Run this script ONLY if you encounter "permission denied" errors when creating/editing documents.
-- This updates the Row Level Security (RLS) policies to reference 'user_id' instead of 'created_by'.
-- ==============================================================================

-- 1. Create replacement policies using 'user_id'
-- Insert: allow users to insert when auth.uid() = user_id and paragraph owner matches
CREATE POLICY documents_insert_v2 ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = user_id)
    AND EXISTS (
      SELECT 1
      FROM paragraphs
      JOIN units ON units.id = paragraphs.unit_id
      JOIN subjects ON subjects.id = units.subject_id
      WHERE paragraphs.id = documents.paragraph_id
        AND subjects.user_id = auth.uid()
    )
  );

-- Update: allow owners or admins to update
CREATE POLICY documents_update_v2 ON public.documents
  FOR UPDATE TO authenticated
  USING (
    (auth.uid() = user_id)
    OR (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
      )
    )
  );

-- Delete: allow owners to delete their documents unless is_admin_created, or admin role
CREATE POLICY documents_delete_v2 ON public.documents
  FOR DELETE TO authenticated
  USING (
    (
      (auth.uid() = user_id) AND (NOT is_admin_created)
    ) OR (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
      )
    )
  );

-- 2. Drop old policies that reference 'created_by'
DROP POLICY IF EXISTS documents_insert ON public.documents;
DROP POLICY IF EXISTS documents_update ON public.documents;
DROP POLICY IF EXISTS documents_delete ON public.documents;

-- 3. Rename new policies to original names
ALTER POLICY documents_insert_v2 ON public.documents RENAME TO documents_insert;
ALTER POLICY documents_update_v2 ON public.documents RENAME TO documents_update;
ALTER POLICY documents_delete_v2 ON public.documents RENAME TO documents_delete;

-- 4. Final Cleanup: Drop the legacy column if it still exists
ALTER TABLE public.documents DROP COLUMN IF EXISTS created_by;
