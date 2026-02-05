'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserXP } from '@/contexts/UserXPContext';
import { xpService, Achievement, UserAchievement, UserXP } from '@/lib/xpService';
import AchievementCard from '@/components/Gamification/AchievementCard';
import XPProgressBar from '@/components/Gamification/XPProgressBar';
import { Trophy, Medal, Target, Star, Filter, Search, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorLogger from '@/lib/ErrorLogger';

export default function AchievementsPage() {
    const { user } = useAuth();
    const { userXP: contextUserXP } = useUserXP();
    const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
    const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
    const [userXP, setUserXP] = useState<UserXP | null>(null);

    useEffect(() => {
        if (contextUserXP) {
            setUserXP(contextUserXP);
        }
    }, [contextUserXP]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const [all, userAch, xp] = await Promise.all([
                    xpService.getAllAchievements(controller.signal),
                    xpService.getUserAchievements(user.id, controller.signal),
                    xpService.getUserXP(user.id, controller.signal)
                ]);
                setAllAchievements(all);
                setUserAchievements(userAch);
                setUserXP(xp);
            } catch (error: any) {
                if (error.name === 'AbortError') return;
                ErrorLogger.error('Error fetching achievements data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        return () => controller.abort();
    }, [user]);

    const categories = ['all', ...Array.from(new Set(allAchievements.map(a => a.category)))];

    const filteredAchievements = allAchievements.filter(ach => {
        const isUnlocked = userAchievements.some(ua => ua.achievement_id === ach.id);
        const matchesStatus = filter === 'all' || (filter === 'unlocked' && isUnlocked) || (filter === 'locked' && !isUnlocked);
        const matchesCategory = categoryFilter === 'all' || ach.category === categoryFilter;
        const matchesSearch = ach.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             ach.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesCategory && matchesSearch;
    });

    const stats = {
        total: allAchievements.length,
        unlocked: userAchievements.length,
        locked: allAchievements.length - userAchievements.length,
        percentage: allAchievements.length > 0 ? Math.round((userAchievements.length / allAchievements.length) * 100) : 0
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-slate-400 font-medium">Loading your achievements...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0f172a] border border-white/5 p-8 lg:p-12 shadow-2xl">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                    <div className="space-y-4 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                            <Trophy size={16} />
                            <span className="text-xs font-black uppercase tracking-widest">Rewards & Recognition</span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight">
                            Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Achievements</span>
                        </h1>
                        <p className="text-lg text-slate-400 font-medium leading-relaxed">
                            Collect badges and earn XP by completing tasks, maintaining streaks, and mastering your subjects. Each achievement brings you closer to becoming a top student!
                        </p>
                    </div>

                    <div className="flex-shrink-0 w-full lg:w-80 bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-xl">
                        {userXP && (
                            <XPProgressBar 
                                currentXp={userXP.total_xp}
                                level={userXP.level}
                            />
                        )}
                        <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <span className="block text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Unlocked</span>
                                <span className="text-2xl font-black text-white">{stats.unlocked}</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Completion</span>
                                <span className="text-2xl font-black text-blue-400">{stats.percentage}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-2">
                    <button 
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === 'all' ? 'bg-white text-slate-900 shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        All Badges
                    </button>
                    <button 
                        onClick={() => setFilter('unlocked')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === 'unlocked' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        Unlocked
                    </button>
                    <button 
                        onClick={() => setFilter('locked')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === 'locked' ? 'bg-slate-700 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        Locked
                    </button>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                            type="text"
                            placeholder="Search achievements..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                    </div>
                    <select 
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat} className="bg-slate-900">{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredAchievements.map((ach) => (
                        <motion.div
                            key={ach.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                        >
                            <AchievementCard 
                                name={ach.name}
                                description={ach.description}
                                icon={ach.icon}
                                xpReward={ach.xp_reward}
                                isUnlocked={userAchievements.some(ua => ua.achievement_id === ach.id)}
                                unlockedAt={userAchievements.find(ua => ua.achievement_id === ach.id)?.unlocked_at}
                                category={ach.category}
                                requirementType={(ach as any).requirement_type || undefined}
                                requirementValue={(ach as any).requirement_value || undefined}
                                currentValue={
                                    (ach as any).requirement_type === 'study_minutes' ? userXP?.study_minutes :
                                    (ach as any).requirement_type === 'tasks_completed' ? userXP?.tasks_completed :
                                    (ach as any).requirement_type === 'streak' ? userXP?.current_streak : 0
                                }
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filteredAchievements.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="p-6 rounded-full bg-white/5 text-slate-600">
                        <Target size={48} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">No achievements found</h3>
                        <p className="text-slate-500">Try adjusting your filters or search query.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
