'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createBrowserClient } from '@supabase/ssr';
import LandingPageClassic from '@/components/landing/LandingPageClassic';
import LandingPageModern from '@/components/landing/LandingPageModern';
import { Loader2 } from 'lucide-react';
import ErrorLogger from '@/lib/ErrorLogger';

export default function LandingPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Default to modern, but load from DB
    const [landingVersion, setLandingVersion] = useState<'classic' | 'modern'>('modern');
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        if (user && !loading) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    // Fetch initial setting and subscribe to Realtime changes
    useEffect(() => {
        const fetchSetting = async () => {
            try {
                const { data, error } = await supabase
                    .from('system_settings')
                    .select('value')
                    .eq('key', 'landing_page_version')
                    .single();

                if (data && data.value) {
                    // Remove quotes if jsonb returns stringified string
                    const cleanValue = typeof data.value === 'string' ? data.value.replace(/"/g, '') : data.value;
                    setLandingVersion(cleanValue as 'classic' | 'modern');
                }
            } catch (error) {
                ErrorLogger.error('Error fetching landing page version', error);
            } finally {
                setIsInitialLoad(false);
            }
        };

        fetchSetting();

        // Subscribe to changes for INSTANT updates
        const channel = supabase
            .channel('system_settings_changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'system_settings',
                    filter: 'key=eq.landing_page_version'
                },
                (payload) => {
                    const newValue = payload.new.value;
                    const cleanValue = typeof newValue === 'string' ? newValue.replace(/"/g, '') : newValue;
                    setLandingVersion(cleanValue as 'classic' | 'modern');
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []); // Empty dependency array to run only once

    // Show loading while initializing settings (but only if not logged in yet)
    // If logged in, we are redirecting anyway, so less flicker is better
    if (loading || (isInitialLoad && !user)) {
        return (
            <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    // Don't render landing if user is logged in (redirecting)
    if (user) return null;

    return (
        <>
            {landingVersion === 'modern' ? <LandingPageModern /> : <LandingPageClassic />}
        </>
    );
}
