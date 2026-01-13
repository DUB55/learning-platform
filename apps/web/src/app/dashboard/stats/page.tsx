'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
    Trophy, Flame, Clock, Target,
    TrendingUp, Calendar, Zap, Brain
} from 'lucide-react';
import { xpService, UserXP } from '@/lib/xpService';

export default function MobileStatsPage() {
    const { user } = useAuth();
    const [xpData, setXpData] = useState<UserXP | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            // Get Current XP Stats
            const xp = await xpService.getUserXP(user!.id);
            setXpData(xp);

            // Get XP History (Last 7 days transactions grouped by day - simplified simulation for now as we don't have aggregated daily table yet)
            // Actually we have xp_transactions. Let's fetch last 50 transactions and group them client side for the chart
            const { data: transactions } = await supabase
                .from('xp_transactions')
                .select('*')
                .eq('user_id', user!.id)
                .order('created_at', { ascending: false })
                .limit(100);

            if (transactions) {
                // simple grouping by date
                const days = new Map();
                // Initialize last 7 days
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    days.set(d.toISOString().split('T')[0], 0);
                }

                transactions.forEach((t: any) => {
                    const date = t.created_at.split('T')[0];
                    if (days.has(date)) {
                        days.set(date, days.get(date) + t.amount);
                    }
                });

                const chartData = Array.from(days.entries()).map(([date, amount]) => ({
                    date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
                    amount
                }));
                setHistory(chartData);
            }

        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null;

    const maxChartValue = Math.max(...history.map(h => h.amount), 100);

    return (
        <div className="h-full overflow-y-auto p-8 animate-fade-in">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white mb-2">My Statistics</h1>
                    <p className="text-slate-400">Track your learning progress and achievements</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Trophy className="w-16 h-16 text-yellow-500" />
                        </div>
                        <p className="text-slate-400 text-sm font-medium">Total XP</p>
                        <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                            {xpData?.total_xp.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">Level {xpData?.level}</p>
                    </div>

                    <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Flame className="w-16 h-16 text-orange-500" />
                        </div>
                        <p className="text-slate-400 text-sm font-medium">Daily Streak</p>
                        <p className="text-3xl font-bold text-white">
                            {xpData?.current_streak} <span className="text-base font-normal text-slate-500">days</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-2">Best: {xpData?.longest_streak} days</p>
                    </div>

                    <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Clock className="w-16 h-16 text-blue-500" />
                        </div>
                        <p className="text-slate-400 text-sm font-medium">Study Time</p>
                        <p className="text-3xl font-bold text-white">
                            {Math.floor((xpData?.study_minutes || 0) / 60)} <span className="text-base font-normal text-slate-500">hrs</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-2">{(xpData?.study_minutes || 0) % 60} mins</p>
                    </div>

                    <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Target className="w-16 h-16 text-green-500" />
                        </div>
                        <p className="text-slate-400 text-sm font-medium">Tasks Done</p>
                        <p className="text-3xl font-bold text-white">
                            {xpData?.tasks_completed}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">Completed</p>
                    </div>
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Activity Chart */}
                    <div className="lg:col-span-2 glass-card p-6">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-400" />
                                Weekly Activity (XP)
                            </h2>
                        </div>

                        <div className="h-64 flex items-end justify-between gap-2">
                            {history.map((day, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div className="w-full bg-slate-800 rounded-t-lg relative h-full flex items-end overflow-hidden group-hover:bg-slate-700/50 transition-colors">
                                        <div
                                            className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-lg transition-all duration-500 ease-out opacity-80 group-hover:opacity-100"
                                            style={{ height: `${(day.amount / maxChartValue) * 100}%` }}
                                        >
                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded pointer-events-none transition-opacity">
                                                {day.amount} XP
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-500 font-medium uppercase">{day.date}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Motivators */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            Next Milestones
                        </h2>

                        <div className="space-y-6">
                            {/* Next Level */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-300">Level Progress</span>
                                    <span className="text-blue-400 font-bold">{Math.floor(((xpData?.total_xp || 0) % 100))}%</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                        style={{ width: `${(xpData?.total_xp || 0) % 100}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    {Math.pow((xpData?.level || 0) + 1, 2) * 100 - (xpData?.total_xp || 0)} XP to Level {(xpData?.level || 0) + 1}
                                </p>
                            </div>

                            {/* Today's Goal (Simulated) */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-300">Daily Goal</span>
                                    <span className="text-green-400 font-bold">3/5 Tasks</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" style={{ width: '60%' }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5">
                            <h3 className="text-sm font-medium text-white mb-4">Focus Distribution</h3>
                            <div className="flex gap-2 flex-wrap">
                                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">Math (40%)</span>
                                <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs border border-purple-500/20">History (30%)</span>
                                <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs border border-orange-500/20">Science (30%)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
