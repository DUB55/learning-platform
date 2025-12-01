'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import { supabase } from '@/lib/supabase';
import 'nprogress/nprogress.css';

// Configure NProgress
NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.2 });

export default function GlobalLoadingIndicator() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        // Fetch the global setting for loading indicator
        const fetchSetting = async () => {
            const { data } = await supabase
                .from('admin_permission_settings')
                .select('default_value')
                .eq('setting_key', 'ui.show_loading_indicator')
                .single();

            if (data) {
                setEnabled(data.default_value === 'true');
            }
        };

        fetchSetting();

        // Subscribe to changes
        const channel = supabase
            .channel('loading_indicator_settings')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'admin_permission_settings',
                    filter: "setting_key=eq.ui.show_loading_indicator"
                },
                (payload) => {
                    setEnabled(payload.new.default_value === 'true');
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        if (!enabled) return;

        NProgress.start();
        const timer = setTimeout(() => {
            NProgress.done();
        }, 300);

        return () => {
            clearTimeout(timer);
            NProgress.done();
        };
    }, [pathname, searchParams, enabled]);

    return null;
}
