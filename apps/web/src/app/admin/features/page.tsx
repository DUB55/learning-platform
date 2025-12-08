'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    ArrowLeft, Save, Loader2, Settings, Check, X,
    Timer, Network, Bot, StickyNote, Users, Mic,
    Brain, Trophy, FileSpreadsheet, Youtube, FileText,
    Presentation, Sparkles
} from 'lucide-react';
import ToggleSwitch from '@/components/ui/ToggleSwitch';

interface FeatureToggle {
    setting_key: string;
    default_value: string;
    description: string;
    category: string;
}

const FEATURE_ICONS: Record<string, any> = {
    'feature.focus_mode': Timer,
    'feature.ai_tutor': Bot,
    'feature.ai_mindmap': Network,
    'feature.smart_notes': StickyNote,
    'feature.study_groups': Users,
    'feature.voice_study': Mic,
    'feature.spaced_repetition': Brain,
    'feature.leaderboard': Trophy,
    'feature.csv_import': FileSpreadsheet,
    'feature.youtube_import': Youtube,
    'feature.pdf_import': FileText,
    'feature.ai_ppt': Presentation,
};

const FEATURE_COLORS: Record<string, string> = {
    'feature.focus_mode': 'text-emerald-400',
    'feature.ai_tutor': 'text-blue-400',
    'feature.ai_mindmap': 'text-purple-400',
    'feature.smart_notes': 'text-teal-400',
    'feature.study_groups': 'text-pink-400',
    'feature.voice_study': 'text-amber-400',
    'feature.spaced_repetition': 'text-indigo-400',
    'feature.leaderboard': 'text-yellow-400',
    'feature.csv_import': 'text-green-400',
    'feature.youtube_import': 'text-red-400',
    'feature.pdf_import': 'text-orange-400',
    'feature.ai_ppt': 'text-cyan-400',
};

export default function AdminFeatureTogglesPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [features, setFeatures] = useState<FeatureToggle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [changes, setChanges] = useState<Record<string, boolean>>({});
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (!loading && (!user || !profile?.is_admin)) {
            router.push('/dashboard');
        }
    }, [user, profile, loading, router]);

    useEffect(() => {
        fetchFeatures();
    }, []);

    const fetchFeatures = async () => {
        try {
            const { data, error } = await supabase
                .from('admin_permission_settings')
                .select('*')
                .eq('category', 'features')
                .order('setting_key');

            if (error) throw error;
            setFeatures(data || []);

            // Initialize changes state
            const initialChanges: Record<string, boolean> = {};
            data?.forEach(f => {
                initialChanges[f.setting_key] = f.default_value === 'true';
            });
            setChanges(initialChanges);
        } catch (error) {
            console.error('Error fetching features:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = (key: string, value: boolean) => {
        setChanges(prev => ({ ...prev, [key]: value }));
    };

    const saveChanges = async () => {
        setIsSaving(true);
        setSaveSuccess(false);

        try {
            const updates = Object.entries(changes).map(([key, value]) => ({
                setting_key: key,
                default_value: value.toString(),
            }));

            for (const update of updates) {
                await supabase
                    .from('admin_permission_settings')
                    .update({ default_value: update.default_value })
                    .eq('setting_key', update.setting_key);
            }

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving features:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading || isLoading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const formatFeatureName = (key: string) => {
        return key.replace('feature.', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="min-h-screen bg-[#0f172a] relative">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px]"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[150px]"></div>
            </div>

            <div className="relative z-10 p-8 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/admin')}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Settings className="w-6 h-6 text-blue-400" />
                                Feature Toggles
                            </h1>
                            <p className="text-slate-400 text-sm">Control which features are visible to users</p>
                        </div>
                    </div>
                    <button
                        onClick={saveChanges}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-400 transition-colors disabled:opacity-50"
                    >
                        {isSaving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : saveSuccess ? (
                            <Check className="w-5 h-5" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        {saveSuccess ? 'Saved!' : 'Save Changes'}
                    </button>
                </div>

                {/* Info Banner */}
                <div className="glass-card p-4 mb-8 border-l-4 border-blue-500">
                    <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-white font-medium">Feature Control</p>
                            <p className="text-slate-400 text-sm mt-1">
                                Toggle features on or off. Disabled features will be hidden from the sidebar and inaccessible to users.
                                Changes take effect immediately after saving.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Features List */}
                <div className="glass-card divide-y divide-white/5">
                    {features.length === 0 ? (
                        <div className="p-8 text-center">
                            <Settings className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">No feature toggles found.</p>
                            <p className="text-slate-500 text-sm mt-2">
                                Run the SQL script to add feature toggles to your database.
                            </p>
                        </div>
                    ) : (
                        features.map((feature) => {
                            const Icon = FEATURE_ICONS[feature.setting_key] || Settings;
                            const color = FEATURE_COLORS[feature.setting_key] || 'text-slate-400';
                            const isEnabled = changes[feature.setting_key] ?? feature.default_value === 'true';

                            return (
                                <div key={feature.setting_key} className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">
                                                {formatFeatureName(feature.setting_key)}
                                            </h3>
                                            <p className="text-slate-400 text-sm">{feature.description}</p>
                                        </div>
                                    </div>
                                    <ToggleSwitch
                                        checked={isEnabled}
                                        onChange={(checked) => handleToggle(feature.setting_key, checked)}
                                    />
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Feature Status Summary */}
                <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="glass-card p-4 text-center">
                        <div className="text-3xl font-bold text-emerald-400">
                            {Object.values(changes).filter(Boolean).length}
                        </div>
                        <div className="text-slate-400 text-sm">Enabled Features</div>
                    </div>
                    <div className="glass-card p-4 text-center">
                        <div className="text-3xl font-bold text-slate-500">
                            {Object.values(changes).filter(v => !v).length}
                        </div>
                        <div className="text-slate-400 text-sm">Disabled Features</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
