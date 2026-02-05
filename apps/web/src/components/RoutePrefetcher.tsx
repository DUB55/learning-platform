'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// All routes that appear in the sidebar for instant loading
const PREFETCH_ROUTES = [
    '/dashboard',
    '/subjects',
    '/calendar',
    '/todo',
    '/ai-chat',
    '/study-modes',
    '/study-plans',
    '/study-plans/create',
    '/ai-ppt',
    '/library',
    '/focus',
    '/ai-mindmap',
    '/smart-notes',
    '/settings',
    '/profile',
    '/admin',
    '/admin/sync',
    '/dashboard/leaderboard',
];

export default function RoutePrefetcher() {
    const router = useRouter();

    useEffect(() => {
        const prefetchAll = () => {
            PREFETCH_ROUTES.forEach((route) => {
                try {
                    router.prefetch(route);
                } catch {}
            });
        };
        const win = window as Window & {
            requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => void;
        };
        if (typeof win.requestIdleCallback === 'function') {
            win.requestIdleCallback(prefetchAll, { timeout: 2000 });
        } else {
            setTimeout(prefetchAll, 500);
        }
    }, [router]);

    return null;
}
