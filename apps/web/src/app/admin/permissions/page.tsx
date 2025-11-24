'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { Settings, Loader2, Save, RotateCcw } from 'lucide-react';

export default function AdminPermissionsPage() {
    const { profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const { settings, loading, updateSetting, isAdmin } = useAdminSettings();
    const [saving, setSaving] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (!authLoading && !profile?.is_admin) {
            router.push('/dashboard');
        }
    }, [profile, authLoading, router]);

    if (authLoading || !isAdmin) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    const handleToggleSetting = async (settingKey: string, currentValue: any) => {
        setSaving(settingKey);
        const newValue = !currentValue;
        const success = await updateSetting(settingKey, newValue);

        if (success) {
            setSuccessMessage(`Setting "${settingKey}" updated successfully`);
            setTimeout(() => setSuccessMessage(''), 3000);
        }
        setSaving(null);
    };

    const settingsByCategory = settings.reduce((acc, setting) => {
        if (!acc[setting.category]) {
            acc[setting.category] = [];
        }
        acc[setting.category].push(setting);
        return acc;
    }, {} as Record<string, typeof settings>);

    const categoryInfo: Record<string, { title: string; description: string; icon: string }> = {
        ui: {
            title: 'User Interface',
            description: 'Control visual elements and UI behavior',
            icon: '🎨'
        },
        features: {
            title: 'Features',
            description: 'Enable or disable platform features',
            icon: '⚡'
        },
        system: {
            title: 'System',
            description: 'System-wide configuration and limits',
            icon: '⚙️'
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex">
            <Sidebar />

            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <Settings className="w-8 h-8 text-blue-400" />
                            <h1 className="text-3xl font-serif font-bold text-white">Admin Permissions</h1>
                        </div>
                        <p className="text-slate-400">
                            Configure global settings and feature toggles for all users
                        </p>
                    </div>

                    {/* Success Message */}
                    {successMessage && (
                        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
                            {successMessage}
                        </div>
                    )}

                    {/* Loading State */}
                    {loading ? (
                        <div className="glass-card p-12 text-center">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
                            <p className="text-slate-400">Loading settings...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(settingsByCategory).map(([category, categorySettings]) => (
                                <div key={category} className="glass-card p-6">
                                    {/* Category Header */}
                                    <div className="mb-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-2xl">{categoryInfo[category]?.icon || '📋'}</span>
                                            <h2 className="text-2xl font-bold text-white">
                                                {categoryInfo[category]?.title || category}
                                            </h2>
                                        </div>
                                        <p className="text-slate-400 text-sm">
                                            {categoryInfo[category]?.description || `Settings for ${category}`}
                                        </p>
                                    </div>

                                    {/* Settings List */}
                                    <div className="space-y-4">
                                        {categorySettings.map((setting) => (
                                            <SettingToggle
                                                key={setting.id}
                                                setting={setting}
                                                onToggle={handleToggleSetting}
                                                isSaving={saving === setting.setting_key}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <h3 className="text-white font-semibold mb-2">💡 Real-time Updates</h3>
                        <p className="text-slate-400 text-sm">
                            Changes take effect immediately for all users. Settings are synchronized in real-time
                            across all active sessions.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}

function SettingToggle({
    setting,
    onToggle,
    isSaving
}: {
    setting: any;
    onToggle: (key: string, currentValue: any) => void;
    isSaving: boolean;
}) {
    const isBoolean = typeof setting.setting_value === 'boolean' ||
        (typeof setting.setting_value === 'string' &&
            (setting.setting_value === 'true' || setting.setting_value === 'false'));

    const boolValue = typeof setting.setting_value === 'boolean'
        ? setting.setting_value
        : setting.setting_value === 'true';

    return (
        <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h3 className="text-white font-medium">
                        {setting.setting_key.split('_').map((word: string) =>
                            word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                    </h3>
                    {isSaving && (
                        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    )}
                </div>
                <p className="text-sm text-slate-400 mt-1">
                    {setting.description || 'No description available'}
                </p>
                {!isBoolean && (
                    <p className="text-sm text-blue-400 mt-2">
                        Current value: <span className="font-mono">{JSON.stringify(setting.setting_value)}</span>
                    </p>
                )}
            </div>

            {isBoolean && (
                <button
                    onClick={() => onToggle(setting.setting_key, boolValue)}
                    disabled={isSaving}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${boolValue ? 'bg-blue-600' : 'bg-slate-700'
                        } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${boolValue ? 'translate-x-6' : 'translate-x-1'
                            }`}
                    />
                </button>
            )}
        </div>
    );
}
