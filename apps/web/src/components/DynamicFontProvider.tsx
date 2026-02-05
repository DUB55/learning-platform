'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const FONT_MAP: Record<string, string> = {
    'inter': 'var(--font-inter)',
    'outfit': 'var(--font-outfit)',
    'roboto': 'var(--font-roboto)',
    'opensans': 'var(--font-opensans)',
};

export default function DynamicFontProvider() {
    useEffect(() => {
        const applyFont = (fontKey: string) => {
            const fontVar = FONT_MAP[fontKey] || FONT_MAP['inter'];
            document.documentElement.style.setProperty('--font-dynamic', fontVar);
        };

        // Initial fetch
        const fetchFontSetting = async () => {
            const { data } = await supabase
                .from('admin_permission_settings')
                .select('default_value')
                .eq('setting_key', 'ui.font_family')
                .single();

            if (data && 'default_value' in data) {
                applyFont(data.default_value as string);
            } else {
                applyFont('inter');
            }
        };

        fetchFontSetting();

        // Real-time subscription
        const channel = supabase
            .channel('font_settings')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'admin_permission_settings',
                    filter: "setting_key=eq.ui.font_family"
                },
                (payload) => {
                    const newData = payload.new as { default_value: string };
                    applyFont(newData.default_value);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return null;
}
