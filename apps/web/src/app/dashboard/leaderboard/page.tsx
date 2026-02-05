'use client';

import Leaderboard from '@/components/Gamification/Leaderboard';
import { Trophy } from 'lucide-react';

export default function LeaderboardPage() {
    return (
        <div className="min-h-screen bg-[#0f172a] p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-yellow-500/10 rounded-xl">
                            <Trophy className="w-8 h-8 text-yellow-400" />
                        </div>
                        <h1 className="text-4xl font-bold text-white">Global Rankings</h1>
                    </div>
                    <p className="text-slate-400 text-lg max-w-2xl">
                        Compete with students worldwide. Gain XP by studying, completing tasks, and participating in the community.
                    </p>
                </header>

                <Leaderboard />
            </div>
        </div>
    );
}
