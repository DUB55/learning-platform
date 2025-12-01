-- Drop the check constraint on tasks.type to allow custom categories
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_type_check;

-- Add position column for drag and drop ordering
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
