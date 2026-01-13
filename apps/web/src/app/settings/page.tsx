'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUISettings } from '@/contexts/UISettingsContext';
import {
    Moon, Sun, Monitor, Type, Layout, Bell, Shield,
    Palette, Volume2, Globe, User, CreditCard, Lock,
    Camera, Mail
} from 'lucide-react';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import ProfilePictureModal from '@/components/SidebarItem'; // Wait, standard path is components/ProfilePictureModal
// Actually check imports - usually logic is better to be explicit 
import SidebarProfileModal from '@/components/ProfilePictureModal';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';

type Tab = 'general' | 'appearance' | 'notifications' | 'billing';

export default function SettingsPage() {
    const { user, profile } = useAuth();
    const { settings, updateSettings, resetSettings } = useUISettings();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [showProfileModal, setShowProfileModal] = useState(false);

    // Profile State
    const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Sync profile state when loaded
    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setBio(profile.bio || '');
        }
    }, [profile]);

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSavingProfile(true);
        try {
            const updates = {
                id: user.id,
                full_name: fullName,
                bio: bio,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;
            showToast('Profile updated successfully', 'success');
        } catch (error: any) {
            console.error('Error updating profile:', error);
            showToast('Failed to update profile', 'error');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: User },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        // { id: 'billing', label: 'Billing', icon: CreditCard },
    ];

    return (
        <div className="h-full overflow-y-auto p-4 md:p-8 animate-fade-in">
            <SidebarProfileModal
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                currentAvatarUrl={profile?.avatar_url}
                onUpdate={() => window.location.reload()} // Simple reload for now
            />

            <div className="max-w-6xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-serif font-bold text-white mb-2">Settings</h1>
                    <p className="text-slate-400">Manage your account and preferences</p>
                </header>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Tabs */}
                    <div className="w-full md:w-64 flex-shrink-0">
                        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-2 sticky top-4">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as Tab)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === tab.id
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    <span className="font-medium">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 space-y-6">

                        {/* GENERAL TAB */}
                        {activeTab === 'general' && (
                            <div className="space-y-6 animate-fade-in">
                                {/* Profile Card */}
                                <div className="glass-card p-8">
                                    <h2 className="text-xl font-bold text-white mb-6">Profile Information</h2>

                                    <div className="flex flex-col md:flex-row items-start gap-8">
                                        {/* Avatar */}
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-800 ring-4 ring-slate-800 shadow-xl relative group">
                                                {profile?.avatar_url ? (
                                                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-bold text-white">
                                                        {fullName?.charAt(0) || user?.email?.charAt(0)}
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => setShowProfileModal(true)}
                                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                                >
                                                    <Camera className="w-6 h-6" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => setShowProfileModal(true)}
                                                className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                                            >
                                                Change Picture
                                            </button>
                                        </div>

                                        {/* Fields */}
                                        <div className="flex-1 w-full space-y-4">
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-2">Display Name</label>
                                                <input
                                                    type="text"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-2">Email Address</label>
                                                <div className="w-full bg-slate-900/30 border border-white/5 rounded-xl px-4 py-3 text-slate-400 flex items-center gap-2 cursor-not-allowed">
                                                    <Mail className="w-4 h-4" />
                                                    {user?.email}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-2">Bio</label>
                                                <textarea
                                                    value={bio}
                                                    onChange={(e) => setBio(e.target.value)}
                                                    rows={3}
                                                    placeholder="Tell us a bit about yourself..."
                                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                                />
                                            </div>
                                            <div className="pt-4 flex justify-end">
                                                <button
                                                    onClick={handleSaveProfile}
                                                    disabled={isSavingProfile}
                                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                                >
                                                    {isSavingProfile ? 'Saving...' : 'Save Changes'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Language/Region (Placeholder) */}
                                <div className="glass-card p-6 opacity-70">
                                    <div className="flex items-center gap-4 mb-4">
                                        <Globe className="w-5 h-5 text-green-400" />
                                        <h3 className="text-lg font-bold text-white">Language & Region</h3>
                                    </div>
                                    <p className="text-slate-400 text-sm mb-4">Localization settings are coming soon.</p>
                                    <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                                        <div className="flex justify-between items-center text-slate-500 text-sm">
                                            <span>Language</span>
                                            <span>English (US)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* APPEARANCE TAB */}
                        {activeTab === 'appearance' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="glass-card p-8">
                                    <h2 className="text-xl font-bold text-white mb-6">Theme Preferences</h2>

                                    <div className="space-y-6">
                                        {/* Theme Select */}
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                                            <div>
                                                <h3 className="font-medium text-white mb-1">Color Theme</h3>
                                                <p className="text-sm text-slate-400">Choose your preferred visual theme</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {[
                                                    { id: 'dark', label: 'Dark', icon: Moon },
                                                    { id: 'light', label: 'Light', icon: Sun },
                                                    { id: 'system', label: 'Auto', icon: Monitor },
                                                ].map((theme) => (
                                                    <button
                                                        key={theme.id}
                                                        onClick={() => updateSettings({ theme: theme.id as any })}
                                                        className={`p-3 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${settings.theme === theme.id
                                                                ? 'bg-blue-600 text-white shadow-lg'
                                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                                            }`}
                                                    >
                                                        <theme.icon className="w-4 h-4" />
                                                        {theme.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Sidebar Compact */}
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                                            <div className="flex items-center gap-3">
                                                <Layout className="w-5 h-5 text-purple-400" />
                                                <div>
                                                    <h3 className="font-medium text-white">Compact Sidebar</h3>
                                                    <p className="text-sm text-slate-400">Minimize the navigation menu</p>
                                                </div>
                                            </div>
                                            <ToggleSwitch
                                                checked={settings.sidebarCompact}
                                                onChange={() => updateSettings({ sidebarCompact: !settings.sidebarCompact })}
                                            />
                                        </div>

                                        {/* High Contrast */}
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                                            <div className="flex items-center gap-3">
                                                <Eye className="w-5 h-5 text-cyan-400" />
                                                <div>
                                                    <h3 className="font-medium text-white">High Contrast</h3>
                                                    <p className="text-sm text-slate-400">Increase visual distinction</p>
                                                </div>
                                            </div>
                                            <ToggleSwitch
                                                checked={settings.highContrast}
                                                onChange={() => updateSettings({ highContrast: !settings.highContrast })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* NOTIFICATIONS TAB */}
                        {activeTab === 'notifications' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="glass-card p-8">
                                    <h2 className="text-xl font-bold text-white mb-6">Notification Settings</h2>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                                            <div className="flex items-center gap-3">
                                                <Bell className="w-5 h-5 text-yellow-400" />
                                                <div>
                                                    <h3 className="font-medium text-white">Push Notifications</h3>
                                                    <p className="text-sm text-slate-400">Receive alerts about your study plans</p>
                                                </div>
                                            </div>
                                            <ToggleSwitch
                                                checked={settings.notifications}
                                                onChange={() => updateSettings({ notifications: !settings.notifications })}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                                            <div className="flex items-center gap-3">
                                                <Volume2 className="w-5 h-5 text-green-400" />
                                                <div>
                                                    <h3 className="font-medium text-white">Sound Effects</h3>
                                                    <p className="text-sm text-slate-400">Play sounds for interactions and alerts</p>
                                                </div>
                                            </div>
                                            <ToggleSwitch
                                                checked={settings.soundEnabled}
                                                onChange={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={resetSettings}
                                className="text-xs text-red-400 hover:text-red-300 hover:underline"
                            >
                                Reset all settings to default
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
