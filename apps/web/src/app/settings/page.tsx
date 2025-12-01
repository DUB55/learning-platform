'use client';

import { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { useUISettings } from '@/contexts/UISettingsContext';
import { Palette, Zap, Eye, Check } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';

export default function SettingsPage() {
    const { settings, updateSettings } = useUISettings();
    const { toasts, showToast, hideToast } = useToast();

    const handleToggle = async (key: keyof typeof settings) => {
        const newValue = typeof settings[key] === 'boolean' ? !settings[key] : settings[key];
        await updateSettings({ [key]: newValue });
        showToast('Settings updated', 'success');
    };

    const handleIconStyleChange = async (style: 'colored' | 'monochrome') => {
        await updateSettings({ iconStyle: style });
        showToast('Icon style updated', 'success');
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto relative p-8">
                <div className="max-w-4xl mx-auto">
                    <header className="mb-10">
                        <h1 className="text-3xl font-serif font-bold text-white mb-2">Settings</h1>
                        <p className="text-slate-400">Customize your learning experience</p>
                    </header>

                    {/* Appearance Section */}
                    <div className="glass-card p-6 mb-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Palette className="w-5 h-5 text-purple-400" />
                            <h2 className="text-xl font-bold text-white">Appearance</h2>
                        </div>

                        {/* Icon Style */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-300 mb-3">
                                Icon Style
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleIconStyleChange('colored')}
                                    className={`p-4 rounded-xl border-2 transition-all ${settings.iconStyle === 'colored'
                                        ? 'border-purple-500 bg-purple-500/10'
                                        : 'border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-white font-medium">Colored Icons</span>
                                        {settings.iconStyle === 'colored' && (
                                            <Check className="w-5 h-5 text-purple-400" />
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-400 text-left">
                                        Icons with vibrant colors
                                    </p>
                                    <div className="flex gap-2 mt-3">
                                        <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center">
                                            <span className="text-blue-400">📚</span>
                                        </div>
                                        <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center">
                                            <span className="text-purple-400">✨</span>
                                        </div>
                                        <div className="w-8 h-8 rounded bg-green-500/20 flex items-center justify-center">
                                            <span className="text-green-400">📅</span>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleIconStyleChange('monochrome')}
                                    className={`p-4 rounded-xl border-2 transition-all ${settings.iconStyle === 'monochrome'
                                        ? 'border-purple-500 bg-purple-500/10'
                                        : 'border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-white font-medium">Monochrome</span>
                                        {settings.iconStyle === 'monochrome' && (
                                            <Check className="w-5 h-5 text-purple-400" />
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-400 text-left">
                                        All icons in grey tones
                                    </p>
                                    <div className="flex gap-2 mt-3">
                                        <div className="w-8 h-8 rounded bg-slate-700/50 flex items-center justify-center">
                                            <span className="text-slate-400">📚</span>
                                        </div>
                                        <div className="w-8 h-8 rounded bg-slate-700/50 flex items-center justify-center">
                                            <span className="text-slate-400">✨</span>
                                        </div>
                                        <div className="w-8 h-8 rounded bg-slate-700/50 flex items-center justify-center">
                                            <span className="text-slate-400">📅</span>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Compact Sidebar */}
                        <div className="border-t border-white/5 pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium text-slate-300 block mb-1">
                                        Compact Sidebar
                                    </label>
                                    <p className="text-sm text-slate-500">
                                        Reduce sidebar width for more screen space
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleToggle('sidebarCompact')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.sidebarCompact ? 'bg-purple-600' : 'bg-slate-700'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.sidebarCompact ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Performance Section */}
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            <h2 className="text-xl font-bold text-white">Performance</h2>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-slate-300 block mb-1">
                                    Animations
                                </label>
                                <p className="text-sm text-slate-500">
                                    Enable smooth transitions and animations
                                </p>
                            </div>
                            <button
                                onClick={() => handleToggle('animationsEnabled')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.animationsEnabled ? 'bg-purple-600' : 'bg-slate-700'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.animationsEnabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => hideToast(toast.id)}
                    />
                ))}
            </main>
        </div>
    );
}
