-- ===========================================
-- PHASE 1: Fix Documents Table
-- ===========================================

-- Add missing columns to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'rich_text';

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS elements JSONB DEFAULT '[]'::jsonb;

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text';

-- Add constraint to validate document_type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'documents_type_check'
    ) THEN
        ALTER TABLE documents
        ADD CONSTRAINT documents_type_check 
        CHECK (document_type IN ('rich_text', 'youtube', 'image', 'html', 'markdown'));
    END IF;
END $$;

-- ===========================================
-- PHASE 2: AI Chat Improvements
-- ===========================================

-- Add chat summary column for context compression
ALTER TABLE ai_chat_sessions
ADD COLUMN IF NOT EXISTS chat_summary TEXT;

-- Add updated_at trigger if not exists
CREATE OR REPLACE FUNCTION update_ai_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ai_chat_sessions_updated_at ON ai_chat_sessions;

CREATE TRIGGER update_ai_chat_sessions_updated_at
    BEFORE UPDATE ON ai_chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_chat_sessions_updated_at();

-- ===========================================
-- PHASE 3: Admin Permission Settings
-- ===========================================

-- UI Settings
INSERT INTO admin_permission_settings (category, subcategory, setting_key, setting_name, setting_description, setting_type, default_value, order_index)
VALUES 
('ui', NULL, 'ui.font_family', 'Global Font Family', 'Default font family for the application', 'enum', 'inter', 10),
('ui', NULL, 'ui.show_loading_indicator', 'Show Loading Indicator', 'Display loading bar during page navigation', 'boolean', 'false', 11),
('ui', NULL, 'ui.sidebar_default_state', 'Default Sidebar State', 'Sidebar collapsed or expanded by default', 'enum', 'expanded', 12),
('ui', NULL, 'ui.theme_color', 'Primary Theme Color', 'Main accent color for the application', 'enum', 'blue', 13),
('ui', NULL, 'ui.icon_style', 'Icon Style', 'Colored or monochrome sidebar icons', 'enum', 'colored', 14),
('ui', NULL, 'ui.animations_enabled', 'Enable Animations', 'Show smooth transitions and animations', 'boolean', 'true', 15),
('ui', NULL, 'ui.compact_mode', 'Compact Mode', 'Reduce spacing and padding', 'boolean', 'false', 16)
ON CONFLICT (setting_key) DO NOTHING;

-- Document Settings
INSERT INTO admin_permission_settings (category, subcategory, setting_key, setting_name, setting_description, setting_type, default_value, order_index)
VALUES 
('subjects', 'documents', 'documents.allow_html', 'Allow HTML Elements', 'Users can add HTML code blocks to documents', 'boolean', 'true', 10),
('subjects', 'documents', 'documents.allow_youtube', 'Allow YouTube Embeds', 'Users can embed YouTube videos', 'boolean', 'true', 11),
('subjects', 'documents', 'documents.allow_images', 'Allow Images', 'Users can add images to documents', 'boolean', 'true', 12),
('subjects', 'documents', 'documents.allow_rich_text', 'Allow Rich Text', 'Users can use text formatting', 'boolean', 'true', 13),
('subjects', 'documents', 'documents.allow_tables', 'Allow Tables', 'Users can create tables', 'boolean', 'true', 14),
('subjects', 'documents', 'documents.max_elements', 'Max Elements Per Document', 'Maximum number of elements in a document', 'number', '50', 15),
('subjects', 'documents', 'documents.require_approval', 'Require Document Approval', 'Documents need admin approval before publishing', 'boolean', 'false', 16)
ON CONFLICT (setting_key) DO NOTHING;

-- Study Mode Settings
INSERT INTO admin_permission_settings (category, subcategory, setting_key, setting_name, setting_description, setting_type, default_value, order_index)
VALUES 
('study_modes', NULL, 'study.flashcard_timer', 'Flashcard Auto-Flip Timer', 'Seconds before auto-flip (0 = disabled)', 'number', '0', 10),
('study_modes', NULL, 'study.quiz_passing_score', 'Quiz Passing Score', 'Minimum percentage required to pass', 'number', '70', 11),
('study_modes', NULL, 'study.show_answer_immediately', 'Show Answers Immediately', 'Display answers right after submission', 'boolean', 'true', 12),
('study_modes', NULL, 'study.allow_retakes', 'Allow Quiz Retakes', 'Users can retake quizzes multiple times', 'boolean', 'true', 13),
('study_modes', NULL, 'study.shuffle_questions', 'Shuffle Questions', 'Randomize question order in quizzes', 'boolean', 'true', 14),
('study_modes', NULL, 'study.time_limit_enabled', 'Enable Time Limits', 'Enforce time limits on quizzes', 'boolean', 'false', 15)
ON CONFLICT (setting_key) DO NOTHING;

