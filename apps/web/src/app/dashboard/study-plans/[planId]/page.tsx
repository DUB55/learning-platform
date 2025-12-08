'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function StudyPlanDetailRedirect() {
    const router = useRouter();
    const params = useParams();

    useEffect(() => {
        if (params.planId) {
            router.replace(`/study-plans/${params.planId}`);
        }
    }, [router, params.planId]);

    return (
        <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
    );
}
