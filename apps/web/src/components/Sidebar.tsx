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
    Trophy,
    Timer,
    Network,
    Bot,
    StickyNote
} from 'lucide-react';
import { xpService, UserXP } from '@/lib/xpService';
import ProfilePictureModal from './ProfilePictureModal';
import SidebarItem from './SidebarItem';

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

    // Compact logic
    const isCompact = settings.sidebarCompact && !isHovered;

    return (
        <>
            <ProfilePictureModal
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                currentAvatarUrl={profile?.avatar_url}
                onUpdate={handleProfileUpdate}
            />
            {/* 
               Sidebar Container
               w-[68px] (4.25rem) or w-64 (16rem).
            */}
            <aside
                className={`${isCompact ? 'w-[68px]' : 'w-64'} bg-slate-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col min-h-screen transition-all duration-300 ease-in-out z-40 overflow-hidden relative`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Header */}
                <div className="flex-shrink-0 h-20 flex items-center">
                    {/* Fixed Rail Wrapper */}
                    <div className="w-full h-full flex items-center px-0">
                        {/* Icon Rail: w-[68px] fixed */}
                        <div className="w-[68px] flex-shrink-0 flex items-center justify-center">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 ${isCompact ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 whitespace-nowrap">
                                Leerplatform
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Navigation Items */}
                <div className="flex-1 overflow-y-auto py-4 px-0 space-y-1 scrollbar-hide">
                    {/* 
                       Note: SidebarItem now handles the 68px rail internally.
                       We pass compact state.
                    */}
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/dashboard" active={isActive('/dashboard')} compact={isCompact} />
                    <SidebarItem icon={BookOpen} label="Subjects" href="/subjects" active={isActive('/subjects')} compact={isCompact} color={getIconColor('text-blue-400')} />
                    <SidebarItem icon={CheckSquare} label="Tasks" href="/todo" active={isActive('/todo')} compact={isCompact} color={getIconColor('text-pink-400')} />
                    <SidebarItem icon={CalendarIcon} label="Calendar" href="/calendar" active={isActive('/calendar')} compact={isCompact} color={getIconColor('text-cyan-400')} />
                    <SidebarItem icon={Sparkles} label="DUB5 AI" href="/ai-chat" active={isActive('/ai-chat')} compact={isCompact} color={getIconColor('text-purple-400')} />
                    <SidebarItem icon={Zap} label="Study Modes" href="/study-modes" active={isActive('/study-modes')} compact={isCompact} color={getIconColor('text-yellow-400')} />
                    <SidebarItem icon={FileText} label="Study Plans" href="/study-plans" active={isActive('/study-plans')} compact={isCompact} color={getIconColor('text-blue-400')} />
                    <SidebarItem icon={FileText} label="AI PPT" href="/ai-ppt" active={isActive('/ai-ppt')} compact={isCompact} color={getIconColor('text-orange-400')} />
                    <SidebarItem icon={Trophy} label="Leaderboard" href="/dashboard/leaderboard" active={isActive('/dashboard/leaderboard')} compact={isCompact} color={getIconColor('text-yellow-400')} />

                    <SidebarItem icon={Library} label="Library" href="/library" active={isActive('/library')} compact={isCompact} color={getIconColor('text-indigo-400')} />

                    {/* New Features Section */}
                    <div className={`my-2 border-t border-white/5 mx-4 ${isCompact ? 'opacity-0' : 'opacity-100'} transition-opacity`} />
                    <SidebarItem icon={Timer} label="Focus Mode" href="/focus" active={isActive('/focus')} compact={isCompact} color={getIconColor('text-emerald-400')} />
                    <SidebarItem icon={Network} label="Mind Maps" href="/ai-mindmap" active={isActive('/ai-mindmap')} compact={isCompact} color={getIconColor('text-purple-400')} />
                    <SidebarItem icon={StickyNote} label="Smart Notes" href="/smart-notes" active={isActive('/smart-notes')} compact={isCompact} color={getIconColor('text-teal-400')} />

                    {profile?.is_admin && (
                        <>
                            <div className={`my-2 border-t border-white/5 mx-4 ${isCompact ? 'opacity-0' : 'opacity-100'} transition-opacity`} />

                            <SidebarItem icon={ShieldAlert} label="Admin" href="/admin" active={isActive('/admin')} compact={isCompact} color={getIconColor('text-red-400')} />
                            <SidebarItem icon={RefreshCw} label="Git Sync" href="/admin/sync" active={isActive('/admin/sync')} compact={isCompact} color={getIconColor('text-green-400')} />
                        </>
                    )}
                </div>

                {/* Footer - same background as sidebar */}
                <div className="flex-shrink-0 border-t border-white/5 pb-2">
                    <div className="space-y-1 pt-2">
                        {/* 1. Toggle Button - unified hover for whole row */}
                        <div
                            className="flex items-center cursor-pointer group h-12 transition-colors mx-0 hover:bg-white/5 rounded-xl"
                            onClick={toggleSidebar}
                        >
                            <div className="w-[68px] flex-shrink-0 flex items-center justify-center">
                                <div className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 group-hover:text-white transition-colors">
                                    {settings.sidebarCompact ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                                </div>
                            </div>
                            <div className={`overflow-hidden transition-all duration-300 flex items-center ${isCompact ? 'w-0 opacity-0' : 'w-40 opacity-100'}`}>
                                <span className="text-sm font-medium text-slate-400 group-hover:text-white whitespace-nowrap px-1">Collapse</span>
                            </div>
                        </div>


                        {/* 2. Settings */}
                        <SidebarItem
                            icon={Settings}
                            label="Settings"
                            href="/settings"
                            active={isActive('/settings')}
                            compact={isCompact}
                        />

                        {/* 3. Log Out */}
                        <SidebarItem
                            icon={LogOut}
                            label="Sign Out"
                            onClick={() => signOut()}
                            compact={isCompact}
                            className="text-red-400 hover:text-red-300"
                            active={false} // Logout never active
                        />

                        {/* 4. User Profile */}
                        {userXP && (
                            <div
                                className="group flex items-center cursor-pointer hover:bg-white/5 h-14 transition-all duration-300 mx-0 mt-2"
                                onClick={() => setShowProfileModal(true)}
                            >
                                {/* Avatar Rail */}
                                <div className="w-[68px] flex-shrink-0 flex items-center justify-center">
                                    <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-transparent group-hover:ring-white/20 transition-all shadow-lg">
                                        {profile?.avatar_url ? (
                                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                                {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || '?'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Info Text */}
                                <div className={`overflow-hidden transition-all duration-300 ${isCompact ? 'w-0 opacity-0' : 'w-32 opacity-100'}`}>
                                    <div className="px-1 pr-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-white whitespace-nowrap">Lvl {userXP.level}</span>
                                            <span className="text-[10px] text-purple-300 whitespace-nowrap">{userXP.total_xp.toLocaleString()} XP</span>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                                style={{ width: `${xpProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}
