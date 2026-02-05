'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
    ShieldAlert, Users, Database, Settings, 
    BarChart3, Terminal, LayoutGrid, Code, 
    Image as ImageIcon, Megaphone, Lock, Sliders,
    ChevronRight, Home, Sparkles
} from 'lucide-react';

import AdminUserManagement from './components/AdminUserManagement';
import AdminContentManager from './components/AdminContentManager';
import AdminSystemSettings from './components/AdminSystemSettings';
import AdminLogs from './components/AdminLogs';
import AdminAnalytics from './components/AdminAnalytics';

type AdminTab = 'overview' | 'users' | 'content' | 'settings' | 'logs' | 'tools';

export default function AdminPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<AdminTab>('overview');

    useEffect(() => {
        if (!loading) {
            if (!user || !profile?.is_admin) {
                router.push('/dashboard');
            }
        }
    }, [user, profile, loading, router]);

    if (loading || !profile?.is_admin) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Home },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'content', label: 'Content', icon: Database },
        { id: 'settings', label: 'Settings', icon: Settings },
        { id: 'logs', label: 'Logs', icon: Terminal },
        { id: 'tools', label: 'Tools', icon: LayoutGrid },
    ];

    return (
        <div className="min-h-screen bg-[#0a0f1d] text-slate-200">
            {/* Admin Header */}
            <div className="border-b border-white/5 bg-[#0f172a]/50 backdrop-blur-xl sticky top-0 z-30">
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center border border-red-500/30">
                            <ShieldAlert className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white leading-none">Admin Control</h1>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">System Management</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.push('/dashboard')}
                            className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                        >
                            Exit to Dashboard
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
                    {/* Sidebar Nav */}
                    <aside className="space-y-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as AdminTab)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                        activeTab === tab.id 
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </aside>

                    {/* Main Content Area */}
                    <main className="min-h-[70vh]">
                        {activeTab === 'overview' && (
                            <div className="space-y-8">
                                <AdminAnalytics />

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="glass-card p-6">
                                        <h3 className="text-white font-medium mb-4">Quick Shortcuts</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button onClick={() => setActiveTab('users')} className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-left">
                                                <Users className="w-6 h-6 text-blue-400 mb-2" />
                                                <div className="text-sm font-medium">Manage Users</div>
                                                <div className="text-[10px] text-slate-500">Edit, ban, or delete</div>
                                            </button>
                                            <button onClick={() => setActiveTab('content')} className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-left">
                                                <Database className="w-6 h-6 text-purple-400 mb-2" />
                                                <div className="text-sm font-medium">Browse Content</div>
                                                <div className="text-[10px] text-slate-500">Subjects & Chapters</div>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="glass-card p-6">
                                        <h3 className="text-white font-medium mb-4">System Alerts</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                                                <div>
                                                    <div className="text-xs font-bold text-red-500 uppercase">Security Warning</div>
                                                    <div className="text-sm text-slate-300">3 failed login attempts on admin account.</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                                <Megaphone className="w-5 h-5 text-blue-500 shrink-0" />
                                                <div>
                                                    <div className="text-xs font-bold text-blue-500 uppercase">System Update</div>
                                                    <div className="text-sm text-slate-300">New DUB5 AI models are now available.</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'users' && <AdminUserManagement />}
                        {activeTab === 'content' && <AdminContentManager />}
                        {activeTab === 'settings' && <AdminSystemSettings />}
                        {activeTab === 'logs' && <AdminLogs />}
                        
                        {activeTab === 'tools' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {[
                                    { id: 'bulk', label: 'Bulk Creator', icon: Code, color: 'text-purple-400', path: '/admin/bulk-creator' },
                                    { id: 'pics', label: 'Profile Pics', icon: ImageIcon, color: 'text-blue-400', path: '/admin/profile-pictures' },
                                    { id: 'games', label: 'Game Maker', icon: LayoutGrid, color: 'text-emerald-400', path: '/admin/game-maker' },
                                    { id: 'announce', label: 'Announcements', icon: Megaphone, color: 'text-orange-400', path: '/admin/announcements' },
                                    { id: 'perm', label: 'Permissions', icon: Lock, color: 'text-red-400', path: '/admin/permissions' },
                                    { id: 'feat', label: 'Feature Toggles', icon: Sliders, color: 'text-emerald-400', path: '/admin/features' },
                                ].map((tool) => (
                                    <button
                                        key={tool.id}
                                        onClick={() => router.push(tool.path)}
                                        className="glass-card p-6 flex flex-col items-center gap-3 hover:bg-white/5 transition-all group"
                                    >
                                        <tool.icon className={`w-8 h-8 ${tool.color} group-hover:scale-110 transition-transform`} />
                                        <span className="text-sm font-medium text-white">{tool.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
