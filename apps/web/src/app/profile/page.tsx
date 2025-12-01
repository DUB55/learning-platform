'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { User, Mail, Calendar, Trophy, Flame, TrendingUp, Award, Zap } from 'lucide-react';
import { xpService, UserXP, Achievement, UserAchievement } from '@/lib/xpService';

export default function ProfilePage() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();

    const [userXP, setUserXP] = useState<UserXP | null>(null);
    const [achievements, setAchievements] = useState<UserAchievement[]>([]);
    const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
        if (user) {
            fetchGamificationData();
        }
    }, [user, authLoading, router]);

    const fetchGamificationData = async () => {
        if (!user) return;

        try {
            const [xpData, userAchs, allAchs] = await Promise.all([
                xpService.getUserXP(user.id),
                xpService.getUserAchievements(user.id),
                xpService.getAllAchievements()
            ]);

            setUserXP(xpData);
            setAchievements(userAchs);
            setAllAchievements(allAchs);
        } catch (error) {
            console.error('Error fetching gamification data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    const xpForNext = userXP ? xpService.xpForNextLevel(userXP.level) : 100;
    const xpProgress = userXP ? ((userXP.total_xp % xpForNext) / xpForNext) * 100 : 0;
    const unlockedIds = new Set(achievements.map(a => a.achievement_id));

    return (
        <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto relative p-8">
                <div className="max-w-5xl mx-auto">
                    <header className="mb-10">
                        <h1 className="text-3xl font-serif font-bold text-white mb-2">Profile</h1>
                        <p className="text-slate-400">Your public profile and activity</p>
                    </header>

                    {/* Profile Info Card */}
                    <div className="glass-card p-8 mb-6">
                        <div className="flex items-start gap-6">
                            {/* Avatar */}
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[3px]">
                                {profile?.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt="Profile"
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-2xl">
                                        {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0].toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-white mb-1">
                                    {profile?.full_name || 'User'}
                                </h2>
                                <p className="text-slate-400 mb-4">{user?.email}</p>

                                <div className="flex gap-4 text-sm flex-wrap">
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <Calendar className="w-4 h-4" />
                                        <span>Joined {new Date(user?.created_at || '').toLocaleDateString()}</span>
                                    </div>
                                    {profile?.is_admin && (
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/50 uppercase">
                                                Admin
                                            </span>
                                        </div>
                                    )}
                                    {userXP && (
                                        <div className="flex items-center gap-2 text-purple-400">
                                            <Zap className="w-4 h-4" />
                                            <span className="font-medium">Level {userXP.level}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Gamification Stats */}
                    {userXP && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Level & XP */}
                            <div className="glass-card p-6 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                    <Trophy className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-1">Level {userXP.level}</h3>
                                <p className="text-slate-400 text-sm mb-4">{userXP.total_xp.toLocaleString()} Total XP</p>

                                {/* Progress bar */}
                                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500"
                                        style={{ width: `${xpProgress}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-slate-500">
                                    {userXP.total_xp % xpForNext} / {xpForNext} XP to Level {userXP.level + 1}
                                </p>
                            </div>

                            {/* Current Streak */}
                            <div className="glass-card p-6 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                                    <Flame className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-1">{userXP.current_streak} Days</h3>
                                <p className="text-slate-400 text-sm">Current Streak</p>
                            </div>

                            {/* Longest Streak */}
                            <div className="glass-card p-6 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                                    <TrendingUp className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-1">{userXP.longest_streak} Days</h3>
                                <p className="text-slate-400 text-sm">Best Streak</p>
                            </div>
                        </div>
                    )}

                    {/* Achievements */}
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Award className="w-6 h-6 text-yellow-400" />
                            <h2 className="text-2xl font-bold text-white">Achievements</h2>
                            <span className="text-slate-400 text-sm">
                                {achievements.length} / {allAchievements.length} unlocked
                            </span>
                        </div>

                        {allAchievements.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {allAchievements.map((ach) => {
                                    const unlocked = unlockedIds.has(ach.id);
                                    const userAch = achievements.find(a => a.achievement_id === ach.id);

                                    return (
                                        <div
                                            key={ach.id}
                                            className={`glass-card p-5 transition-all ${unlocked
                                                    ? 'border-yellow-500/30 bg-yellow-500/5'
                                                    : 'opacity-50 saturate-0'
                                                }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`text-3xl ${unlocked ? '' : 'opacity-30'}`}>
                                                    {unlocked ? ach.icon : '🔒'}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-white font-medium mb-1">{ach.name}</h3>
                                                    <p className="text-slate-400 text-sm mb-2">{ach.description}</p>
                                                    <div className="flex items-center gap-2 text-xs flex-wrap">
                                                        <span className={`px-2 py-0.5 rounded ${unlocked ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-800 text-slate-500'
                                                            }`}>
                                                            {ach.xp_reward} XP
                                                        </span>
                                                        {unlocked && userAch && (
                                                            <span className="text-slate-500">
                                                                {new Date(userAch.unlocked_at).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="glass-card p-8 text-center">
                                <p className="text-slate-400">Complete activities to unlock achievements!</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
