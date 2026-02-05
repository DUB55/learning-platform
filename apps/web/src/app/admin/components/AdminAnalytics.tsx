'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    Users, Database, Sparkles, AlertCircle, 
    TrendingUp, Activity, BookOpen, FileText,
    CheckCircle2, Clock, BarChart3
} from 'lucide-react';
import ErrorLogger from '@/lib/ErrorLogger';

interface AnalyticsData {
    users: {
        total: number;
        newToday: number;
        admins: number;
    };
    content: {
        subjects: number;
        units: number;
        documents: number;
    };
    ai: {
        totalChats: number;
        messagesToday: number;
    };
    system: {
        errorsToday: number;
        activeCritical: number;
        uptime: string;
    };
}

export default function AdminAnalytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayISO = today.toISOString();

            // 1. User Stats
            const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const { count: admins } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', true);
            const { count: newToday } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayISO);

            // 2. Content Stats
            const { count: totalSubjects } = await supabase.from('subjects').select('*', { count: 'exact', head: true });
            const { count: totalUnits } = await supabase.from('units').select('*', { count: 'exact', head: true });
            const { count: totalDocs } = await supabase.from('documents').select('*', { count: 'exact', head: true });

            // 3. AI Stats
            const { count: totalChats } = await supabase.from('ai_chats').select('*', { count: 'exact', head: true });
            const { count: aiMsgsToday } = await supabase.from('ai_messages').select('*', { count: 'exact', head: true }).gte('created_at', todayISO);

            // 4. System Stats
            const { count: errorsToday } = await supabase.from('error_logs').select('*', { count: 'exact', head: true }).gte('created_at', todayISO);
            const { count: criticalErrors } = await supabase.from('error_logs').select('*', { count: 'exact', head: true }).eq('level', 'error').gte('created_at', todayISO);

            setData({
                users: {
                    total: totalUsers || 0,
                    newToday: newToday || 0,
                    admins: admins || 0
                },
                content: {
                    subjects: totalSubjects || 0,
                    units: totalUnits || 0,
                    documents: totalDocs || 0
                },
                ai: {
                    totalChats: totalChats || 0,
                    messagesToday: aiMsgsToday || 0
                },
                system: {
                    errorsToday: errorsToday || 0,
                    activeCritical: criticalErrors || 0,
                    uptime: '99.9%'
                }
            });
        } catch (error) {
            ErrorLogger.error('Failed to fetch admin analytics', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !data) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="glass-card h-32 bg-white/5" />
                ))}
            </div>
        );
    }

    const cards = [
        {
            title: 'User Growth',
            value: data.users.total.toLocaleString(),
            sub: `+${data.users.newToday} today`,
            icon: Users,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10'
        },
        {
            title: 'Learning Content',
            value: data.content.documents.toLocaleString(),
            sub: `${data.content.subjects} Subjects`,
            icon: BookOpen,
            color: 'text-purple-400',
            bg: 'bg-purple-400/10'
        },
        {
            title: 'AI Engagement',
            value: data.ai.totalChats.toLocaleString(),
            sub: `${data.ai.messagesToday} msgs today`,
            icon: Sparkles,
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10'
        },
        {
            title: 'System Health',
            value: data.system.activeCritical === 0 ? 'Optimal' : 'Issues',
            sub: `${data.system.errorsToday} logs today`,
            icon: Activity,
            color: data.system.activeCritical === 0 ? 'text-emerald-400' : 'text-red-400',
            bg: data.system.activeCritical === 0 ? 'bg-emerald-400/10' : 'bg-red-400/10'
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => (
                    <div key={i} className="glass-card p-6 relative overflow-hidden group hover:bg-white/5 transition-all">
                        <div className={`absolute top-0 right-0 p-3 ${card.bg} rounded-bl-2xl opacity-50 group-hover:opacity-100 transition-opacity`}>
                            <card.icon className={`w-5 h-5 ${card.color}`} />
                        </div>
                        <div className="text-slate-500 text-sm font-medium mb-1">{card.title}</div>
                        <div className="text-3xl font-bold text-white mb-2">{card.value}</div>
                        <div className="flex items-center gap-1.5">
                            <TrendingUp className={`w-3 h-3 ${card.color}`} />
                            <span className="text-xs text-slate-400">{card.sub}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Detailed User Stats */}
                <div className="glass-card p-6 lg:col-span-1">
                    <h3 className="text-white font-medium mb-6 flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        User Distribution
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white/2 rounded-xl">
                            <span className="text-sm text-slate-400">Total Users</span>
                            <span className="text-sm font-bold text-white">{data.users.total}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/2 rounded-xl">
                            <span className="text-sm text-slate-400">Administrators</span>
                            <span className="text-sm font-bold text-red-400">{data.users.admins}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/2 rounded-xl">
                            <span className="text-sm text-slate-400">Active Today</span>
                            <span className="text-sm font-bold text-emerald-400">{data.users.newToday}</span>
                        </div>
                    </div>
                </div>

                {/* Content Breakdown */}
                <div className="glass-card p-6 lg:col-span-1">
                    <h3 className="text-white font-medium mb-6 flex items-center gap-2">
                        <Database className="w-4 h-4 text-purple-400" />
                        Content Statistics
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white/2 rounded-xl">
                            <div className="flex items-center gap-3">
                                <BookOpen className="w-4 h-4 text-purple-400" />
                                <span className="text-sm text-slate-400">Subjects</span>
                            </div>
                            <span className="text-sm font-bold text-white">{data.content.subjects}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/2 rounded-xl">
                            <div className="flex items-center gap-3">
                                <BarChart3 className="w-4 h-4 text-blue-400" />
                                <span className="text-sm text-slate-400">Units/Chapters</span>
                            </div>
                            <span className="text-sm font-bold text-white">{data.content.units}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/2 rounded-xl">
                            <div className="flex items-center gap-3">
                                <FileText className="w-4 h-4 text-emerald-400" />
                                <span className="text-sm text-slate-400">Documents</span>
                            </div>
                            <span className="text-sm font-bold text-white">{data.content.documents}</span>
                        </div>
                    </div>
                </div>

                {/* System Monitoring */}
                <div className="glass-card p-6 lg:col-span-1">
                    <h3 className="text-white font-medium mb-6 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-orange-400" />
                        System Health
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white/2 rounded-xl">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span className="text-sm text-slate-400">System Uptime</span>
                            </div>
                            <span className="text-sm font-bold text-emerald-400">{data.system.uptime}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/2 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Clock className="w-4 h-4 text-blue-400" />
                                <span className="text-sm text-slate-400">Errors Today</span>
                            </div>
                            <span className="text-sm font-bold text-white">{data.system.errorsToday}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/2 rounded-xl">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-4 h-4 text-red-400" />
                                <span className="text-sm text-slate-400">Critical Issues</span>
                            </div>
                            <span className={`text-sm font-bold ${data.system.activeCritical > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {data.system.activeCritical}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
