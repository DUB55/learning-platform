'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import ErrorLogger from '@/lib/ErrorLogger';
import {
    BarChart2, TrendingUp, Clock, Target,
    Calendar, Zap, Award,
    Brain, Activity
} from 'lucide-react';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

export default function StatsPage() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalStudyMinutes: 0,
        completedTasks: 0,
        totalTasks: 0,
        streak: 0,
        totalXP: 0,
        level: 1,
        subjectCount: 0
    });
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [masteryData, setMasteryData] = useState<any[]>([]);
    const [trendData, setTrendData] = useState<any[]>([]);
    const [recentLogs, setRecentLogs] = useState<any[]>([]);

    const [monthlyStats, setMonthlyStats] = useState({
        studyHours: 0,
        tasksDone: 0,
        xpGained: 0
    });

    const fetchMonthlyStats = async (targetUserId: string, signal?: AbortSignal) => {
        try {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const isoStart = startOfMonth.toISOString();

            const [sessionsRes, tasksRes, xpRes] = await Promise.all([
                supabase
                    .from('study_sessions')
                    .select('duration_seconds')
                    .eq('user_id', targetUserId)
                    .gte('created_at', isoStart)
                    .abortSignal(signal as any),
                supabase
                    .from('tasks')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', targetUserId)
                    .eq('is_completed', true)
                    .gte('completed_at', isoStart)
                    .abortSignal(signal as any),
                supabase
                    .from('xp_transactions')
                    .select('amount')
                    .eq('user_id', targetUserId)
                    .gte('created_at', isoStart)
                    .abortSignal(signal as any)
            ]);

            const totalSeconds = sessionsRes.data?.reduce((acc: number, s: any) => acc + (s.duration_seconds || 0), 0) || 0;
            const totalXP = xpRes.data?.reduce((acc: number, x: any) => acc + (x.amount || 0), 0) || 0;

            setMonthlyStats({
                studyHours: Math.round((totalSeconds / 3600) * 10) / 10,
                tasksDone: tasksRes.count || 0,
                xpGained: totalXP
            });
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            ErrorLogger.error('Error fetching monthly stats:', error);
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        if (user) {
            const targetId = selectedUserId || user.id;
            fetchStats(targetId, controller.signal);
            fetchVisualData(targetId, controller.signal);
            fetchMonthlyStats(targetId, controller.signal);
            fetchRecentLogs(targetId, controller.signal);
        }
        return () => controller.abort();
    }, [user, selectedUserId]);

    const fetchRecentLogs = async (targetUserId: string, signal?: AbortSignal) => {
        try {
            const { data } = await (supabase
                .from('xp_transactions') as any)
                .select('*')
                .eq('user_id', targetUserId)
                .order('created_at', { ascending: false })
                .limit(16)
                .abortSignal(signal as any);
            setRecentLogs(data || []);
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            ErrorLogger.error('Error fetching recent logs:', error);
        }
    };

    const fetchVisualData = async (targetUserId: string, signal?: AbortSignal) => {
        try {
            // Mastery Radar Data - Fetching from actual mastery_data table
            const { data: masteryRecords } = await (supabase
                .from('mastery_data') as any)
                .select(`
                    mastery_level,
                    subjects (
                        title
                    )
                `)
                .eq('user_id', targetUserId)
                .abortSignal(signal as any);

            if (masteryRecords && masteryRecords.length > 0) {
                const mastery = masteryRecords.map((record: any) => ({
                    subject: (Array.isArray(record.subjects) ? record.subjects[0]?.title : record.subjects?.title)?.substring(0, 10) || 'Unknown',
                    A: record.mastery_level,
                    fullMark: 100
                }));
                setMasteryData(mastery);
            } else {
                // Fallback to subjects if no mastery data yet
                const { data: subjects } = await (supabase
                    .from('subjects') as any)
                    .select('id, title')
                    .eq('user_id', targetUserId)
                    .limit(6)
                    .abortSignal(signal as any);

                if (subjects) {
                    const mastery = subjects.map((s: any) => ({
                        subject: s.title.substring(0, 10),
                        A: 0, // 0 mastery if no data
                        fullMark: 100
                    }));
                    setMasteryData(mastery);
                }
            }

            // Trend Data (Last 7 days) - Fetching from actual xp_transactions
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d.toISOString().split('T')[0];
            }).reverse();

            const { data: xpLogs } = await (supabase
                .from('xp_transactions') as any)
                .select('amount, created_at')
                .eq('user_id', targetUserId)
                .gte('created_at', last7Days[0])
                .abortSignal(signal as any);

            const trends = last7Days.map(date => {
                const dayXP = (xpLogs as any[])
                    ?.filter((log: any) => log.created_at.startsWith(date))
                    .reduce((sum: number, log: any) => sum + (log.amount || 0), 0) || 0;
                
                const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
                return {
                    name: dayName,
                    xp: dayXP,
                    studyTime: Math.floor(dayXP / 10) // Rough estimation: 10 XP per minute
                };
            });
            setTrendData(trends);
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            ErrorLogger.error('Error fetching visual data:', error);
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        const loadUsers = async () => {
            if (profile?.is_admin) {
                try {
                    const { data } = await (supabase
                        .from('profiles') as any)
                        .select('id, username, full_name, is_admin')
                        .order('full_name', { ascending: true })
                        .limit(100)
                        .abortSignal(controller.signal as any);
                    setUsers(data || []);
                } catch (error: any) {
                    if (error.name === 'AbortError') return;
                    ErrorLogger.error('Error loading users:', error);
                }
            }
        };
        loadUsers();
        return () => controller.abort();
    }, [profile?.is_admin]);

    const fetchStats = async (targetUserId: string, signal?: AbortSignal) => {
        try {
            // Fetch XP and Study Minutes
            const { data: xpData } = await (supabase
                .from('user_xp') as any)
                .select('*')
                .eq('user_id', targetUserId)
                .single()
                .abortSignal(signal as any);

            // Fetch Task Stats
            const { count: completedCount } = await (supabase
                .from('tasks') as any)
                .select('*', { count: 'exact', head: true })
                .eq('user_id', targetUserId)
                .eq('is_completed', true)
                .abortSignal(signal as any);

            const { count: totalCount } = await (supabase
                .from('tasks') as any)
                .select('*', { count: 'exact', head: true })
                .eq('user_id', targetUserId)
                .abortSignal(signal as any);

            // Fetch Subject Count
            const { count: subCount } = await (supabase
                .from('subjects') as any)
                .select('*', { count: 'exact', head: true })
                .eq('user_id', targetUserId)
                .abortSignal(signal as any);

            setStats({
                totalStudyMinutes: xpData?.study_minutes || 0,
                completedTasks: completedCount || 0,
                totalTasks: totalCount || 0,
                streak: xpData?.current_streak || 0,
                totalXP: xpData?.total_xp || 0,
                level: xpData?.level || 1,
                subjectCount: subCount || 0
            });
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            ErrorLogger.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const completionRate = stats.totalTasks > 0
        ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-[#0f172a] p-8 pb-32">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-indigo-500/10 rounded-xl">
                            <BarChart2 className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h1 className="text-4xl font-bold text-white">Learning Analytics</h1>
                    </div>
                    <p className="text-slate-400 text-lg max-w-2xl">
                        Track your progress, monitor your study habits, and visualize your growth across all subjects.
                    </p>
                    {profile?.is_admin && (
                        <div className="mt-6 glass-card p-4 flex flex-col md:flex-row items-center gap-4">
                            <div className="text-slate-300 text-sm font-medium">Admin View</div>
                            <select
                                className="bg-[#0f172a] text-white border border-white/10 rounded-lg px-3 py-2 w-full md:w-auto"
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                            >
                                <option value="">{user?.id ? 'Your stats' : 'Select user'}</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {(u.username || u.full_name || 'User') + (u.is_admin ? ' (Admin)' : '')}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </header>

                {/* Primary Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <StatCard
                        icon={<Clock className="w-6 h-6 text-blue-400" />}
                        label="Total Study Time"
                        value={`${Math.round(stats.totalStudyMinutes / 60)}h ${stats.totalStudyMinutes % 60}m`}
                        subValue="All time"
                        color="blue"
                    />
                    <StatCard
                        icon={<Target className="w-6 h-6 text-purple-400" />}
                        label="Task Completion"
                        value={`${completionRate}%`}
                        subValue={`${stats.completedTasks}/${stats.totalTasks} tasks`}
                        color="purple"
                    />
                    <StatCard
                        icon={<Zap className="w-6 h-6 text-yellow-400" />}
                        label="Study Streak"
                        value={`${stats.streak} Days`}
                        subValue="Current streak"
                        color="yellow"
                    />
                    <StatCard
                        icon={<Award className="w-6 h-6 text-emerald-400" />}
                        label="XP Level"
                        value={`Level ${stats.level}`}
                        subValue={`${stats.totalXP.toLocaleString()} total XP`}
                        color="emerald"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Mastery Radar */}
                    <div className="glass-card p-8 flex flex-col items-center border border-white/5 bg-gradient-to-br from-indigo-500/5 to-transparent">
                        <div className="flex justify-between w-full mb-8">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Brain className="w-5 h-5 text-purple-400" />
                                Mastery Overview
                            </h3>
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Skills Radar</span>
                        </div>
                        <div className="h-[300px] w-full" role="img" aria-label="Radar chart showing subject mastery overview">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={masteryData}>
                                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                    <PolarAngleAxis 
                                        dataKey="subject" 
                                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    />
                                    <PolarRadiusAxis 
                                        angle={30} 
                                        domain={[0, 100]} 
                                        tick={false}
                                        axisLine={false}
                                    />
                                    <Radar
                                        name="Mastery"
                                        dataKey="A"
                                        stroke="#818cf8"
                                        fill="#818cf8"
                                        fillOpacity={0.4}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* XP Growth Trend */}
                    <div className="glass-card p-8 border border-white/5">
                        <div className="flex justify-between w-full mb-8">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-emerald-400" />
                                Growth Trends
                            </h3>
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">7-Day XP Trend</span>
                        </div>
                        <div className="h-[300px] w-full" role="img" aria-label="Line chart showing XP growth trends over the last 7 days">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#64748b', fontSize: 12 }} 
                                    />
                                    <YAxis hide />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="xp" 
                                        stroke="#10b981" 
                                        strokeWidth={3} 
                                        dot={{ fill: '#10b981', r: 4 }}
                                        activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Activity Overview */}
                    <div className="lg:col-span-2 glass-card p-8">
                        <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-400" />
                            Activity Breakdown
                        </h3>

                        <div className="space-y-6">
                            <ProgressItem
                                label="Subject Engagement"
                                value={stats.subjectCount > 0 ? (stats.subjectCount / 10) * 100 : 0}
                                text={`${stats.subjectCount} Active Subjects`}
                                color="bg-blue-500"
                            />
            <ProgressItem
                label="Quizzes Completed"
                value={stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}
                text={`${stats.completedTasks}/${stats.totalTasks} Tasks`}
                color="bg-purple-500"
            />
            <ProgressItem
                label="XP Mastery"
                value={Math.min((stats.totalXP / (stats.level * stats.level * 100)) * 100, 100)}
                text={`${stats.totalXP.toLocaleString()} Total XP`}
                color="bg-emerald-500"
            />
                        </div>
                    </div>

                    {/* Quick Stats Sidebar */}
                    <div className="space-y-6">
                        <div className="glass-card p-6 border-l-4 border-indigo-500">
                            <h4 className="text-indigo-400 font-bold text-sm uppercase tracking-wider mb-2">Productivity Tip</h4>
                            <p className="text-white text-sm leading-relaxed">
                                Studies show that spacing out your learning sessions is more effective than cramming. Keep up your {stats.streak} day streak!
                            </p>
                        </div>

                        <div className="glass-card p-6">
                            <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                This Month
                            </h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-sm">Study Hours</span>
                                    <span className="text-white font-medium">{monthlyStats.studyHours}h</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-sm">Tasks Done</span>
                                    <span className="text-white font-medium">{monthlyStats.tasksDone}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-sm">XP Gained</span>
                                    <span className="text-white font-medium">{monthlyStats.xpGained.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity Logs - The "16 Logs" section */}
                <div className="mt-12 glass-card p-8 border border-white/5">
                    <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-400" />
                        Recent Activity Logs
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {recentLogs.length > 0 ? (
                            recentLogs.map((log) => (
                                <div key={log.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">+{log.amount} XP</span>
                                        <span className="text-[10px] text-slate-500">{new Date(log.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-white font-medium line-clamp-1">{log.reason?.replace(/_/g, ' ')}</p>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center">
                                <p className="text-slate-500 italic">No recent activity logs found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, subValue, color }: any) {
    const borderColors = {
        blue: 'hover:border-blue-500/20',
        purple: 'hover:border-purple-500/20',
        yellow: 'hover:border-yellow-500/20',
        emerald: 'hover:border-emerald-500/20',
    };

    return (
        <div className={`glass-card p-6 transition-all duration-300 border border-white/5 ${borderColors[color as keyof typeof borderColors]}`}>
            <div className="mb-4 bg-white/5 w-12 h-12 rounded-xl flex items-center justify-center border border-white/5">
                {icon}
            </div>
            <h3 className="text-slate-400 text-sm font-medium mb-1">{label}</h3>
            <p className="text-2xl font-bold text-white mb-1">{value}</p>
            <p className="text-xs text-slate-500">{subValue}</p>
        </div>
    );
}

function ProgressItem({ label, value, text, color }: any) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-slate-300 font-medium">{label}</span>
                <span className="text-white">{text}</span>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px]">
                <div
                    className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}
