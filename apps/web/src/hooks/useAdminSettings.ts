import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type AdminSetting = {
    id: string;
    setting_key: string;
    setting_value: string | number | boolean;
    description: string | null;
    category: string;
    updated_at: string;
    updated_by: string | null;
};

export function useAdminSettings() {
    const { profile } = useAuth();
    const [settings, setSettings] = useState<AdminSetting[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.is_admin) {
            fetchSettings();

            // Subscribe to real-time updates
            const channel = supabase
                .channel('admin_settings_changes')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'admin_settings' },
                    () => {
                        fetchSettings();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [profile]);

    const fetchSettings = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('admin_settings')
            .select('*')
            .order('category', { ascending: true })
            .order('setting_key', { ascending: true });

        if (!error && data) {
            setSettings(data as AdminSetting[]);
        }
        setLoading(false);
    };

    const updateSetting = async (settingKey: string, value: string | number | boolean) => {
        const { error } = await supabase
            .from('admin_settings')
            .update({
                setting_value: value as any,
                updated_at: new Date().toISOString(),
                updated_by: profile?.id
            })
            .eq('setting_key', settingKey);

        if (!error) {
            await fetchSettings();
            return true;
        }
        return false;
    };

    const getSetting = (key: string): string | number | boolean | undefined => {
        const setting = settings.find(s => s.setting_key === key);
        return setting?.setting_value;
    };

    const getBooleanSetting = (key: string): boolean => {
        const value = getSetting(key);
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') return value === 'true';
        return false;
    };

    return {
        settings,
        loading,
        updateSetting,
        getSetting,
        getBooleanSetting,
        isAdmin: profile?.is_admin || false
    };
}
