-- Add loading indicator setting to admin_permission_settings
INSERT INTO admin_permission_settings (setting_key, default_value, description)
VALUES ('ui.show_loading_indicator', 'true', 'Controls visibility of the global loading indicator')
ON CONFLICT (setting_key) DO NOTHING;
