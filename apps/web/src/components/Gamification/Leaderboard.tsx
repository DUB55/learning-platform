'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Medal, User, Crown, Swords, Zap, Brain } from 'lucide-react';
import Link from 'next/link';
import ErrorLogger from '@/lib/ErrorLogger';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Database } from '@/types/supabase';

type LeaderboardEntry = {
    user_id: string;
    username: string;
    avatar_url: string | null;
    xp: number;
    rank?: number;
};

export default function Leaderboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [filter, setFilter] = useState<'global' | 'friends'>('global');
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [challengingId, setChallengingId] = useState<string | null>(null);
    const challengeControllerRefs = useRef<Map<string, AbortController>>(new Map());

    useEffect(() => {
        const controller = new AbortController();
        fetchLeaderboard(controller.signal);
        return () => {
            controller.abort();
            challengeControllerRefs.current.forEach(c => c.abort());
        };
    }, [filter]);

    const handleChallenge = async (opponentId: string, challengeType: 'math_sprint' | 'memory_match') => {
        if (!user) return;
        
        challengeControllerRefs.current.get(opponentId)?.abort();
        const controller = new AbortController();
        challengeControllerRefs.current.set(opponentId, controller);
        
        setChallengingId(opponentId);
        try {
            const { error } = await supabase
                .from('challenges')
                .insert({
                    challenger_id: user.id,
                    opponent_id: opponentId,
                    type: challengeType,
                    status: 'pending'
                } as any)
                .abortSignal(controller.signal as any);

            if (error) {
                if (error.name === 'AbortError') return;
                throw error;
            }
            
            // In a real app, you'd trigger a notification here
            alert('Challenge sent!');
        } catch (error) {
            ErrorLogger.error('Error sending challenge', error);
        } finally {
            setChallengingId(null);
            challengeControllerRefs.current.delete(opponentId);
        }
    };

    const fetchLeaderboard = async (signal?: AbortSignal) => {
        setLoading(true);
        try {
            // Note: In a real app, you'd likely have a view or RPC for this to be efficient.
            // We'll fetch from profiles excluding admins.

            const query = supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url, total_xp, is_admin')
                .neq('is_admin', true) // Exclude admin
                .order('total_xp', { ascending: false })
                .limit(50)
                .abortSignal(signal as any);

            const { data, error } = await query;

            if (error) {
                if (error.message?.includes('abort')) return;
                throw error;
            }

            if (data) {
                setEntries(data.map((p: any, index: number) => ({
                    user_id: p.id,
                    username: p.username || p.full_name || 'Anonymous',
                    avatar_url: p.avatar_url,
                    xp: p.total_xp || 0,
                    rank: index + 1
                })));
            }
        } catch (error) {
            ErrorLogger.error('Error fetching leaderboard', error);
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
        <div className="bg-[#1e293b]/50 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            {/* Header Section */}
            <div className="p-8 border-b border-white/5 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/20 rotate-3 group-hover:rotate-6 transition-transform">
                        <Trophy className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Top Scholars</h2>
                        <p className="text-slate-400 text-sm">Performance across the platform</p>
                    </div>
                </div>

                <div className="flex bg-[#0f172a] rounded-xl p-1 border border-white/5 ring-1 ring-white/5">
                    <button
                        onClick={() => setFilter('global')}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${filter === 'global'
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Worldwide
                    </button>
                    <button
                        onClick={() => setFilter('friends')}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${filter === 'friends'
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Classmates
                    </button>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-h-[600px] overflow-y-auto custom-scrollbar divide-y divide-white/5 bg-[#0f172a]/30">
                {loading ? (
                    <div className="py-20 text-center animate-pulse">
                        <div className="w-16 h-16 bg-indigo-500/20 rounded-full mx-auto mb-4 border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                        <p className="text-slate-400 font-medium">Gathering the elites...</p>
                    </div>
                ) : entries.length > 0 ? (
                    entries.map((entry) => (
                        <div
                            key={entry.user_id}
                            className="flex items-center gap-4 p-5 hover:bg-white/[0.03] transition-all duration-300 group cursor-pointer relative overflow-hidden"
                        >
                            {/* Rank Column */}
                            <div className="w-12 flex justify-center items-center relative z-10">
                                {getRankIcon(entry.rank!)}
                            </div>

                            {/* Avatar */}
                            <div className="relative z-10">
                                <div className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-transform duration-300 group-hover:scale-105 shadow-lg ${entry.rank === 1 ? 'border-yellow-400/50 shadow-yellow-500/20' :
                                    entry.rank === 2 ? 'border-slate-300/50 shadow-slate-300/20' :
                                        entry.rank === 3 ? 'border-amber-600/50 shadow-amber-600/20' :
                                            'border-white/10'
                                    }`}>
                                    {entry.avatar_url ? (
                                        <img src={entry.avatar_url} alt={entry.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400">
                                            <User size={24} />
                                        </div>
                                    )}
                                </div>
                                {entry.rank! <= 3 && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                                        <div className={`w-2 h-2 rounded-full ${entry.rank === 1 ? 'bg-yellow-400' : entry.rank === 2 ? 'bg-slate-300' : 'bg-amber-600'}`} />
                                    </div>
                                )}
                            </div>

                            {/* Name and Level */}
                            <div className="flex-1 relative z-10">
                                <div className="flex items-center gap-2">
                                    <h3 className={`font-bold transition-colors ${entry.rank === 1 ? 'text-yellow-400' :
                                        entry.rank === 2 ? 'text-slate-100' :
                                            entry.rank === 3 ? 'text-amber-500' :
                                                'text-slate-200'
                                        }`}>
                                        {entry.username}
                                    </h3>
                                    {entry.rank === 1 && <span className="text-[10px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-black uppercase tracking-wider">MVP</span>}
                                </div>
                                <div className="flex items-center gap-3">
                                    <p className="text-xs text-slate-500 font-medium tracking-wide">PHD STUDENT</p>
                                    <div className="w-1 h-1 rounded-full bg-white/10" />
                                    <Link href={`/profile/${entry.user_id}`} className="text-xs text-indigo-400/80 font-semibold uppercase">
                                        View Profile &rarr;
                                    </Link>
                                </div>
                            </div>

                            {/* XP Column */}
                            <div className="text-right relative z-10 px-4 flex items-center gap-6">
                                <div className="flex flex-col">
                                    <span className={`text-xl font-black font-mono tracking-tighter ${entry.rank! <= 3 ? 'text-white' : 'text-indigo-400'}`}>
                                        {entry.xp.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] -mt-1">XP Points</span>
                                </div>

                                {entry.user_id !== user?.id && (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleChallenge(entry.user_id, 'math_sprint');
                                            }}
                                            disabled={challengingId === entry.user_id}
                                            className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all group/btn relative"
                                            title="Math Sprint Challenge"
                                        >
                                            <Zap size={18} />
                                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-[10px] px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">Math Sprint</span>
                                        </button>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleChallenge(entry.user_id, 'memory_match');
                                            }}
                                            disabled={challengingId === entry.user_id}
                                            className="p-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white transition-all group/btn relative"
                                            title="Memory Match Challenge"
                                        >
                                            <Brain size={18} />
                                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-[10px] px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">Memory Match</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Row Background Glow */}
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r pointer-events-none ${entry.rank === 1 ? 'from-yellow-400/5 to-transparent' :
                                'from-indigo-600/5 to-transparent'
                                }`} />
                        </div>
                    ))
                ) : (
                    <div className="py-20 text-center text-slate-500">
                        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        <p className="font-medium">No champions found yet.</p>
                    </div>
                )}
            </div>

            {/* Footer Stats */}
            <div className="p-4 bg-white/[0.02] border-t border-white/5 flex justify-center">
                <p className="text-[10px] text-slate-500 font-bold tracking-[0.3em] uppercase">Total Active Community: {entries.length}+ Scholars</p>
            </div>
        </div>
    );
}
