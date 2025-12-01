-- Add comprehensive admin settings
-- Features
INSERT INTO admin_permission_settings (category, setting_key, setting_name, setting_description, setting_type, default_value, order_index) VALUES
('Features', 'features.enable_ai_chat', 'Enable AI Chat', 'Allow users to access the AI Tutor chat', 'boolean', 'true', 10),
('Features', 'features.enable_study_modes', 'Enable Study Modes', 'Allow access to Flashcards, Quiz, and Spaced Repetition', 'boolean', 'true', 20),
('Features', 'features.enable_public_signups', 'Enable Public Signups', 'Allow new users to register accounts', 'boolean', 'true', 30),
('Features', 'features.enable_gamification', 'Enable Gamification', 'Show points, badges, and leaderboards', 'boolean', 'true', 40),
('Features', 'features.enable_social_sharing', 'Enable Social Sharing', 'Allow users to share achievements and resources', 'boolean', 'true', 50),
('Features', 'features.enable_beta_features', 'Enable Beta Features', 'Grant access to experimental features', 'boolean', 'false', 60);

-- UI
INSERT INTO admin_permission_settings (category, setting_key, setting_name, setting_description, setting_type, default_value, order_index) VALUES
('UI', 'ui.theme_color', 'Default Theme Color', 'Primary color theme for the application', 'enum', 'blue', 10),
('UI', 'ui.sidebar_default_collapsed', 'Sidebar Default Collapsed', 'Start with sidebar collapsed by default', 'boolean', 'false', 20),
('UI', 'ui.enable_animations', 'Enable Animations', 'Show UI animations and transitions', 'boolean', 'true', 30),
('UI', 'ui.show_announcements', 'Show Announcements', 'Display global announcements on the dashboard', 'boolean', 'true', 40);

-- System
INSERT INTO admin_permission_settings (category, setting_key, setting_name, setting_description, setting_type, default_value, order_index) VALUES
('System', 'system.maintenance_mode', 'Maintenance Mode', 'Show maintenance banner and restrict access', 'boolean', 'false', 10),
('System', 'system.max_upload_size', 'Max Upload Size (MB)', 'Maximum allowed file size for uploads', 'number', '10', 20),
('System', 'system.support_email', 'Support Email', 'Contact email displayed for support', 'string', 'support@example.com', 30),
('System', 'system.analytics_enabled', 'Enable Analytics', 'Track user usage and engagement', 'boolean', 'true', 40);

-- Security
INSERT INTO admin_permission_settings (category, setting_key, setting_name, setting_description, setting_type, default_value, order_index) VALUES
('Security', 'security.require_email_verification', 'Require Email Verification', 'Users must verify email before accessing features', 'boolean', 'false', 10),
('Security', 'security.max_login_attempts', 'Max Login Attempts', 'Lock account after N failed attempts', 'number', '5', 20),
('Security', 'security.session_timeout_minutes', 'Session Timeout (Minutes)', 'Auto-logout after inactivity (0 for infinite)', 'number', '1440', 30),
('Security', 'content.require_approval', 'Require Content Approval', 'Admin must approve public subjects before they are visible', 'boolean', 'false', 40);

-- Handle conflicts by doing nothing (preserves existing values)
ON CONFLICT (setting_key) DO NOTHING;
