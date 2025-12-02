'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Shield, Search, Save, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PermissionSetting {
    id: string;
    category: string;
    subcategory: string | null;
    setting_key: string;
    setting_name: string;
    setting_description: string | null;
    setting_type: 'boolean' | 'string' | 'number' | 'enum';
    default_value: string;
    order_index: number;
}

export default function AdminPermissionsPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    const [settings, setSettings] = useState<PermissionSetting[]>([]);
    const [modifiedSettings, setModifiedSettings] = useState<Record<string, string>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        if (!loading) {
            if (!user || !profile?.is_admin) {
                router.push('/dashboard');
                return;
            }
            fetchSettings();
        }
    }, [user, profile, loading, router]);

    const fetchSettings = async () => {
        setIsLoadingData(true);

        const { data, error } = await (supabase
            .from('admin_permission_settings') as any)
            .select('*')
            .order('category')
            .order('order_index');

        if (!error && data) {
            setSettings(data);
            // Expand all categories by default
            const categories = new Set(data.map((s: any) => s.category));
            setExpandedCategories(categories);
        }

        setIsLoadingData(false);
    };

    const handleSettingChange = (key: string, value: string) => {
        setModifiedSettings({ ...modifiedSettings, [key]: value });
    };

    const handleSaveAll = async () => {
        if (Object.keys(modifiedSettings).length === 0) return;

        setIsSaving(true);

        try {
            // Update each modified setting
            for (const [key, value] of Object.entries(modifiedSettings)) {
                await (supabase
                    .from('admin_permission_settings') as any)
                    .update({ default_value: value })
                    .eq('setting_key', key);
            }

            alert('Settings saved successfully!');
            setModifiedSettings({});
            fetchSettings();
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings');
        }

        setIsSaving(false);
    };

    const toggleCategory = (category: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(category)) {
            newExpanded.delete(category);
        } else {
            newExpanded.add(category);
        }
        setExpandedCategories(newExpanded);
    };

    const getCategoryText = (category: string) => {
        return category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ');
    };

    const getEnumOptions = (settingKey: string) => {
        const enumMaps: Record<string, { value: string; label: string }[]> = {
            'ui.font_family': [
                { value: 'inter', label: 'Inter (Default)' },
                { value: 'outfit', label: 'Outfit' },
                { value: 'roboto', label: 'Roboto' },
                { value: 'opensans', label: 'Open Sans' }
            ],
            'ui.sidebar_default_state': [
                { value: 'expanded', label: 'Expanded' },
                { value: 'collapsed', label: 'Collapsed' }
            ],
            'ui.theme_color': [
                { value: 'blue', label: 'Blue' },
                { value: 'purple', label: 'Purple' },
                { value: 'pink', label: 'Pink' },
                { value: 'green', label: 'Green' },
                { value: 'orange', label: 'Orange' }
            ],
            'ui.icon_style': [
                { value: 'colored', label: 'Colored' },
                { value: 'monochrome', label: 'Monochrome' }
            ],
            'calendar.default_view': [
                { value: 'month', label: 'Month View' },
                { value: 'week', label: 'Week View' },
                { value: 'day', label: 'Day View' },
                { value: 'list', label: 'List View' }
            ],
            'tasks.default_priority': [
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' }
            ],
            'dashboard.widget_layout': [
                { value: 'grid', label: 'Grid Layout' },
                { value: 'list', label: 'List Layout' },
                { value: 'compact', label: 'Compact Layout' }
            ]
        };
        return enumMaps[settingKey] || [{ value: '', label: 'Unknown' }];
    };

    const getSettingCount = (category: string, subcategory?: string) => {
        return settings.filter(s =>
            s.category === category &&
            (subcategory ? s.subcategory === subcategory : !s.subcategory)
        ).length;
    };

    const filteredSettings = searchQuery
        ? settings.filter(s =>
            s.setting_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.setting_description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : settings;

    const groupedSettings = filteredSettings.reduce((acc, setting) => {
        const key = setting.subcategory
            ? `${setting.category}.${setting.subcategory}`
            : setting.category;

        if (!acc[key]) acc[key] = [];
        acc[key].push(setting);
        return acc;
    }, {} as Record<string, PermissionSetting[]>);

    const categoriesHierarchy = {
        'dashboard': { name: 'Dashboard Settings', subcategories: [] },
        'subjects': {
            name: 'Subjects Settings',
            subcategories: ['documents']
        },
        'study_modes': { name: 'Study Modes', subcategories: [] },
        'calendar': { name: 'Calendar Settings', subcategories: [] },
        'library': { name: 'Library Settings', subcategories: [] },
        'tasks': { name: 'Task Settings', subcategories: [] }
    };

    if (loading || isLoadingData) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto relative p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
                                <Shield className="w-8 h-8 text-blue-400" />
                                Permission Settings
                            </h1>
                            <p className="text-slate-400">Configure granular permissions for all users ({settings.length} settings)</p>
                        </div>

                        {Object.keys(modifiedSettings).length > 0 && (
                            <button
                                onClick={handleSaveAll}
                                disabled={isSaving}
                                className="glass-button px-6 py-3 rounded-xl flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                <span>{isSaving ? 'Saving...' : `Save Changes (${Object.keys(modifiedSettings).length})`}</span>
                            </button>
                        )}
                    </div>

                    {/* Search */}
                    <div className="glass-card p-4 mb-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search settings..."
                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Settings by Category */}
                    <div className="space-y-4">
                        {Object.entries(categoriesHierarchy).map(([category, { name, subcategories }]) => {
                            const hasSubcats = subcategories.length > 0;
                            const isExpanded = expandedCategories.has(category);
                            const mainCount = getSettingCount(category);

                            return (
                                <div key={category} className="glass-card overflow-hidden">
                                    {/* Category Header */}
                                    <button
                                        onClick={() => toggleCategory(category)}
                                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            {isExpanded ? (
                                                <ChevronDown className="w-5 h-5 text-slate-400" />
                                            ) : (
                                                <ChevronRight className="w-5 h-5 text-slate-400" />
                                            )}
                                            <h2 className="text-xl font-bold text-white">{name}</h2>
                                        </div>
                                        <span className="text-slate-500 text-sm">
                                            {mainCount + subcategories.reduce((acc, sub) => acc + getSettingCount(category, sub), 0)} settings
                                        </span>
                                    </button>

                                    {/* Settings */}
                                    {isExpanded && (
                                        <div className="px-6 pb-4">
                                            {/* Main category settings */}
                                            {groupedSettings[category]?.map((setting) => (
                                                <div key={setting.id} className="py-4 border-b border-white/5 last:border-0">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <h4 className="text-white font-medium mb-1">{setting.setting_name}</h4>
                                                            {setting.setting_description && (
                                                                <p className="text-slate-400 text-sm">{setting.setting_description}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            {setting.setting_type === 'boolean' && (
                                                                <label className="relative inline-flex items-center cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={(modifiedSettings[setting.setting_key] ?? setting.default_value) === 'true'}
                                                                        onChange={(e) => handleSettingChange(setting.setting_key, e.target.checked ? 'true' : 'false')}
                                                                        className="sr-only peer"
                                                                    />
                                                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                                </label>
                                                            )}

                                                            {setting.setting_type === 'number' && (
                                                                <input
                                                                    type="number"
                                                                    value={modifiedSettings[setting.setting_key] ?? setting.default_value}
                                                                    onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
                                                                    className="w-24 bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                                                />
                                                            )}

                                                            {setting.setting_type === 'string' && (
                                                                <input
                                                                    type="text"
                                                                    value={modifiedSettings[setting.setting_key] ?? setting.default_value}
                                                                    onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
                                                                    className="w-48 bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                                                />
                                                            )}

                                                            {setting.setting_type === 'enum' && (
                                                                <select
                                                                    value={modifiedSettings[setting.setting_key] ?? setting.default_value}
                                                                    onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
                                                                    className="w-48 bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                                                >
                                                                    {getEnumOptions(setting.setting_key).map(opt => (
                                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                    ))}
                                                                </select>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Subcategory settings */}
                                            {subcategories.map(subcat => {
                                                const subSettings = groupedSettings[`${category}.${subcat}`] || [];
                                                if (subSettings.length === 0) return null;

                                                return (
                                                    <div key={subcat} className="mt-6">
                                                        <h3 className="text-lg font-bold text-blue-400 mb-3 capitalize">
                                                            {subcat} ({subSettings.length})
                                                        </h3>
                                                        {subSettings.map((setting) => (
                                                            <div key={setting.id} className="py-4 border-b border-white/5 last:border-0">
                                                                <div className="flex items-start justify-between gap-4">
                                                                    <div className="flex-1">
                                                                        <h4 className="text-white font-medium mb-1">{setting.setting_name}</h4>
                                                                        {setting.setting_description && (
                                                                            <p className="text-slate-400 text-sm">{setting.setting_description}</p>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        {setting.setting_type === 'boolean' && (
                                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={(modifiedSettings[setting.setting_key] ?? setting.default_value) === 'true'}
                                                                                    onChange={(e) => handleSettingChange(setting.setting_key, e.target.checked ? 'true' : 'false')}
                                                                                    className="sr-only peer"
                                                                                />
                                                                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                                            </label>
                                                                        )}

                                                                        {setting.setting_type === 'number' && (
                                                                            <input
                                                                                type="number"
                                                                                value={modifiedSettings[setting.setting_key] ?? setting.default_value}
                                                                                onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
                                                                                className="w-24 bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                                                            />
                                                                        )}

                                                                        {setting.setting_type === 'string' && (
                                                                            <input
                                                                                type="text"
                                                                                value={modifiedSettings[setting.setting_key] ?? setting.default_value}
                                                                                onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
                                                                                className="w-48 bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                                                            />
                                                                        )}

                                                                        {setting.setting_type === 'enum' && setting.setting_key === 'ui.font_family' && (
                                                                            <select
                                                                                value={modifiedSettings[setting.setting_key] ?? setting.default_value}
                                                                                onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
                                                                                className="w-48 bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                                                            >
                                                                                <option value="inter">Inter (Default)</option>
                                                                                <option value="outfit">Outfit</option>
                                                                                <option value="roboto">Roboto</option>
                                                                                <option value="opensans">Open Sans</option>
                                                                            </select>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}
