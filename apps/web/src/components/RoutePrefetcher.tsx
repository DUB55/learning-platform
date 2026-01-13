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
        // Prefetch ALL routes IMMEDIATELY for instant navigation
        // No waiting for idle - we want maximum speed
        PREFETCH_ROUTES.forEach((route) => {
            router.prefetch(route);
        });
    }, [router]);

    return null;
}
