'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Custom hook to subscribe to admin permission settings with real-time updates
 * @param settingKey - The setting key to watch (e.g., 'ui.font_family')
 * @param defaultValue - Fallback value if setting not found
 * @returns Current value of the setting
 */
export function useAdminSetting<T = string>(settingKey: string, defaultValue: T): T {
    const [value, setValue] = useState<T>(defaultValue);

    useEffect(() => {
        // Fetch initial value
        const fetchSetting = async () => {
            try {
                const { data } = await supabase
                    .from('admin_permission_settings')
                    .select('default_value, setting_type')
                    .eq('setting_key', settingKey)
                    .single();

                if (data) {
                    // Parse value based on type
                    const parsedValue = parseSettingValue(data.default_value, data.setting_type);
                    setValue(parsedValue as T);
                }
            } catch (error) {
                console.error(`Error fetching setting ${settingKey}:`, error);
            }
        };

        fetchSetting();

        // Subscribe to real-time changes
        const channel = supabase
            .channel(`setting_${settingKey}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'admin_permission_settings',
                    filter: `setting_key=eq.${settingKey}`
                },
                (payload) => {
                    const parsedValue = parseSettingValue(
                        payload.new.default_value,
                        payload.new.setting_type
                    );
                    setValue(parsedValue as T);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [settingKey]);

    return value;
}

/**
 * Parse setting value based on its type
 */
function parseSettingValue(value: string, type: string): any {
    switch (type) {
        case 'boolean':
            return value === 'true';
        case 'number':
            return parseFloat(value);
        case 'enum':
        case 'string':
        default:
            return value;
    }
}

/**
 * Hook to fetch multiple settings at once
 */
export function useAdminSettings(settingKeys: string[]): Record<string, any> {
    const [settings, setSettings] = useState<Record<string, any>>({});

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await supabase
                    .from('admin_permission_settings')
                    .select('setting_key, default_value, setting_type')
                    .in('setting_key', settingKeys);

                if (data) {
                    const parsed = data.reduce((acc, setting) => {
                        acc[setting.setting_key] = parseSettingValue(
                            setting.default_value,
                            setting.setting_type
                        );
                        return acc;
                    }, {} as Record<string, any>);
                    setSettings(parsed);
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        };

        fetchSettings();

        // Subscribe to changes for all settings
        const channel = supabase
            .channel('settings_multiple')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'admin_permission_settings',
                    filter: `setting_key=in.(${settingKeys.join(',')})`
                },
                (payload) => {
                    setSettings(prev => ({
                        ...prev,
                        [payload.new.setting_key]: parseSettingValue(
                            payload.new.default_value,
                            payload.new.setting_type
                        )
                    }));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [settingKeys.join(',')]);

    return settings;
}
