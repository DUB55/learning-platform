'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

import {
    Plus, Globe, Trash2, ShieldAlert, Sparkles, Code, Users,
    ChevronDown, ChevronRight, Settings, Image, Megaphone,
    BookOpen, Eye, LayoutGrid, ToggleLeft, ToggleRight, Lock, Sliders
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Subject = {
    id: string;
    user_id: string;
    title: string;
    color: string;
    is_public: boolean;
    created_at: string;
};

// Collapsible Section Component
function CollapsibleSection({
    title,
    icon: Icon,
    children,
    defaultOpen = false,
    iconColor = 'text-blue-400'
}: {
    title: string;
    icon: any;
    children: React.ReactNode;
    defaultOpen?: boolean;
    iconColor?: string;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="glass-card overflow-hidden mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                    <h3 className="text-lg font-medium text-white">{title}</h3>
                </div>
                {isOpen ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
            </button>
            {isOpen && (
                <div className="px-4 pb-4 border-t border-white/5">
                    {children}
                </div>
            )}
        </div>
    );
}

// Toggle Switch Component
function ToggleSwitch({
    enabled,
    onChange,
    loading = false
}: {
    enabled: boolean;
    onChange: () => void;
    loading?: boolean;
}) {
    if (loading) return <div className="w-12 h-6 bg-slate-700 rounded-full animate-pulse" />;

    return (
        <button
            onClick={onChange}
            className={`w-12 h-6 rounded-full transition-colors relative ${enabled ? 'bg-blue-600' : 'bg-slate-700'}`}
        >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'left-7' : 'left-1'}`} />
        </button>
    );
}

// Setting Row Component
function SettingRow({
    title,
    description,
    children
}: {
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
            <div className="flex-1 mr-4">
                <h4 className="text-white font-medium mb-0.5">{title}</h4>
                <p className="text-sm text-slate-400">{description}</p>
            </div>
            {children}
        </div>
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

    // Settings State
    const [loadingIndicator, setLoadingIndicator] = useState(true);
    const [loadingSpinner, setLoadingSpinner] = useState(false);
    const [loadingIndicatorLoading, setLoadingIndicatorLoading] = useState(true);

    // Profile Picture Settings
    const [profilePicColumns, setProfilePicColumns] = useState(5);
    const [profilePicSeparateDefaults, setProfilePicSeparateDefaults] = useState(true);
    const [profilePicSettingsLoading, setProfilePicSettingsLoading] = useState(true);

    // Flashcard Settings
    const [flashcardAnimation, setFlashcardAnimation] = useState<'flip' | 'fade'>('flip');

    useEffect(() => {
        if (!loading) {
            if (!user || !profile?.is_admin) {
                router.push('/dashboard');
                return;
            }
            fetchSubjects();
            fetchSettings();
        }
    }, [user, profile, loading, router]);

    const fetchSettings = async () => {
        try {
            // Fetch all settings
            const { data } = await (supabase
                .from('admin_permission_settings') as any)
                .select('setting_key, default_value');

            if (data) {
                data.forEach((setting: any) => {
                    switch (setting.setting_key) {
                        case 'ui.show_loading_indicator':
                            setLoadingIndicator(setting.default_value === 'true');
                            break;
                        case 'ui.show_loading_spinner':
                            setLoadingSpinner(setting.default_value === 'true');
                            break;
                        case 'ui.profile_pic_columns':
                            setProfilePicColumns(parseInt(setting.default_value) || 5);
                            break;
                        case 'ui.profile_pic_separate_defaults':
                            setProfilePicSeparateDefaults(setting.default_value !== 'false');
                            break;
                        case 'ui.flashcard_animation':
                            setFlashcardAnimation(setting.default_value as 'flip' | 'fade');
                            break;
                    }
                });
            }
        } finally {
            setLoadingIndicatorLoading(false);
            setProfilePicSettingsLoading(false);
        }
    };

    const updateSetting = async (key: string, value: string, description: string) => {
        try {
            const { error } = await (supabase
                .from('admin_permission_settings') as any)
                .upsert({
                    setting_key: key,
                    default_value: value,
                    description: description
                }, { onConflict: 'setting_key' });
            if (error) throw error;
        } catch (error) {
            console.error('Error updating setting:', error);
            alert('Failed to update setting');
        }
    };

    const fetchSubjects = async () => {
        try {
            const { data, error } = await (supabase
                .from('subjects') as any)
                .select('*')
                .eq('is_public', true);

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
            const { data, error } = await (supabase
                .from('subjects') as any)
                .insert([{
                    user_id: user.id,
                    title: newSubjectTitle,
                    color: newSubjectColor,
                    is_public: true
                }])
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
        if (!confirm('Are you sure you want to delete this subject? This will delete all related content.')) return;

        try {
            const { error } = await (supabase
                .from('subjects') as any)
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
        <>
            <div className="p-8 pb-32 relative">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <header className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <ShieldAlert className="w-8 h-8 text-red-500" />
                            <h1 className="text-3xl font-serif font-bold text-white">Admin Settings</h1>
                        </div>
                        <p className="text-slate-400">Manage platform settings and content</p>
                    </header>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
                        <button
                            onClick={() => router.push('/admin/bulk-creator')}
                            className="glass-card p-4 flex flex-col items-center gap-2 hover:bg-white/5 transition-colors group"
                        >
                            <Code className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
                            <span className="text-sm text-white">Bulk Creator</span>
                        </button>
                        <button
                            onClick={() => router.push('/admin/profile-pictures')}
                            className="glass-card p-4 flex flex-col items-center gap-2 hover:bg-white/5 transition-colors group"
                        >
                            <Image className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                            <span className="text-sm text-white">Profile Pics</span>
                        </button>
                        <button
                            onClick={() => router.push('/admin/announcements')}
                            className="glass-card p-4 flex flex-col items-center gap-2 hover:bg-white/5 transition-colors group"
                        >
                            <Megaphone className="w-6 h-6 text-orange-400 group-hover:scale-110 transition-transform" />
                            <span className="text-sm text-white">Announcements</span>
                        </button>
                        <button
                            onClick={() => router.push('/admin/permissions')}
                            className="glass-card p-4 flex flex-col items-center gap-2 hover:bg-white/5 transition-colors group"
                        >
                            <Lock className="w-6 h-6 text-red-400 group-hover:scale-110 transition-transform" />
                            <span className="text-sm text-white">Permissions</span>
                        </button>
                        <button
                            onClick={() => router.push('/admin/features')}
                            className="glass-card p-4 flex flex-col items-center gap-2 hover:bg-white/5 transition-colors group"
                        >
                            <Sliders className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                            <span className="text-sm text-white">Feature Toggles</span>
                        </button>
                    </div>

                    {/* UI Settings */}
                    <CollapsibleSection title="Display Settings" icon={Eye} defaultOpen={true} iconColor="text-purple-400">
                        <div className="pt-4">
                            <SettingRow
                                title="Loading Indicator"
                                description="Show a progress bar at the top during page navigation"
                            >
                                <ToggleSwitch
                                    enabled={loadingIndicator}
                                    loading={loadingIndicatorLoading}
                                    onChange={async () => {
                                        const newValue = !loadingIndicator;
                                        setLoadingIndicator(newValue);
                                        await updateSetting(
                                            'ui.show_loading_indicator',
                                            String(newValue),
                                            'Controls visibility of the global loading indicator'
                                        );
                                    }}
                                />
                            </SettingRow>

                            <SettingRow
                                title="Loading Spinner"
                                description="Show a spinning circle in the corner during navigation"
                            >
                                <ToggleSwitch
                                    enabled={loadingSpinner}
                                    loading={loadingIndicatorLoading}
                                    onChange={async () => {
                                        const newValue = !loadingSpinner;
                                        setLoadingSpinner(newValue);
                                        await updateSetting(
                                            'ui.show_loading_spinner',
                                            String(newValue),
                                            'Controls visibility of the loading spinner'
                                        );
                                    }}
                                />
                            </SettingRow>

                            <SettingRow
                                title="Flashcard Animation"
                                description="Choose between 3D Flip or Simple Fade animation"
                            >
                                <div className="flex bg-slate-800 rounded-lg p-1 border border-white/5">
                                    <button
                                        onClick={async () => {
                                            setFlashcardAnimation('flip');
                                            await updateSetting('ui.flashcard_animation', 'flip', 'Flashcard animation style');
                                        }}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${flashcardAnimation === 'flip' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Flip
                                    </button>
                                    <button
                                        onClick={async () => {
                                            setFlashcardAnimation('fade');
                                            await updateSetting('ui.flashcard_animation', 'fade', 'Flashcard animation style');
                                        }}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${flashcardAnimation === 'fade' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Fade
                                    </button>
                                </div>
                            </SettingRow>

                            <div className="pt-4 border-t border-white/5">
                                <button
                                    onClick={() => router.push('/admin/gradient-editor')}
                                    className="w-full glass-button py-3 flex items-center justify-center gap-2 group"
                                >
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 group-hover:scale-110 transition-transform" />
                                    <span>Open Gradient Animator</span>
                                </button>
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* Profile Picture Settings */}
                    <CollapsibleSection title="Profile Picture Settings" icon={Users} defaultOpen={true} iconColor="text-blue-400">
                        <div className="pt-4">
                            <SettingRow
                                title="Grid Columns"
                                description="Number of profile pictures per row (3-8). Lower = larger pictures"
                            >
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="3"
                                        max="8"
                                        value={profilePicColumns}
                                        onChange={async (e) => {
                                            const val = parseInt(e.target.value);
                                            setProfilePicColumns(val);
                                            await updateSetting(
                                                'ui.profile_pic_columns',
                                                String(val),
                                                'Number of columns in profile picture grid'
                                            );
                                        }}
                                        className="w-24 accent-blue-500"
                                        disabled={profilePicSettingsLoading}
                                    />
                                    <span className="text-white font-mono bg-slate-800 px-2 py-1 rounded text-sm min-w-[2rem] text-center">
                                        {profilePicColumns}
                                    </span>
                                </div>
                            </SettingRow>

                            <SettingRow
                                title="Separate Default Options"
                                description="Show Default and Google avatar as separate buttons above the gallery"
                            >
                                <ToggleSwitch
                                    enabled={profilePicSeparateDefaults}
                                    loading={profilePicSettingsLoading}
                                    onChange={async () => {
                                        const newValue = !profilePicSeparateDefaults;
                                        setProfilePicSeparateDefaults(newValue);
                                        await updateSetting(
                                            'ui.profile_pic_separate_defaults',
                                            String(newValue),
                                            'Whether to show Default/Google options separately'
                                        );
                                    }}
                                />
                            </SettingRow>
                        </div>
                    </CollapsibleSection>

                    {/* Global Subjects */}
                    <CollapsibleSection title="Global Subjects" icon={BookOpen} defaultOpen={false} iconColor="text-green-400">
                        <div className="pt-4">
                            {/* Add Subject Form */}
                            <form onSubmit={handleAddGlobalSubject} className="flex gap-3 mb-6">
                                <input
                                    type="text"
                                    value={newSubjectTitle}
                                    onChange={(e) => setNewSubjectTitle(e.target.value)}
                                    placeholder="Subject title..."
                                    className="flex-1 bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                                <select
                                    value={newSubjectColor}
                                    onChange={(e) => setNewSubjectColor(e.target.value)}
                                    className="bg-slate-800/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="blue">Blue</option>
                                    <option value="green">Green</option>
                                    <option value="purple">Purple</option>
                                    <option value="orange">Orange</option>
                                    <option value="pink">Pink</option>
                                </select>
                                <button
                                    type="submit"
                                    disabled={!newSubjectTitle.trim()}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add
                                </button>
                            </form>

                            {/* Subject List */}
                            {isLoadingData ? (
                                <div className="text-center py-6">
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                                </div>
                            ) : subjects.length === 0 ? (
                                <p className="text-slate-500 text-center py-6">No global subjects yet</p>
                            ) : (
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {subjects.map((subject) => (
                                        <div
                                            key={subject.id}
                                            className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full bg-${subject.color}-500`} />
                                                <span className="text-white font-medium">{subject.title}</span>
                                                <span className="text-xs text-slate-500">
                                                    {new Date(subject.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteSubject(subject.id)}
                                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                </div>
            </div>
        </>
    );
}
