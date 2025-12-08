'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function StudyPlansRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/study-plans');
    }, [router]);

    return (
        <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
    );
}

