'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    BookOpen,
    Calendar as CalendarIcon,
    CheckSquare,
    Zap,
    Library,
    Settings,
    LogOut,
    Bell,
    Search,
    MoreHorizontal,
    TrendingUp,
    Clock,
    Target
} from 'lucide-react';

export default function Dashboard() {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-serif font-bold text-white tracking-tight">LearnHub</span>
                    </div>

                    <nav className="space-y-1">
                        <SidebarItem icon={<LayoutDashboard />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                        <SidebarItem icon={<BookOpen />} label="Subjects" active={activeTab === 'subjects'} onClick={() => setActiveTab('subjects')} />
                        <SidebarItem icon={<CalendarIcon />} label="Calendar" active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
                        <SidebarItem icon={<CheckSquare />} label="To-do" active={activeTab === 'todo'} onClick={() => setActiveTab('todo')} />
                        <SidebarItem icon={<Zap />} label="Study Modes" active={activeTab === 'modes'} onClick={() => setActiveTab('modes')} />
                        <SidebarItem icon={<Library />} label="Library" active={activeTab === 'library'} onClick={() => setActiveTab('library')} />
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-white/5">
                    <nav className="space-y-1">
                        <SidebarItem icon={<Settings />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                        <button
                            onClick={() => signOut()}
                            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 group"
                        >
                            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">Sign Out</span>
                        </button>
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative">
                {/* Background Gradients */}
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] opacity-50"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] opacity-50"></div>
                </div>

                <div className="relative z-10 p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <header className="flex justify-between items-center mb-10">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-white mb-1">
                                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Alex!</span>
                            </h1>
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
                            <button className="w-10 h-10 rounded-full bg-slate-800/50 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors relative">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900"></span>
                            </button>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px]">
                                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white font-medium text-sm">
                                    JD
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <StatCard
                            title="Study Streak"
                            value="7 of 30 completed"
                            icon={<Zap className="w-5 h-5 text-emerald-400" />}
                            progress={23}
                            color="emerald"
                        />
                        <StatCard
                            title="Weekly Goal"
                            value="12 of 20 completed"
                            icon={<Target className="w-5 h-5 text-blue-400" />}
                            progress={60}
                            color="blue"
                        />
                        <StatCard
                            title="Reviews Due"
                            value="8 of 15 completed"
                            icon={<Clock className="w-5 h-5 text-purple-400" />}
                            progress={53}
                            color="purple"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Subjects */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white">Your Subjects</h2>
                                <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">View All</button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <SubjectCard
                                    title="Mathematics"
                                    chapters="8/12 chapters"
                                    progress={68}
                                    time="24h studied"
                                    streak="3 days"
                                    color="cyan"
                                />
                                <SubjectCard
                                    title="Physics"
                                    chapters="5/10 chapters"
                                    progress={45}
                                    time="18h studied"
                                    streak="1 week"
                                    color="orange"
                                />
                                <SubjectCard
                                    title="Chemistry"
                                    chapters="7/8 chapters"
                                    progress={82}
                                    time="32h studied"
                                    streak="Today"
                                    color="emerald"
                                />
                                <SubjectCard
                                    title="Biology"
                                    chapters="9/15 chapters"
                                    progress={56}
                                    time="21h studied"
                                    streak="5 days"
                                    color="purple"
                                />
                            </div>
                        </div>

                        {/* Upcoming */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-white">Upcoming</h2>
                            <div className="space-y-4">
                                <UpcomingCard
                                    title="Calculus Midterm"
                                    subject="Mathematics"
                                    date="May 28"
                                    time="2:00 PM"
                                    type="test"
                                />
                                <UpcomingCard
                                    title="Newton's Laws Review"
                                    subject="Physics"
                                    date="May 25"
                                    time="4:30 PM"
                                    type="review"
                                />
                                <UpcomingCard
                                    title="Lab Report Due"
                                    subject="Chemistry"
                                    date="May 26"
                                    time="11:59 PM"
                                    type="deadline"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
        >
            <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                {icon}
            </div>
            <span className="font-medium">{label}</span>
        </button>
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

function SubjectCard({ title, chapters, progress, time, streak, color }: any) {
    const colors = {
        cyan: 'border-cyan-500/50',
        orange: 'border-orange-500/50',
        emerald: 'border-emerald-500/50',
        purple: 'border-purple-500/50',
    };

    const barColors = {
        cyan: 'bg-cyan-500',
        orange: 'bg-orange-500',
        emerald: 'bg-emerald-500',
        purple: 'bg-purple-500',
    };

    return (
        <div className={`glass-card p-6 border-l-4 ${colors[color]} hover:bg-white/5 transition-all duration-300 group`}>
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
                    <p className="text-slate-400 text-sm">{chapters}</p>
                </div>
                <button className="text-slate-500 hover:text-white transition-colors">
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
                        className={`h-full rounded-full ${barColors[color]} transition-all duration-1000 ease-out group-hover:brightness-110`}
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
    };

    return (
        <div className="glass-card p-4 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer">
            <div className="flex-1">
                <h4 className="text-white font-medium mb-1">{title}</h4>
                <p className="text-slate-400 text-sm">{subject}</p>
            </div>
            <div className="text-right">
                <div className={`text-xs px-2 py-1 rounded-full border ${types[type]} inline-block mb-1`}>
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