-- AI & Chat Settings
INSERT INTO admin_permission_settings (category, subcategory, setting_key, setting_name, setting_description, setting_type, default_value, order_index)
VALUES 
('ai', NULL, 'ai.enabled', 'Enable AI Features', 'Enable or disable all AI functionality', 'boolean', 'true', 10),
('ai', NULL, 'ai.max_messages_per_day', 'Max AI Messages Per Day', 'Per-user daily limit (0 = unlimited)', 'number', '100', 11),
('ai', NULL, 'ai.context_message_count', 'Context Message Count', 'Number of previous messages included for context', 'number', '10', 12),
('ai', NULL, 'ai.show_tutor_widget', 'Show AI Tutor Widget', 'Display floating AI tutor button', 'boolean', 'true', 13),
('ai', NULL, 'ai.auto_summarize_chats', 'Auto-Summarize Long Chats', 'Generate summaries for chats with 10+ messages', 'boolean', 'true', 14),
('ai', NULL, 'ai.model_temperature', 'AI Model Temperature', 'Creativity level (0.0-1.0)', 'number', '0.7', 15)
ON CONFLICT (setting_key) DO NOTHING;

-- Library Settings
INSERT INTO admin_permission_settings (category, subcategory, setting_key, setting_name, setting_description, setting_type, default_value, order_index)
VALUES 
('library', NULL, 'library.allow_public_sharing', 'Allow Public Sharing', 'Users can share resources publicly', 'boolean', 'true', 10),
('library', NULL, 'library.max_upload_size', 'Max Upload Size (MB)', 'Maximum file upload size in megabytes', 'number', '10', 11),
('library', NULL, 'library.require_moderation', 'Require Content Moderation', 'Admin approval required for shared resources', 'boolean', 'false', 12),
('library', NULL, 'library.allow_downloads', 'Allow Resource Downloads', 'Users can download shared resources', 'boolean', 'true', 13),
('library', NULL, 'library.show_popular', 'Show Popular Resources', 'Display trending/popular section', 'boolean', 'true', 14)
ON CONFLICT (setting_key) DO NOTHING;

-- Calendar Settings
INSERT INTO admin_permission_settings (category, subcategory, setting_key, setting_name, setting_description, setting_type, default_value, order_index)
VALUES 
('calendar', NULL, 'calendar.default_view', 'Default Calendar View', 'Initial view when opening calendar', 'enum', 'month', 10),
('calendar', NULL, 'calendar.show_weekends', 'Show Weekends', 'Display Saturday and Sunday', 'boolean', 'true', 11),
('calendar', NULL, 'calendar.first_day_of_week', 'First Day of Week', '0 = Sunday, 1 = Monday', 'number', '1', 12),
('calendar', NULL, 'calendar.event_notifications', 'Event Notifications', 'Send reminders for upcoming events', 'boolean', 'true', 13)
ON CONFLICT (setting_key) DO NOTHING;

-- Tasks Settings
INSERT INTO admin_permission_settings (category, subcategory, setting_key, setting_name, setting_description, setting_type, default_value, order_index)
VALUES 
('tasks', NULL, 'tasks.allow_subtasks', 'Allow Subtasks', 'Users can create subtasks', 'boolean', 'true', 10),
('tasks', NULL, 'tasks.default_priority', 'Default Task Priority', 'Default priority for new tasks', 'enum', 'medium', 11),
('tasks', NULL, 'tasks.show_completed', 'Show Completed Tasks', 'Display completed tasks in list', 'boolean', 'true', 12),
('tasks', NULL, 'tasks.auto_archive_days', 'Auto-Archive After (Days)', 'Days before completed tasks auto-archive (0 = never)', 'number', '30', 13)
ON CONFLICT (setting_key) DO NOTHING;

-- Dashboard Settings
INSERT INTO admin_permission_settings (category, subcategory, setting_key, setting_name, setting_description, setting_type, default_value, order_index)
VALUES 
('dashboard', NULL, 'dashboard.show_recent_activity', 'Show Recent Activity', 'Display recent activity feed', 'boolean', 'true', 10),
('dashboard', NULL, 'dashboard.show_upcoming_events', 'Show Upcoming Events', 'Display next 5 upcoming events', 'boolean', 'true', 11),
('dashboard', NULL, 'dashboard.show_statistics', 'Show Study Statistics', 'Display study time and progress stats', 'boolean', 'true', 12),
('dashboard', NULL, 'dashboard.widget_layout', 'Widget Layout', 'Default dashboard layout', 'enum', 'grid', 13)
ON CONFLICT (setting_key) DO NOTHING;
