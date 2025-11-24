'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
    LayoutDashboard,
    BookOpen,
    Calendar as CalendarIcon,
    CheckSquare,
    Zap,
    Library,
    Settings,
    LogOut,
    ShieldAlert
} from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();
    const { signOut, profile } = useAuth();

    const isActive = (path: string) => {
        if (path === '/dashboard' && pathname === '/dashboard') return true;
        if (path !== '/dashboard' && pathname?.startsWith(path)) return true;
        return false;
    };

    return (
        <aside className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col h-screen sticky top-0">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-serif font-bold text-white tracking-tight">LearnHub</span>
                </div>

                <nav className="space-y-1">
                    <SidebarItem
                        icon={<LayoutDashboard />}
                        label="Dashboard"
                        href="/dashboard"
                        active={isActive('/dashboard')}
                    />
                    <SidebarItem
                        icon={<BookOpen />}
                        label="Subjects"
                        href="/subjects"
                        active={isActive('/subjects')}
                    />
                    <SidebarItem
                        icon={<CalendarIcon />}
                        label="Calendar"
                        href="/calendar"
                        active={isActive('/calendar')}
                    />
                    <SidebarItem
                        icon={<CheckSquare />}
                        label="To-do"
                        href="/todo"
                        active={isActive('/todo')}
                    />
                    <SidebarItem
                        icon={<Zap />}
                        label="Study Modes"
                        href="/study"
                        active={isActive('/study')}
                    />
                    <SidebarItem
                        icon={<Library />}
                        label="Library"
                        href="/library"
                        active={isActive('/library')}
                    />
                    {profile?.is_admin && (
                        <SidebarItem
                            icon={<ShieldAlert className="text-red-400" />}
                            label="Admin"
                            href="/admin"
                            active={isActive('/admin')}
                        />
                    )}
                    {profile?.is_admin && (
                        <SidebarItem
                            icon={<RefreshCw className="text-emerald-400" />}
                            label="Git Sync"
                            href="/admin/sync"
                            active={isActive('/admin/sync')}
                        />
                    )}
                </nav>
            </div>

            <div className="mt-auto p-6 border-t border-white/5">
                <nav className="space-y-1">
                    <SidebarItem
                        icon={<Settings />}
                        label="Settings"
                        href="/settings"
                        active={isActive('/settings')}
                    />
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
    );
}

function SidebarItem({ icon, label, href, active }: { icon: React.ReactNode, label: string, href: string, active: boolean }) {
    return (
        <Link
            href={href}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
        >
            <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                {icon}
            </div>
            <span className="font-medium">{label}</span>
        </Link>
    );
}
