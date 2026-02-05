'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    Settings, Shield, Sparkles, Layout, Eye, 
    ToggleLeft as Toggle, Sliders, Save, Database
} from 'lucide-react';
import ErrorLogger from '@/lib/ErrorLogger';

export default function AdminSystemSettings() {
    const [settings, setSettings] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase.from('system_settings').select('*');
            if (error) throw error;
            
            const settingsMap = (data || []).reduce((acc, curr) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {} as Record<string, any>);
            
            setSettings(settingsMap);
        } catch (error) {
            ErrorLogger.error('Error fetching system settings', error);
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = async (key: string, value: any) => {
        setSaving(key);
        try {
            const { error } = await supabase
                .from('system_settings')
                .upsert({ 
                    key, 
                    value, 
                    updated_at: new Date().toISOString() 
                }, { onConflict: 'key' });

            if (error) throw error;
            setSettings(prev => ({ ...prev, [key]: value }));
        } catch (error) {
            ErrorLogger.error(`Error updating setting ${key}`, error);
            alert('Failed to update setting');
        } finally {
            setSaving(null);
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse text-slate-500">Loading settings...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Feature Toggles */}
                <div className="glass-card p-6 space-y-4">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        AI Feature Toggles
                    </h3>
                    
                    {[
                        { key: 'feature_ai_flashcards', label: 'AI Flashcard Generation', desc: 'Allow users to generate flashcards using DUB5 AI' },
                        { key: 'feature_ai_chat', label: 'AI Tutor Chat', desc: 'Enable interactive AI tutoring across the platform' },
                        { key: 'feature_ai_audio', label: 'AI Audio Recaps', desc: 'Enable text-to-speech study summaries' },
                        { key: 'feature_ai_mindmap', label: 'AI Mindmaps', desc: 'Enable automatic mindmap generation' }
                    ].map(item => (
                        <div key={item.key} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                            <div>
                                <div className="text-white font-medium">{item.label}</div>
                                <div className="text-xs text-slate-500">{item.desc}</div>
                            </div>
                            <button
                                onClick={() => updateSetting(item.key, !settings[item.key])}
                                disabled={saving === item.key}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings[item.key] ? 'bg-blue-600' : 'bg-slate-700'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* System Maintenance */}
                <div className="glass-card p-6 space-y-4">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-4">
                        <Shield className="w-5 h-5 text-red-400" />
                        Maintenance & Security
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                            <div>
                                <div className="text-white font-medium">Maintenance Mode</div>
                                <div className="text-xs text-slate-500">Locks the platform for all non-admin users</div>
                            </div>
                            <button
                                onClick={() => updateSetting('maintenance_mode', !settings['maintenance_mode'])}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings['maintenance_mode'] ? 'bg-red-600' : 'bg-slate-700'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings['maintenance_mode'] ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-slate-400">Global Announcement Banner</label>
                            <textarea
                                value={settings['global_announcement'] || ''}
                                onChange={(e) => setSettings(prev => ({ ...prev, global_announcement: e.target.value }))}
                                className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500 min-h-[80px]"
                                placeholder="Enter global announcement message..."
                            />
                            <button
                                onClick={() => updateSetting('global_announcement', settings['global_announcement'])}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium self-end transition-all"
                            >
                                Save Announcement
                            </button>
                        </div>
                    </div>
                </div>

                {/* UI Configuration */}
                <div className="glass-card p-6 space-y-4 md:col-span-2">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-4">
                        <Layout className="w-5 h-5 text-emerald-400" />
                        Global UI Defaults
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">Default Landing Page</label>
                            <select
                                value={settings['landing_page_version'] || 'modern'}
                                onChange={(e) => updateSetting('landing_page_version', e.target.value)}
                                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none"
                            >
                                <option value="classic">Classic</option>
                                <option value="modern">Modern</option>
                                <option value="glass">Ultra Glass (Experimental)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">Primary Theme Color</label>
                            <input
                                type="color"
                                value={settings['primary_color'] || '#3b82f6'}
                                onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                                onBlur={(e) => updateSetting('primary_color', e.target.value)}
                                className="w-full h-10 bg-slate-800/50 border border-white/10 rounded-xl px-1 py-1 cursor-pointer"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">Platform Name</label>
                            <input
                                type="text"
                                value={settings['platform_name'] || 'Turbo Learn AI'}
                                onChange={(e) => setSettings(prev => ({ ...prev, platform_name: e.target.value }))}
                                onBlur={(e) => updateSetting('platform_name', e.target.value)}
                                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
