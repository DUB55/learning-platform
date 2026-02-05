'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import ErrorLogger from '@/lib/ErrorLogger';

interface UISettings {
    iconStyle: 'colored' | 'monochrome';
    sidebarCompact: boolean;
    animationsEnabled: boolean;
    theme: 'dark' | 'light' | 'system';
    cardStyle: 'glass' | 'solid' | 'minimal';
    fontSize: 'small' | 'medium' | 'large';
    reduceMotion: boolean;
    highContrast: boolean;
    notifications: boolean;
    soundEnabled: boolean;
    language: 'en' | 'nl' | 'de' | 'fr' | 'es';
    timezone: string;
    enabledWidgets: string[];
    widgetOrder: string[];
}

interface UISettingsContextType {
    settings: UISettings;
    updateSettings: (newSettings: Partial<UISettings>) => Promise<void>;
    resetSettings: () => Promise<void>;
    loading: boolean;
}

const defaultSettings: UISettings = {
    iconStyle: 'colored',
    sidebarCompact: false,
    animationsEnabled: true,
    theme: 'dark',
    cardStyle: 'glass',
    fontSize: 'medium',
    reduceMotion: false,
    highContrast: false,
    notifications: true,
    soundEnabled: true,
    language: 'nl',
    timezone: 'UTC+1',
    enabledWidgets: ['stats', 'tip', 'quick-tools', 'subjects', 'upcoming', 'review', 'next-test', 'proof'],
    widgetOrder: ['next-test', 'stats', 'proof', 'tip', 'subjects', 'review', 'quick-tools', 'upcoming'],
};

const UISettingsContext = createContext<UISettingsContextType>({
    settings: defaultSettings,
    updateSettings: async () => { },
    resetSettings: async () => { },
    loading: false,
});


export function UISettingsProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [settings, setSettings] = useState<UISettings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    const loadSettings = useCallback(async () => {
        if (!user) return;

        try {
            const { data } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (data && typeof data === 'object' && 'ui_preferences' in data) {
                const prefs = (data as Record<string, unknown>)['ui_preferences'] as Record<string, unknown> | null;
                if (prefs && typeof prefs === 'object') {
                    setSettings({ ...defaultSettings, ...(prefs as Partial<UISettings>) });
                }
            }
        } catch (error) {
            ErrorLogger.error('Failed to load UI settings:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            loadSettings();
        } else {
            // Load from localStorage for non-authenticated users
            const saved = localStorage.getItem('ui_settings');
            if (saved) {
                setSettings(JSON.parse(saved));
            }
            setLoading(false);
        }
    }, [user, loadSettings]);

    const updateSettings = async (newSettings: Partial<UISettings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);

        if (user) {
            // Save to database
            try {
                const { error } = await supabase
                    .from('user_settings')
                    .upsert({
                        user_id: user.id,
                        ui_preferences: updated,
                        updated_at: new Date().toISOString(),
                    });

                if (error) {
                    ErrorLogger.error('Failed to save UI settings:', error);
                }
            } catch (error) {
                ErrorLogger.error('Failed to save UI settings:', error);
            }
        } else {
            // Save to localStorage
            localStorage.setItem('ui_settings', JSON.stringify(updated));
        }
    };

    const resetSettings = async () => {
        setSettings(defaultSettings);
        if (user) {
            try {
                await supabase
                    .from('user_settings')
                    .upsert({
                        user_id: user.id,
                        ui_preferences: defaultSettings,
                        updated_at: new Date().toISOString(),
                    });
            } catch (error) {
                ErrorLogger.error('Failed to reset UI settings:', error);
            }
        } else {
            localStorage.setItem('ui_settings', JSON.stringify(defaultSettings));
        }
    };

    return (
        <UISettingsContext.Provider value={{ settings, updateSettings, resetSettings, loading }}>
            {children}
        </UISettingsContext.Provider>
    );
}


export function useUISettings() {
    return useContext(UISettingsContext);
}
