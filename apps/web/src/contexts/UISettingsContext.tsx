'use client';
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface UISettings {
    iconStyle: 'colored' | 'monochrome';
    sidebarCompact: boolean;
    animationsEnabled: boolean;
}

interface UISettingsContextType {
    settings: UISettings;
    updateSettings: (newSettings: Partial<UISettings>) => Promise<void>;
    loading: boolean;
}

const defaultSettings: UISettings = {
    iconStyle: 'colored',
    sidebarCompact: false,
    animationsEnabled: true,
};

const UISettingsContext = createContext<UISettingsContextType>({
    settings: defaultSettings,
    updateSettings: async () => { },
    loading: false,
});

export function UISettingsProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [settings, setSettings] = useState<UISettings>(defaultSettings);
    const [loading, setLoading] = useState(true);

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
    }, [user]);

    const loadSettings = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            // Parse ui_preferences if it exists
            if (data && typeof data === 'object' && 'ui_preferences' in data) {
                const prefs = data.ui_preferences;
                if (prefs && typeof prefs === 'object') {
                    setSettings({ ...defaultSettings, ...prefs });
                }
            }
        } catch (error) {
            console.error('Failed to load UI settings:', error);
        } finally {
            setLoading(false);
        }
    };

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
                    } as any);

                if (error) {
                    console.error('Failed to save UI settings:', error);
                }
            } catch (error) {
                console.error('Failed to save UI settings:', error);
            }
        } else {
            // Save to localStorage
            localStorage.setItem('ui_settings', JSON.stringify(updated));
        }
    };

    return (
        <UISettingsContext.Provider value={{ settings, updateSettings, loading }}>
            {children}
        </UISettingsContext.Provider>
    );
}

export function useUISettings() {
    return useContext(UISettingsContext);
}
