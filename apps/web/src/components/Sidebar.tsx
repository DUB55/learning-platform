'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useUISettings } from '@/contexts/UISettingsContext';
import {
    LayoutDashboard,
    BookOpen,
    Calendar as CalendarIcon,
    CheckSquare,
    Zap,
    Library,
    Settings,
    LogOut,
    ShieldAlert,
    RefreshCw,
    Sparkles,
    FileText,
    ChevronLeft,
    ChevronRight,
    Trophy
} from 'lucide-react';
import { xpService, UserXP } from '@/lib/xpService';
import ProfilePictureModal from './ProfilePictureModal';

export default function Sidebar() {
    const pathname = usePathname();
    const { signOut, profile, user } = useAuth();
    const { settings, updateSettings } = useUISettings();
    const [userXP, setUserXP] = useState<UserXP | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);

    useEffect(() => {
        if (user) {
            fetchUserXP();
        }
    }, [user]);

    const fetchUserXP = async () => {
        if (!user) return;
        try {
            const xp = await xpService.getUserXP(user.id);
            setUserXP(xp);
        } catch (error) {
            console.error('Failed to fetch XP:', error);
        }
    };

    const isActive = (path: string) => {
        if (path === '/dashboard') return pathname === '/dashboard';
        if (path === '/admin') return pathname === '/admin';
        return pathname.startsWith(path);
    };

    const xpForNext = userXP ? xpService.xpForNextLevel(userXP.level) : 100;
    const xpProgress = userXP ? ((userXP.total_xp % xpForNext) / xpForNext) * 100 : 0;

    const getIconColor = (color: string) => {
        return settings.iconStyle === 'monochrome' ? 'text-slate-400' : color;
    };

    const toggleSidebar = () => {
        updateSettings({ sidebarCompact: !settings.sidebarCompact });
    };

    const handleProfileUpdate = () => {
        window.location.reload();
    };

    const isCompact = settings.sidebarCompact && !isHovered;

    return (
        <>
            <ProfilePictureModal
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                currentAvatarUrl={profile?.avatar_url}
                onUpdate={handleProfileUpdate}
            />
            <aside
                className={`${isCompact ? 'w-20' : 'w-64'} bg-slate-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col min-h-screen transition-all duration-300 ease-in-out z-40`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Header */}
                <div className="p-4 flex-shrink-0">
                    <div className={`flex items-center gap-3 mb-2 ${isCompact ? 'justify-center' : 'px-2'}`}>
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 ${isCompact ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                            <span className="text-lg font-serif font-bold text-white tracking-tight whitespace-nowrap">LearnHub</span>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <div className={`flex-1 py-2 space-y-1 ${isCompact ? 'px-2' : 'px-4'}`}>
                    <SidebarItem icon={<LayoutDashboard className={getIconColor('text-blue-400')} />} label="Dashboard" href="/dashboard" active={isActive('/dashboard')} compact={isCompact} />
                    <SidebarItem icon={<BookOpen className={getIconColor('text-green-400')} />} label="Subjects" href="/subjects" active={isActive('/subjects')} compact={isCompact} />
                    <SidebarItem icon={<CalendarIcon className={getIconColor('text-cyan-400')} />} label="Calendar" href="/calendar" active={isActive('/calendar')} compact={isCompact} />
                    <SidebarItem icon={<CheckSquare className={getIconColor('text-pink-400')} />} label="Tasks" href="/todo" active={isActive('/todo')} compact={isCompact} />
                    <SidebarItem icon={<Sparkles className={getIconColor('text-purple-400')} />} label="DUB5 AI" href="/ai-chat" active={isActive('/ai-chat')} compact={isCompact} />
                    <SidebarItem icon={<Zap className={getIconColor('text-yellow-400')} />} label="Study Modes" href="/study-modes" active={isActive('/study-modes')} compact={isCompact} />
                    <SidebarItem icon={<CalendarIcon className={getIconColor('text-blue-400')} />} label="Study Plans" href="/dashboard/study-plans" active={isActive('/dashboard/study-plans')} compact={isCompact} />
                    <SidebarItem icon={<FileText className={getIconColor('text-orange-400')} />} label="AI PPT" href="/ai-ppt" active={isActive('/ai-ppt')} compact={isCompact} />
                    <SidebarItem icon={<Library className={getIconColor('text-indigo-400')} />} label="Library" href="/library" active={isActive('/library')} compact={isCompact} />
                    {profile?.is_admin && <SidebarItem icon={<ShieldAlert className={getIconColor('text-red-400')} />} label="Admin" href="/admin" active={isActive('/admin')} compact={isCompact} />}
                    {profile?.is_admin && <SidebarItem icon={<RefreshCw className={getIconColor('text-green-400')} />} label="Git Sync" href="/admin/sync" active={isActive('/admin/sync')} compact={isCompact} />}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 space-y-4 flex-shrink-0">
                    {/* Version Indicator for Debugging */}
                    <div className="text-xs text-slate-600 text-center font-mono">
                        v2.1 (Dec 6) {isCompact ? '' : '- Production'}
                    </div>

                    {/* Toggle Button */}
                    <button
                        onClick={toggleSidebar}
                        className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        {settings.sidebarCompact ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>

                    {userXP && (
                        <div onClick={() => setShowProfileModal(true)} className="block cursor-pointer">
                            <div className={`bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-purple-500/20 rounded-xl p-3 hover:border-purple-500/40 transition-all group relative overflow-hidden`}>
                                <div className={`flex items-center ${isCompact ? 'justify-center' : 'gap-3'} mb-2`}>
                                    {profile?.avatar_url ? (
                                        <img
                                            src={profile.avatar_url}
                                            alt="Profile"
                                            className="w-8 h-8 rounded-full object-cover border border-purple-500/30 flex-shrink-0"
                                        />
                                    ) : (
                                        <Trophy className="w-8 h-8 text-purple-400 flex-shrink-0 p-1.5 bg-purple-500/10 rounded-full" />
                                    )}

                                    <div className={`overflow-hidden transition-all duration-300 ${isCompact ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                                        <div className="flex justify-between items-center w-full">
                                            <span className="text-sm font-medium text-white whitespace-nowrap">Level {userXP.level}</span>
                                            <span className="text-xs text-purple-300 whitespace-nowrap ml-2">{userXP.total_xp.toLocaleString()} XP</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={`transition-all duration-300 ${isCompact ? 'h-0 opacity-0' : 'h-auto opacity-100'}`}>
                                    <div className="relative w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500 group-hover:shadow-lg group-hover:shadow-purple-500/50"
                                            style={{ width: `${xpProgress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 whitespace-nowrap">
                                        {xpForNext - (userXP.total_xp % xpForNext)} XP to next
                                    </p>
                                </div>

                                {/* Edit Overlay Hint */}
                                <div className={`absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isCompact ? 'hidden' : ''}`}>
                                    <span className="text-xs font-medium text-white">Change Picture</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <SidebarItem icon={<Settings />} label="Settings" href="/settings" active={isActive('/settings')} compact={isCompact} />
                        <button
                            onClick={() => signOut()}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 group ${isCompact ? 'justify-center' : ''}`}
                            title={isCompact ? "Sign Out" : undefined}
                        >
                            <div className="flex-shrink-0">
                                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </div>
                            <div className={`overflow-hidden transition-all duration-300 ${isCompact ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                                <span className="font-medium whitespace-nowrap">Sign Out</span>
                            </div>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}


function SidebarItem({ icon, label, href, active, compact }: { icon: React.ReactNode, label: string, href: string, active: boolean, compact: boolean }) {
    const router = useRouter();

    return (
        <Link
            href={href}
            onMouseEnter={() => router.prefetch(href)}
            className={`flex items-center gap-3 transition-all duration-200 group ${active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
                } ${compact
                    ? 'w-12 h-12 justify-center mx-auto rounded-xl p-0'
                    : 'w-full pl-[30px] py-3 rounded-xl'
                }`}
            title={compact ? label : undefined}
        >
            <div className={`flex-shrink-0 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                {icon}
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${compact ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                <span className="font-medium whitespace-nowrap">{label}</span>
            </div>
        </Link>
    );
}
