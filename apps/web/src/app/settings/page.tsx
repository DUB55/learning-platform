'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUISettings } from '@/contexts/UISettingsContext';
import { Moon, Sun, Monitor, Type, Layout, Bell, Shield, Eye, Palette, Volume2, Globe } from 'lucide-react';
import ToggleSwitch from '@/components/ui/ToggleSwitch';


export default function SettingsPage() {
    const { user, profile } = useAuth();
    const { settings, updateSettings, resetSettings } = useUISettings();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const sections = [
        {
            id: 'appearance',
            title: 'Appearance',
            icon: <Palette className="w-5 h-5 text-purple-400" />,
            description: 'Customize the look and feel of your interface',
            settings: [
                {
                    id: 'theme',
                    title: 'Theme',
                    type: 'select',
                    value: settings.theme,
                    options: [
                        { value: 'dark', label: 'Dark Mode', icon: <Moon className="w-4 h-4" /> },
                        { value: 'light', label: 'Light Mode', icon: <Sun className="w-4 h-4" /> },
                        { value: 'system', label: 'System Default', icon: <Monitor className="w-4 h-4" /> }
                    ],
                    onChange: (val: any) => updateSettings({ theme: val })
                },
                {
                    id: 'cardStyle',
                    title: 'Card Style',
                    type: 'select',
                    value: settings.cardStyle,
                    options: [
                        { value: 'glass', label: 'Glassmorphism' },
                        { value: 'solid', label: 'Solid' },
                        { value: 'minimal', label: 'Minimal' }
                    ],
                    onChange: (val: any) => updateSettings({ cardStyle: val })
                }
            ]
        },
        {
            id: 'accessibility',
            title: 'Accessibility',
            icon: <Type className="w-5 h-5 text-blue-400" />,
            description: 'Adjust text size and readability settings',
            settings: [
                {
                    id: 'fontSize',
                    title: 'Font Size',
                    type: 'select',
                    value: settings.fontSize,
                    options: [
                        { value: 'small', label: 'Small' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'large', label: 'Large' }
                    ],
                    onChange: (val: any) => updateSettings({ fontSize: val })
                },
                {
                    id: 'reduceMotion',
                    title: 'Reduce Motion',
                    type: 'toggle',
                    value: settings.reduceMotion,
                    onChange: (val: any) => updateSettings({ reduceMotion: val })
                },
                {
                    id: 'highContrast',
                    title: 'High Contrast',
                    type: 'toggle',
                    value: settings.highContrast,
                    onChange: (val: any) => updateSettings({ highContrast: val })
                }
            ]
        },
        {
            id: 'layout',
            title: 'Layout',
            icon: <Layout className="w-5 h-5 text-green-400" />,
            description: 'Configure sidebar and content layout',
            settings: [
                {
                    id: 'sidebarCompact',
                    title: 'Compact Sidebar',
                    type: 'toggle',
                    value: settings.sidebarCompact,
                    onChange: (val: any) => updateSettings({ sidebarCompact: val })
                }
            ]
        },
        {
            id: 'notifications',
            title: 'Notifications',
            icon: <Bell className="w-5 h-5 text-yellow-400" />,
            description: 'Manage your notification preferences',
            settings: [
                {
                    id: 'notifications',
                    title: 'Enable Notifications',
                    type: 'toggle',
                    value: settings.notifications,
                    onChange: (val: any) => updateSettings({ notifications: val })
                },
                {
                    id: 'soundEnabled',
                    title: 'Sound Effects',
                    type: 'toggle',
                    value: settings.soundEnabled,
                    onChange: (val: any) => updateSettings({ soundEnabled: val })
                }
            ]
        }
    ];

    return (
        <div className="h-full overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-3xl font-serif font-bold text-white mb-2">Settings</h1>
                    <p className="text-slate-400">Manage your preferences and application settings</p>
                </header>

                <div className="space-y-8">
                    {sections.map((section) => (
                        <div key={section.id} className="glass-card p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                    {section.icon}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">{section.title}</h2>
                                    <p className="text-sm text-slate-400">{section.description}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {section.settings.map((setting) => (
                                    <div key={setting.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                        <div className="flex-1">
                                            <h3 className="font-medium text-white">{setting.title}</h3>
                                        </div>

                                        <div className="flex-shrink-0 ml-4">
                                            {setting.type === 'toggle' ? (
                                                <ToggleSwitch
                                                    checked={setting.value as boolean}
                                                    onChange={() => setting.onChange(!setting.value)}
                                                />
                                            ) : setting.type === 'select' ? (
                                                <div className="relative">
                                                    <select
                                                        value={setting.value as string}
                                                        onChange={(e) => setting.onChange(e.target.value)}
                                                        className="bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 appearance-none pr-10 cursor-pointer"
                                                    >
                                                        {setting.options?.map((opt) => (
                                                            <option key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={resetSettings}
                        className="px-6 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors font-medium text-sm"
                    >
                        Reset to Defaults
                    </button>
                </div>
            </div>
        </div>
    );
}
