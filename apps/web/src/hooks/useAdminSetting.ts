'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ErrorLogger from '@/lib/ErrorLogger';

/**
 * Custom hook to subscribe to admin permission settings with real-time updates
 * @param settingKey - The setting key to watch (e.g., 'ui.font_family')
 * @param defaultValue - Fallback value if setting not found
 * @returns Current value of the setting
 */
export function useAdminSetting<T = string | number | boolean>(settingKey: string, defaultValue: T): T {
    const [value, setValue] = useState<T>(defaultValue);

    useEffect(() => {
        const controller = new AbortController();

        // Fetch initial value
        const fetchSetting = async (signal: AbortSignal) => {
            try {
                const { data, error } = await supabase
                    .from('admin_permission_settings')
                    .select('default_value, setting_type')
                    .eq('setting_key', settingKey)
                    .single();

                if (error) {
                    if (error.name === 'AbortError') return;
                    throw error;
                }

                if (data) {
                    // Parse value based on type
                    const parsedValue = parseSettingValue(data.default_value, data.setting_type);
                    setValue(parsedValue as T);
                }
            } catch (error) {
                ErrorLogger.error(`Error fetching setting ${settingKey}:`, error);
            }
        };

        fetchSetting(controller.signal);

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
                    const newRow = payload.new as { default_value: string; setting_type: string };
                    const parsedValue = parseSettingValue(
                        newRow.default_value,
                        newRow.setting_type
                    );
                    setValue(parsedValue as T);
                }
            )
            .subscribe();

        return () => {
            controller.abort();
            supabase.removeChannel(channel);
        };
    }, [settingKey]);

    return value;
}

/**
 * Parse setting value based on its type
 */
function parseSettingValue(value: string, type: string): string | number | boolean {
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
export function useAdminSettings(settingKeys: string[]): Record<string, string | number | boolean> {
    const [settings, setSettings] = useState<Record<string, string | number | boolean>>({});

    useEffect(() => {
        const controller = new AbortController();

        const fetchSettings = async (signal: AbortSignal) => {
            try {
                const { data, error } = await (supabase
                    .from('admin_permission_settings') as any)
                    .select('setting_key, default_value, setting_type')
                    .in('setting_key', settingKeys)
                    .abortSignal(signal as any);

                if (error) {
                    if (error.name === 'AbortError') return;
                    throw error;
                }

                if (data) {
                    const parsed = data.reduce((acc: any, setting: any) => {
                        acc[setting.setting_key] = parseSettingValue(
                            setting.default_value,
                            setting.setting_type
                        );
                        return acc;
                    }, {} as Record<string, string | number | boolean>);
                    setSettings(parsed);
                }
            } catch (error) {
                ErrorLogger.error('Error fetching settings:', error);
            }
        };

        fetchSettings(controller.signal);

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
                    const newRow = payload.new as { setting_key: string; default_value: string; setting_type: string };
                    setSettings(prev => ({
                        ...prev,
                        [newRow.setting_key]: parseSettingValue(
                            newRow.default_value,
                            newRow.setting_type
                        )
                    }));
                }
            )
            .subscribe();

        return () => {
            controller.abort();
            supabase.removeChannel(channel);
        };
    }, [settingKeys.join(',')]);

    return settings;
}
