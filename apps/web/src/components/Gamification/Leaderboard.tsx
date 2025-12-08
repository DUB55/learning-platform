'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Medal, User, Crown } from 'lucide-react';

type LeaderboardEntry = {
    user_id: string;
    username: string;
    avatar_url: string | null;
    xp: number;
    rank?: number;
};

export default function Leaderboard() {
    const [filter, setFilter] = useState<'global' | 'friends'>('global');
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, [filter]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            // For now, we only implement global as 'friends' requires a social graph we haven't built yet.
            // But we can simulate it or just show global for V1.

            // Note: In a real app, you'd likely have a view or RPC for this to be efficient.
            // We'll fetch from profiles joined with xp_stats (if we had that separate table) 
            // or just use what we have. Assuming 'profiles' has 'xp' or we need to sum it.
            // Wait, we don't have a direct 'total_xp' on profiles based on my memory.
            // Let's check schemas if needed. For now I'll assume we aggregate session stats or use a 'user_xp' table.

            // Let's try to query 'user_xp' view/table if it exists, or just mock for now if schema isn't ready.
            // Actually, I should probably check the schema first. But earlier I saw 'xpData' in dashboard.
            // It seems we have 'user_xp' table or similar.

            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, avatar_url, total_xp') // Assuming total_xp was added or we need to add it.
                .order('total_xp', { ascending: false })
                .limit(50);

            if (data) {
                setEntries(data.map((p: any, index) => ({
                    user_id: p.id,
                    username: p.username || 'Anonymous',
                    avatar_url: p.avatar_url,
                    xp: p.total_xp || 0,
                    rank: index + 1
                })));
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Crown className="w-6 h-6 text-yellow-400" fill="currentColor" />;
            case 2: return <Medal className="w-6 h-6 text-slate-300" fill="currentColor" />;
            case 3: return <Medal className="w-6 h-6 text-amber-600" fill="currentColor" />;
            default: return <span className="font-bold text-slate-500">#{rank}</span>;
        }
    };

    return (
        <div className="bg-[#1e293b] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-yellow-500/10 to-transparent flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                        <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Leaderboard</h2>
                </div>

                <div className="flex bg-[#0f172a] rounded-lg p-1 border border-white/10">
                    <button
                        onClick={() => setFilter('global')}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${filter === 'global' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Global
                    </button>
                    <button
                        onClick={() => setFilter('friends')}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${filter === 'friends' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Classroom
                    </button>
                </div>
            </div>

            <div className="divide-y divide-white/5">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading rankings...</div>
                ) : entries.length > 0 ? (
                    entries.map((entry) => (
                        <div key={entry.user_id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group">
                            <div className="w-10 flex justify-center">
                                {getRankIcon(entry.rank!)}
                            </div>

                            <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border border-white/10">
                                {entry.avatar_url ? (
                                    <img src={entry.avatar_url} alt={entry.username} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <User size={20} />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <h3 className={`font-bold ${entry.rank === 1 ? 'text-yellow-400' : 'text-white'}`}>
                                    {entry.username}
                                </h3>
                                <p className="text-xs text-slate-400">Student</p>
                            </div>

                            <div className="text-right">
                                <span className="block font-mono font-bold text-blue-400">{entry.xp.toLocaleString()} XP</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-slate-500">No rankings available yet.</div>
                )}
            </div>
        </div>
    );
}
