'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

import {
    Bell,
    Search,
    Zap,
    Clock,
    Target,
    MoreHorizontal,
    Calendar as CalendarIcon
} from 'lucide-react';
import ProfileMenu from '@/components/ProfileMenu';
import NotificationMenu from '@/components/NotificationMenu';
import ResourceContextMenu from '@/components/ResourceContextMenu';
import { Edit2, Trash2 } from 'lucide-react';

export default function Dashboard() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [subjects, setSubjects] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [stats, setStats] = useState({
        streak: 0,
        totalStudyTime: 0,
        completedTasks: 0,
        totalTasks: 0
    });
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [resourceMenu, setResourceMenu] = useState<{ x: number; y: number; resource: any } | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            // Fetch subjects (limit to 6 for dashboard)
            const { data: subjectsData } = await (supabase.from('subjects') as any)
                .select('*')
                .order('created_at', { ascending: false })
                .limit(6);

            if (subjectsData) {
                // Get unit counts for each subject
                const subjectsWithCounts = await Promise.all(
                    subjectsData.map(async (subject) => {
                        const { count } = await supabase
                            .from('units')
                            .select('*', { count: 'exact', head: true })
                            .eq('subject_id', subject.id);
                        return { ...subject, unit_count: count || 0 };
                    })
                );
                setSubjects(subjectsWithCounts);
            }

            // Fetch upcoming calendar events (next 5)
            const today = new Date().toISOString();
            const { data: eventsData } = await (supabase.from('calendar_events') as any)
                .select('*')
                .gte('start_date', today)
                .order('start_date', { ascending: true })
                .limit(5);

            if (eventsData) setUpcomingEvents(eventsData);

            // Still fetch tasks for stats
            const { data: tasksData } = await supabase
                .from('tasks')
                .select('*')
                .order('due_date', { ascending: true });

            if (tasksData) setTasks(tasksData);

            // Fetch study sessions for stats
            const { data: sessionsData } = await supabase
                .from('study_sessions')
                .select('duration_seconds, created_at')
                .returns<{ duration_seconds: number, created_at: string }[]>();

            const totalSeconds = sessionsData?.reduce((acc: number, curr: any) => acc + (curr.duration_seconds || 0), 0) || 0;


            // Fetch streak data from gamification
            const { data: streakData } = await (supabase
                .from('daily_streaks') as any)
                .select('current_streak')
                .eq('user_id', user!.id)
                .single();

            // Count completed tasks
            const { count: completedCount } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user!.id)
                .eq('completed', true);

            // Count total tasks
            const { count: totalCount } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user!.id);

            // Fetch XP data for study time (from TimeTracker) which is more accurate for "tab open" time
            const { data: xpData } = await (supabase
                .from('user_xp') as any)
                .select('study_minutes, current_streak')
                .eq('user_id', user!.id)
                .single();

            setStats({
                streak: xpData?.current_streak || streakData?.current_streak || 0,
                totalStudyTime: xpData?.study_minutes ? Math.round(xpData.study_minutes / 60) : Math.round(totalSeconds / 3600),
                completedTasks: completedCount || 0,
                totalTasks: totalCount || 0
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleMenuClick = (e: React.MouseEvent, subject: any) => {
        e.preventDefault();
        setResourceMenu({ x: e.clientX, y: e.clientY, resource: subject });
    };

    const handleDeleteSubject = async (subject: any) => {
        if (!confirm('Are you sure you want to delete this subject?')) return;

        const { error } = await (supabase.from('subjects') as any)
            .delete()
            .eq('id', subject.id);

        if (!error) {
            fetchDashboardData();
        }
        setResourceMenu(null);
    };

    const menuItems = useMemo(() => {
        if (!resourceMenu) return [];

        return [
            {
                icon: <Edit2 className="w-4 h-4" />,
                label: 'Edit',
                onClick: () => router.push(`/subjects/${resourceMenu.resource.id}/edit`)
            },
            {
                icon: <Trash2 className="w-4 h-4" />,
                label: 'Delete',
                onClick: () => handleDeleteSubject(resourceMenu.resource),
                danger: true
            }
        ];
    }, [resourceMenu, router]);

    if (loading || isLoadingData) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <>
            {/* Main Content */}
            <div className="relative">
                {/* Background Gradients */}
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] opacity-50"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] opacity-50"></div>
                </div>

                <div className="relative z-10 p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <header className="flex justify-between items-center mb-10">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-serif font-bold text-white">
                                    Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{user.user_metadata.full_name?.split(' ')[0] || 'Student'}!</span>
                                </h1>
                                {profile?.is_admin && (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/50 uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                                        Admin
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-400">Let's continue your learning journey</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="bg-slate-800/50 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors w-64"
                                />
                            </div>
                            <NotificationMenu userId={user.id} />
                            <ProfileMenu />
                        </div>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <StatCard
                            title="Study Streak"
                            value={`${stats.streak} days`}
                            icon={<Zap className="w-5 h-5 text-emerald-400" />}
                            progress={Math.min(stats.streak * 10, 100)}
                            color="emerald"
                        />
                        <StatCard
                            title="Total Study Time"
                            value={`${stats.totalStudyTime}h`}
                            icon={<Clock className="w-5 h-5 text-blue-400" />}
                            progress={Math.min(stats.totalStudyTime * 2, 100)}
                            color="blue"
                        />
                        <StatCard
                            title="Tasks Completed"
                            value={`${stats.completedTasks}/${stats.totalTasks}`}
                            icon={<Target className="w-5 h-5 text-purple-400" />}
                            progress={stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}
                            color="purple"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Subjects Section */}
                        <div className="lg:col-span-2">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">Your Subjects</h2>
                                <button
                                    onClick={() => router.push('/subjects')}
                                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    View All
                                </button>
                            </div>

                            {subjects.length === 0 ? (
                                <div className="glass-card p-8 text-center">
                                    <p className="text-slate-400 mb-4">You haven't added any subjects yet.</p>
                                    <button
                                        onClick={() => router.push('/subjects')}
                                        className="glass-button px-6 py-2 rounded-lg"
                                    >
                                        Add Subject
                                    </button>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-6">
                                    {subjects.map((subject) => (
                                        <SubjectCard
                                            key={subject.id}
                                            title={subject.title}
                                            chapters={`${subject.unit_count || 0} units`}
                                            progress={0}
                                            time="0h studied"
                                            streak="0 days"
                                            color={subject.color || 'blue'}
                                            onClick={() => router.push(`/subjects/${subject.id}/units`)}
                                            onMenu={(e: any) => handleMenuClick(e, subject)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Upcoming Events Section */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-white">Upcoming Events</h2>
                            <div className="space-y-4">
                                {upcomingEvents.length === 0 ? (
                                    <div className="glass-card p-6 text-center">
                                        <p className="text-slate-400 text-sm">No upcoming events.</p>
                                        <button
                                            onClick={() => router.push('/calendar')}
                                            className="text-sm text-blue-400 hover:text-blue-300 mt-2"
                                        >
                                            View Calendar
                                        </button>
                                    </div>
                                ) : (
                                    upcomingEvents.map((event) => (
                                        <UpcomingCard
                                            key={event.id}
                                            title={event.title}
                                            subject={event.description || ''}
                                            date={new Date(event.start_date).toLocaleDateString()}
                                            time={new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            type="event"
                                            color={event.color || 'blue'}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {resourceMenu && (
                    <ResourceContextMenu
                        items={menuItems}
                        position={resourceMenu}
                        onClose={() => setResourceMenu(null)}
                        resourceType="subject"
                        isGlobal={resourceMenu.resource.is_global}
                        isAdmin={profile?.is_admin || false}
                    />
                )}
            </div>
        </>
    );
}

function StatCard({ title, value, icon, progress, color }: { title: string, value: string, icon: React.ReactNode, progress: number, color: string }) {
    const colors = {
        emerald: 'bg-emerald-500',
        blue: 'bg-blue-500',
        purple: 'bg-purple-500',
    };

    return (
        <div className="glass-card p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-slate-400 font-medium text-sm mb-1">{title}</h3>
                    <p className="text-white font-medium">{value}</p>
                </div>
                <div className="p-2 bg-white/5 rounded-lg border border-white/10 group-hover:scale-110 transition-transform duration-300">
                    {icon}
                </div>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${colors[color as keyof typeof colors]} transition-all duration-1000 ease-out`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <div className="mt-2 text-right text-xs text-slate-500">{progress}%</div>
        </div>
    );
}

function SubjectCard({ title, chapters, progress, time, streak, color, onClick, onMenu }: any) {
    const colors = {
        cyan: 'border-cyan-500/50',
        orange: 'border-orange-500/50',
        emerald: 'border-emerald-500/50',
        purple: 'border-purple-500/50',
        blue: 'border-blue-500/50',
    };

    const barColors = {
        cyan: 'bg-cyan-500',
        orange: 'bg-orange-500',
        emerald: 'bg-emerald-500',
        purple: 'bg-purple-500',
        blue: 'bg-blue-500',
    };

    return (
        <div
            className={`glass-card p-6 border-l-4 ${colors[color] || colors.blue} hover:bg-white/5 transition-all duration-300 group cursor-pointer relative`}
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
                    <p className="text-slate-400 text-sm">{chapters}</p>
                </div>
                <button
                    className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                    onClick={(e) => {
                        e.stopPropagation();
                        onMenu(e);
                    }}
                >
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>

            <div className="mb-4">
                <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-500">Progress</span>
                    <span className="text-white font-medium">{progress}% complete</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full ${barColors[color] || barColors.blue} transition-all duration-1000 ease-out group-hover:brightness-110`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 pt-4 border-t border-white/5">
                <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{time}</span>
                </div>
                <div className="flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    <span>{streak}</span>
                </div>
            </div>
        </div>
    );
}

function UpcomingCard({ title, subject, date, time, type }: any) {
    const types = {
        test: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        review: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        deadline: 'bg-red-500/10 text-red-400 border-red-500/20',
        assignment: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        event: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    };

    return (
        <div className="glass-card p-4 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer">
            <div className="flex-1">
                <h4 className="text-white font-medium mb-1">{title}</h4>
                <p className="text-slate-400 text-sm">{subject}</p>
            </div>
            <div className="text-right">
                <div className={`text-xs px-2 py-1 rounded-full border ${types[type] || types.event} inline-block mb-1`}>
                    {type}
                </div>
                <div className="text-slate-500 text-xs flex items-center justify-end gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    {date}
                </div>
            </div>
        </div>
    );
}
