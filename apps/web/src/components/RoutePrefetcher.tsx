'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PREFETCH_ROUTES = [
    '/dashboard',
    '/subjects',
    '/calendar',
    '/todo',
    '/ai-chat',
    '/study-modes',
    '/dashboard/study-plans',
    '/ai-ppt',
    '/library',
    '/admin'
];

export default function RoutePrefetcher() {
    const router = useRouter();

    useEffect(() => {
        // Prefetch routes as soon as the browser is idle to avoid impacting initial load
        const prefetch = () => {
            PREFETCH_ROUTES.forEach((route) => {
                router.prefetch(route);
            });
        };
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            (window as any).requestIdleCallback(prefetch);
        } else {
            // Fallback to immediate prefetch
            setTimeout(prefetch, 0);
        }
    }, [router]);

    return null;
}
