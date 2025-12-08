'use client';

import { useAuth } from '@/contexts/AuthContext';
import Leaderboard from '@/components/Gamification/Leaderboard';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LeaderboardPage() {
    const { user } = useAuth();
    const router = useRouter();

    return (
        <div className="p-8 pb-32">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Dashboard</span>
                </button>

                <div className="mb-8">
                    <h1 className="text-3xl font-serif font-bold text-white mb-2">Leaderboard</h1>
                    <p className="text-slate-400">Compete with other students and climb the ranks!</p>
                </div>

                <Leaderboard />
            </div>
        </div>
    );
}
