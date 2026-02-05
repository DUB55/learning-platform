'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useUISettings } from '@/contexts/UISettingsContext';
import Image from 'next/image';
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
    Bot,
    Brain,
    Clock,
    Target,
    Presentation,
    FileText,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Trophy,
    BarChart2,
    Timer,
    Network,
    StickyNote,
    Gamepad2,
    LayoutGrid,
    Mic,
    Headphones,
    Video,
    Search,
    PenTool
} from 'lucide-react';
import { xpService } from '@/lib/xpService';
import { useUserXP } from '@/contexts/UserXPContext';
import ErrorLogger from '@/lib/ErrorLogger';
import ProfilePictureModal from './ProfilePictureModal';
import SidebarItem from './SidebarItem';

interface SidebarProps {
    isMobile?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isMobile, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { signOut, profile, user, refreshProfile } = useAuth();
    const { settings, updateSettings } = useUISettings();
    const { userXP, xpProgress } = useUserXP();
    const [isHovered, setIsHovered] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [aiToolsOpen, setAiToolsOpen] = useState(false);
    const [canScrollMore, setCanScrollMore] = useState(false);
    const [canScrollLess, setCanScrollLess] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const checkScroll = useCallback(() => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            // Show bottom indicator if there is more to scroll and we aren't at the bottom
            setCanScrollMore(scrollHeight > clientHeight + scrollTop + 10);
            // Show top indicator if we have scrolled down
            setCanScrollLess(scrollTop > 10);
        }
    }, []);

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [checkScroll]);

    const isActive = (path: string) => {
        if (path === '/dashboard') return pathname === '/dashboard';
        if (path === '/admin') return pathname === '/admin';
        return pathname.startsWith(path);
    };

    const getIconColor = (color: string) => {
        return settings.iconStyle === 'monochrome' ? 'text-slate-400' : color;
    };

    const toggleSidebar = () => {
        updateSettings({ sidebarCompact: !settings.sidebarCompact });
    };

    const handleProfileUpdate = () => {
        refreshProfile();
    };

    // Compact logic
    const isCompact = !isMobile && settings.sidebarCompact && !isHovered;

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
                className={`${isCompact ? 'w-[60px]' : 'w-64'} ${isMobile ? 'h-full' : 'min-h-screen'} bg-slate-900/50 backdrop-blur-xl ${!isMobile && 'border-r'} border-white/5 flex flex-col transition-all duration-300 ease-in-out z-40 overflow-hidden relative`}
                onMouseEnter={() => !isMobile && setIsHovered(true)}
                onMouseLeave={() => !isMobile && setIsHovered(false)}
            >
                {/* Header */}
                <div className="flex-shrink-0 h-20 flex items-center">
                    {/* Fixed Rail Wrapper - mx-1 to match SidebarItem alignment */}
                    <div className="w-full h-full flex items-center mx-1">
                        {/* Icon Rail: Fixed width for alignment */}
                        <div className="w-12 flex-shrink-0 flex items-center justify-center">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <BookOpen className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 ${isCompact ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 whitespace-nowrap px-1">
                                Leerplatform
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Navigation Items */}
                <div className="flex-1 flex flex-col min-h-0 relative">
                    {/* Top Scroll Indicator */}
                    <div className={`absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-slate-900/80 to-transparent pointer-events-none transition-opacity duration-500 z-10 ${canScrollLess ? 'opacity-100' : 'opacity-0'}`} />

                    <div 
                        ref={scrollRef}
                        onScroll={checkScroll}
                        className="flex-1 overflow-y-auto py-4 px-0 space-y-1 sidebar-scrollbar"
                    >
                        {/* 
                           Note: SidebarItem now handles the 68px rail internally.
                           We pass compact state.
                        */}
                        <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/dashboard" active={isActive('/dashboard')} compact={isCompact} />
                        <SidebarItem icon={BookOpen} label="Subjects" href="/subjects" active={isActive('/subjects')} compact={isCompact} color={getIconColor('text-blue-400')} />
                        <SidebarItem icon={CalendarIcon} label="Calendar" href="/calendar" active={isActive('/calendar')} compact={isCompact} color={getIconColor('text-cyan-400')} />
                        
                        {/* AI Tools Dropdown */}
                        <div className="space-y-1">
                            <div
                                onClick={() => setAiToolsOpen(!aiToolsOpen)}
                                className={`h-11 flex items-center mb-1 mx-1 transition-all duration-200 cursor-pointer select-none rounded-lg group border ${
                                    isActive('/ai') || isActive('/ai-tools') || isActive('/ai-chat') || isActive('/study-modes') || isActive('/study-plans') 
                                    ? 'bg-blue-500/10 border-blue-500/20 shadow-sm shadow-blue-500/5' 
                                    : 'border-transparent hover:bg-white/5'
                                }`}
                            >
                                <div className="w-12 flex-shrink-0 flex items-center justify-center">
                                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${
                                        isActive('/ai') || isActive('/ai-tools') || isActive('/ai-chat') || isActive('/study-modes') || isActive('/study-plans')
                                        ? 'text-blue-500'
                                        : 'text-slate-400 group-hover:text-white'
                                    }`}>
                                        <Sparkles className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                                    </div>
                                </div>
                                <div className={`overflow-hidden transition-all duration-300 flex items-center justify-between flex-1 ${isCompact ? 'w-0 opacity-0' : 'w-40 opacity-100'}`}>
                                    <span className={`font-medium whitespace-nowrap px-1 transition-colors duration-200 ${
                                        isActive('/ai') || isActive('/ai-tools') || isActive('/ai-chat') || isActive('/study-modes') || isActive('/study-plans')
                                        ? 'text-blue-400 font-semibold'
                                        : 'text-slate-300 group-hover:text-white'
                                    }`}>
                                        AI Tools
                                    </span>
                                    <ChevronDown className={`w-4 h-4 mr-2 transition-transform duration-300 ${aiToolsOpen ? 'rotate-180' : ''} ${
                                        isActive('/ai') || isActive('/ai-tools') || isActive('/ai-chat') || isActive('/study-modes') || isActive('/study-plans')
                                        ? 'text-blue-400'
                                        : 'text-slate-400 group-hover:text-white'
                                    }`} />
                                </div>
                            </div>

                            {/* Dropdown Content */}
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${aiToolsOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className={`${isCompact ? 'ml-0' : 'ml-2'} space-y-1 py-1`}>
                                    <SidebarItem icon={LayoutGrid} label="All AI Tools" href="/ai-tools" active={isActive('/ai-tools')} compact={isCompact} color={getIconColor('text-purple-400')} />
                                    <SidebarItem icon={Bot} label="DUB5 AI Chat" href="/ai-chat" active={isActive('/ai-chat')} compact={isCompact} color={getIconColor('text-purple-400')} />
                                    <SidebarItem icon={Zap} label="AI Study Modes" href="/study-modes" active={isActive('/study-modes')} compact={isCompact} color={getIconColor('text-yellow-400')} />
                                    <SidebarItem icon={FileText} label="AI Study Plans" href="/study-plans" active={isActive('/study-plans')} compact={isCompact} color={getIconColor('text-blue-400')} />
                                    <SidebarItem icon={PenTool} label="AI Writing Assistant" href="/writing-assistant" active={isActive('/writing-assistant')} compact={isCompact} color={getIconColor('text-emerald-400')} />
                                    <SidebarItem icon={Mic} label="AI Audio Recap" href="/ai-audio-recap" active={isActive('/ai-audio-recap')} compact={isCompact} color={getIconColor('text-orange-400')} />
                                    <SidebarItem icon={BookOpen} label="AI Smart Notes" href="/smart-notes" active={isActive('/smart-notes')} compact={isCompact} color={getIconColor('text-cyan-400')} />
                                    <SidebarItem icon={LayoutGrid} label="AI PPT Generator" href="/ai-ppt" active={isActive('/ai-ppt')} compact={isCompact} color={getIconColor('text-indigo-400')} />
                                </div>
                            </div>
                        </div>

                        <div className={`my-2 border-t border-white/5 mx-4 ${isCompact ? 'opacity-0' : 'opacity-100'} transition-opacity`} />

                        <SidebarItem icon={Trophy} label="Achievements" href="/achievements" active={isActive('/achievements')} compact={isCompact} color={getIconColor('text-yellow-400')} />
                        <SidebarItem icon={BarChart2} label="Statistics" href="/dashboard/stats" active={isActive('/dashboard/stats')} compact={isCompact} color={getIconColor('text-indigo-400')} />
                        <SidebarItem icon={Gamepad2} label="Arcade" href="/games" active={isActive('/games')} compact={isCompact} color={getIconColor('text-fuchsia-400')} />
                        <SidebarItem icon={Library} label="Library" href="/library" active={isActive('/library')} compact={isCompact} color={getIconColor('text-indigo-400')} />

                        {/* New Features Section */}
                        <div className={`my-2 border-t border-white/5 mx-4 ${isCompact ? 'opacity-0' : 'opacity-100'} transition-opacity`} />
                        <SidebarItem icon={Timer} label="Focus Mode" href="/focus" active={isActive('/focus')} compact={isCompact} color={getIconColor('text-emerald-400')} />

                        {profile?.is_admin && (
                            <>
                                <div className={`my-2 border-t border-white/5 mx-4 ${isCompact ? 'opacity-0' : 'opacity-100'} transition-opacity`} />

                                <SidebarItem icon={ShieldAlert} label="Admin" href="/admin" active={isActive('/admin')} compact={isCompact} color={getIconColor('text-red-400')} />
                                <SidebarItem icon={LayoutGrid} label="Game Maker" href="/admin/game-maker" active={isActive('/admin/game-maker')} compact={isCompact} color={getIconColor('text-emerald-400')} />
                                <SidebarItem icon={RefreshCw} label="Git Sync" href="/admin/sync" active={isActive('/admin/sync')} compact={isCompact} color={getIconColor('text-green-400')} />
                            </>
                        )}
                    </div>
                    
                    {/* Scroll Indicator Gradient - positioned at the bottom of the navigation area */}
                    <div className={`absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent pointer-events-none transition-opacity duration-500 z-10 ${canScrollMore ? 'opacity-100' : 'opacity-0'}`} />
                </div>

                {/* Footer - same background as sidebar */}
                <div className="flex-shrink-0 border-t border-white/5 pb-2">
                    <div className="space-y-1 pt-2">
                        {/* Collapse Button */}
                        {!isMobile && (
                            <div className="px-0 py-2">
                                <div
                                    className="h-11 flex items-center mx-1 transition-all duration-200 cursor-pointer select-none rounded-lg group border border-transparent hover:bg-white/5"
                                    onClick={toggleSidebar}
                                >
                                    <div className="w-12 flex-shrink-0 flex items-center justify-center">
                                        <div className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 group-hover:text-white transition-all duration-200">
                                            {settings.sidebarCompact ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                                        </div>
                                    </div>
                                    <div className={`overflow-hidden transition-all duration-300 flex items-center ${isCompact ? 'w-0 opacity-0' : 'w-40 opacity-100'}`}>
                                        <span className="text-sm font-medium text-slate-300 group-hover:text-white whitespace-nowrap px-1">Collapse</span>
                                    </div>
                                </div>
                            </div>
                        )}


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
                            active={false}
                        />

                        {/* 4. User Profile */}
                        <div
                            className="group flex items-center cursor-pointer hover:bg-white/5 h-14 transition-all duration-300 mx-1 mt-2 rounded-lg relative overflow-hidden"
                            onClick={() => router.push('/profile')}
                        >
                            {/* Avatar Rail */}
                            <div className="w-12 flex-shrink-0 flex items-center justify-center relative z-10">
                                <div className="w-10 h-10 rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-white/30 transition-all shadow-lg shadow-black/20 bg-slate-800">
                                    {profile?.avatar_url ? (
                                        <Image 
                                            src={profile.avatar_url} 
                                            alt="Profile" 
                                            width={40} 
                                            height={40} 
                                            className="w-full h-full object-cover"
                                            priority
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                            {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Info Text */}
                            <div className={`overflow-hidden transition-all duration-300 relative z-10 ${isCompact ? 'w-0 opacity-0' : 'w-[200px] opacity-100'}`}>
                                <div className="px-1 pr-2">
                                    {userXP ? (
                                        <>
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-black text-white whitespace-nowrap">LVL {Number(userXP.level) || 1}</span>
                                                    <div className="flex items-center gap-1 text-[10px] text-orange-400 font-bold">
                                                        <Zap className="w-2.5 h-2.5 fill-current" />
                                                        <span>{Number(userXP.current_streak) || 0}</span>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold text-blue-400 whitespace-nowrap">{Number(userXP.total_xp || 0).toLocaleString()} XP</span>
                                            </div>
                                            {/* Progress Bar */}
                                            <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden p-[px] border border-white/5 shadow-inner">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.5)] transition-all duration-700 ease-out"
                                                    style={{ width: `${Math.max(0, Math.min(100, xpProgress || 0))}%` }}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-1">
                                            <div className="text-xs font-bold text-white truncate">
                                                {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                                            </div>
                                            <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden border border-white/5">
                                                <div className="h-full bg-slate-700 w-0" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
