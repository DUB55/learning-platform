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
    type AdminSetting = { setting_key: 'ui.show_loading_indicator' | 'ui.show_loading_spinner'; default_value: string };

    useEffect(() => {
        // Load from local storage first for immediate effect
        const cached = localStorage.getItem('ui.show_loading_indicator');
        if (cached !== null) setEnabled(cached === 'true');

        const cachedSpinner = localStorage.getItem('ui.show_loading_spinner');
        if (cachedSpinner !== null) {
            const spin = cachedSpinner === 'true';
            NProgress.configure({ showSpinner: spin });
        }

        // Fetch the global setting for loading indicator
        const fetchSetting = async () => {
            const { data } = await supabase
                .from('admin_permission_settings')
                .select('setting_key, default_value')
                .in('setting_key', ['ui.show_loading_indicator', 'ui.show_loading_spinner']);

            if (data) {
                (data as unknown as AdminSetting[]).forEach((item) => {
                    if (item.setting_key === 'ui.show_loading_indicator') {
                        const val = item.default_value === 'true';
                        setEnabled(val);
                        localStorage.setItem('ui.show_loading_indicator', String(val));
                    }
                    if (item.setting_key === 'ui.show_loading_spinner') {
                        const val = item.default_value === 'true';
                        localStorage.setItem('ui.show_loading_spinner', String(val));
                        NProgress.configure({ showSpinner: val });
                    }
                });
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
                    filter: "setting_key=in.(ui.show_loading_indicator,ui.show_loading_spinner)"
                },
                (payload: { new: AdminSetting }) => {
                    if (payload.new.setting_key === 'ui.show_loading_indicator') {
                        const val = payload.new.default_value === 'true';
                        setEnabled(val);
                        localStorage.setItem('ui.show_loading_indicator', String(val));
                    }
                    if (payload.new.setting_key === 'ui.show_loading_spinner') {
                        const val = payload.new.default_value === 'true';
                        localStorage.setItem('ui.show_loading_spinner', String(val));
                        NProgress.configure({ showSpinner: val });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        if (!enabled) return;

        // Prevent showing on initial mount if not a real navigation
        // and prevent showing on tab switches/focus
        const isInitial = !pathname && !searchParams;
        if (isInitial) return;

        // Check if the tab is visible. If it just became visible, don't show the indicator
        // because it's likely not a real navigation but a tab switch.
        if (document.visibilityState !== 'visible') return;

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
