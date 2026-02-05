'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import ErrorLogger from '@/lib/ErrorLogger';

export default function TimeTracker() {
    const { user } = useAuth();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!user) return;

        // Track every minute
        intervalRef.current = setInterval(async () => {
            if (document.visibilityState === 'visible') {
                try {
                    await supabase.rpc('increment_study_time', {
                        user_uuid: user.id,
                        minutes: 1
                    });
                } catch (error) {
                    ErrorLogger.error('Failed to track time:', error);
                }
            }
        }, 60000); // 1 minute

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [user]);

    return null;
}
