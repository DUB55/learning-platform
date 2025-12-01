-- Fix documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'text';

-- Ensure content column can hold large data (JSONB is standard for Supabase rich text)
-- If it's already JSONB, this does nothing. If it's something else, we might need to cast.
-- Assuming it's JSONB based on previous code usage.

-- Add more admin settings
INSERT INTO admin_permission_settings (category, subcategory, setting_key, setting_name, setting_description, setting_type, default_value, order_index)
VALUES 
('ui', NULL, 'ui.sidebar_default_state', 'Default Sidebar State', 'Whether the sidebar is expanded or collapsed by default', 'enum', 'expanded', 20),
('ui', NULL, 'ui.theme_color', 'Primary Theme Color', 'Main accent color for the application', 'enum', 'blue', 30),
('study_modes', NULL, 'study.flashcard_timer', 'Flashcard Timer', 'Default timer for flashcard review (seconds)', 'number', '0', 10),
('study_modes', NULL, 'study.quiz_passing_score', 'Quiz Passing Score', 'Minimum percentage to pass a quiz', 'number', '70', 20),
('library', NULL, 'library.allow_public_sharing', 'Allow Public Sharing', 'Allow users to share resources publicly', 'boolean', 'true', 10),
('library', NULL, 'library.max_upload_size', 'Max Upload Size (MB)', 'Maximum file size for uploads', 'number', '10', 20)
ON CONFLICT (setting_key) DO NOTHING;
