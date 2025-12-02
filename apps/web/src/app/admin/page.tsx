'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Plus, Globe, Trash2, ShieldAlert, Database, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Subject = {
    id: string;
    user_id: string;
    title: string;
    color: string;
    is_public: boolean;
    created_at: string;
};

function LoadingIndicatorToggle() {
    const [enabled, setEnabled] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSetting();
    }, []);

    const fetchSetting = async () => {
        try {
            const { data } = await (supabase
                .from('admin_permission_settings') as any)
                .select('default_value')
                .eq('setting_key', 'ui.show_loading_indicator')
                .single();

            if (data) {
                setEnabled(data.default_value === 'true');
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleSetting = async () => {
        const newValue = !enabled;
        setEnabled(newValue); // Optimistic update

        try {
            const { error } = await (supabase
                .from('admin_permission_settings') as any)
                .upsert({
                    setting_key: 'ui.show_loading_indicator',
                    default_value: String(newValue),
                    description: 'Controls visibility of the global loading indicator'
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error updating setting:', error);
            setEnabled(!newValue); // Revert on error
            alert('Failed to update setting');
        }
    };

    if (loading) return <div className="w-10 h-6 bg-slate-700 rounded-full animate-pulse" />;

    return (
        <button
            onClick={toggleSetting}
            className={`w-12 h-6 rounded-full transition-colors relative ${enabled ? 'bg-blue-600' : 'bg-slate-700'}`}
        >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'left-7' : 'left-1'}`} />
        </button>
    );
}

export default function AdminPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // New Subject State
    const [newSubjectTitle, setNewSubjectTitle] = useState('');
    const [newSubjectColor, setNewSubjectColor] = useState('blue');

    useEffect(() => {
        if (!loading) {
            if (!user || !profile?.is_admin) {
                router.push('/dashboard');
                return;
            }
            fetchSubjects();
        }
    }, [user, profile, loading, router]);

    const fetchSubjects = async () => {
        try {
            const { data, error } = await supabase
                .from('subjects')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setSubjects(data);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleAddGlobalSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newSubjectTitle.trim()) return;

        try {
            const { data, error } = await supabase
                .from('subjects')
                .insert([
                    {
                        user_id: user.id,
                        title: newSubjectTitle,
                        color: newSubjectColor,
                        is_public: true // This makes it a global subject
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            setSubjects([data, ...subjects]);
            setNewSubjectTitle('');
            setNewSubjectColor('blue');
        } catch (error) {
            console.error('Error adding global subject:', error);
        }
    };

    const handleDeleteSubject = async (id: string) => {
        if (!confirm('Are you sure you want to delete this subject? This will delete all related chapters and tasks.')) return;

        try {
            const { error } = await supabase
                .from('subjects')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setSubjects(subjects.filter(s => s.id !== id));
        } catch (error) {
            console.error('Error deleting subject:', error);
        }
    };

    if (loading || !profile?.is_admin) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto relative p-8">
                <div className="max-w-6xl mx-auto">
                    <header className="mb-10">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <ShieldAlert className="w-8 h-8 text-red-500" />
                                <h1 className="text-3xl font-serif font-bold text-white">Admin Dashboard</h1>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => router.push('/admin/announcements')}
                                    className="glass-button px-4 py-2 rounded-xl flex items-center gap-2"
                                >
                                    <Globe className="w-4 h-4" />
                                    <span>Announcements</span>
                                </button>
                                <button
                                    onClick={() => router.push('/admin/sync')}
                                    className="glass-button px-4 py-2 rounded-xl flex items-center gap-2"
                                >
                                    <Database className="w-4 h-4" />
                                    <span>Git Sync</span>
                                </button>
                                <button
                                    onClick={() => router.push('/admin/permissions')}
                                    className="glass-button px-4 py-2 rounded-xl flex items-center gap-2"
                                >
                                    <ShieldAlert className="w-4 h-4" />
                                    <span>Permissions</span>
                                </button>
                            </div>
                        </div>
                        <p className="text-slate-400">Manage global subjects and system settings</p>
                    </header>

                    {/* System Settings */}
                    <div className="glass-card p-6 mb-10">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            System Settings
                        </h3>
                        <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-white/5">
                            <div>
                                <h4 className="text-white font-medium mb-1">Global Loading Indicator</h4>
                                <p className="text-sm text-slate-400">Show a progress bar at the top of the screen during page navigation</p>
                            </div>
                            <LoadingIndicatorToggle />
                        </div>
                    </div>

                    {/* Add Global Subject */}
                    <div className="glass-card p-6 mb-10">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-blue-400" />
                            Add Global Subject
                        </h3>
                        <form onSubmit={handleAddGlobalSubject} className="flex gap-4 items-end">
                            <div className="flex-1 space-y-1">
                                <label className="text-xs text-slate-400">Subject Title</label>
                                <input
                                    type="text"
                                    value={newSubjectTitle}
                                    onChange={(e) => setNewSubjectTitle(e.target.value)}
                                    placeholder="e.g., Advanced Mathematics"
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="w-48 space-y-1">
                                <label className="text-xs text-slate-400">Color Theme</label>
                                <select
                                    value={newSubjectColor}
                                    onChange={(e) => setNewSubjectColor(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="blue">Blue</option>
                                    <option value="green">Green</option>
                                    <option value="purple">Purple</option>
                                    <option value="orange">Orange</option>
                                    <option value="pink">Pink</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={!newSubjectTitle.trim()}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl transition-colors disabled:opacity-50 h-[42px]"
                            >
                                Add Global Subject
                            </button>
                        </form>
                    </div>

                    {/* All Subjects List */}
                    <h3 className="text-xl font-medium text-white mb-6">All Subjects (Global & Personal)</h3>

                    {isLoadingData ? (
                        <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {subjects.map((subject) => (
                                <div key={subject.id} className="glass-card p-4 group relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className={`px-2 py-1 rounded text-xs font-medium ${subject.is_public
                                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                            : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                                            }`}>
                                            {subject.is_public ? 'Global' : 'Personal'}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteSubject(subject.id)}
                                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Delete Subject"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <h4 className="text-lg font-medium text-white mb-1">{subject.title}</h4>
                                    <p className="text-xs text-slate-500">
                                        Created {new Date(subject.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
