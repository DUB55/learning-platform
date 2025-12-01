-- Add default settings for tasks if they don't exist
INSERT INTO public.admin_permission_settings (category, setting_key, setting_name, setting_description, setting_type, default_value, order_index)
VALUES 
('tasks', 'tasks.allow_custom_categories', 'Allow Custom Categories', 'Allow users to create their own task categories', 'boolean', 'true', 10),
('tasks', 'tasks.max_tasks_per_user', 'Max Tasks Per User', 'Maximum number of active tasks a user can have', 'number', '100', 20)
ON CONFLICT (setting_key) DO NOTHING;
