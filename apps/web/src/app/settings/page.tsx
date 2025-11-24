'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { User, Mail, Lock, Bell, Shield, Trash2, Camera } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type SettingsTab = 'account' | 'profile' | 'notifications' | 'privacy';

export default function SettingsPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<SettingsTab>('account');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
        if (profile) {
            setFullName(profile.full_name || '');
        }
        if (user) {
            setEmail(user.email || '');
        }
    }, [user, profile, loading, router]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', user?.id);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match!' });
            return;
        }

        setSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;

        setSaving(true);
        try {
            // Delete user data first (cascade will handle related records)
            const { error: deleteError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', user?.id);

            if (deleteError) throw deleteError;

            // Then delete auth user
            const { error: authError } = await supabase.auth.admin.deleteUser(user?.id || '');

            if (authError) throw authError;

            router.push('/login');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
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
                <div className="max-w-4xl mx-auto">
                    <header className="mb-10">
                        <h1 className="text-3xl font-serif font-bold text-white mb-2">Settings</h1>
                        <p className="text-slate-400">Manage your account settings and preferences</p>
                    </header>

                    {/* Message */}
                    {message && (
                        <div className={`mb-6 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-2 mb-8 border-b border-white/10">
                        <Tab label="Account" icon={<User className="w-4 h-4" />} active={activeTab === 'account'} onClick={() => setActiveTab('account')} />
                        <Tab label="Profile" icon={<Camera className="w-4 h-4" />} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                        <Tab label="Notifications" icon={<Bell className="w-4 h-4" />} active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
                        <Tab label="Privacy" icon={<Shield className="w-4 h-4" />} active={activeTab === 'privacy'} onClick={() => setActiveTab('privacy')} />
                    </div>

                    {/* Content */}
                    {activeTab === 'account' && (
                        <div className="space-y-6">
                            {/* Name */}
                            <form onSubmit={handleUpdateProfile} className="glass-card p-6">
                                <h3 className="text-lg font-medium text-white mb-4">Full Name</h3>
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="flex-1 bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="Your full name"
                                    />
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </form>

                            {/* Email */}
                            <div className="glass-card p-6">
                                <h3 className="text-lg font-medium text-white mb-4">Email Address</h3>
                                <input
                                    type="email"
                                    value={email}
                                    disabled
                                    className="w-full bg-slate-800/30 border border-white/10 rounded-xl px-4 py-2 text-slate-400 cursor-not-allowed"
                                />
                                <p className="text-sm text-slate-500 mt-2">Contact support to change your email address</p>
                            </div>

                            {/* Password */}
                            <form onSubmit={handleChangePassword} className="glass-card p-6">
                                <h3 className="text-lg font-medium text-white mb-4">Change Password</h3>
                                <div className="space-y-4">
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="New password"
                                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        {saving ? 'Updating...' : 'Update Password'}
                                    </button>
                                </div>
                            </form>

                            {/* Delete Account */}
                            <div className="glass-card p-6 border-red-500/20">
                                <h3 className="text-lg font-medium text-red-400 mb-2">Delete Account</h3>
                                <p className="text-slate-400 text-sm mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={saving}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-medium text-white mb-4">Profile Picture</h3>
                            <p className="text-slate-400 text-sm">Profile picture upload coming soon!</p>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-medium text-white mb-4">Notification Preferences</h3>
                            <p className="text-slate-400 text-sm">Notification settings coming soon!</p>
                        </div>
                    )}

                    {activeTab === 'privacy' && (
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-medium text-white mb-4">Privacy Settings</h3>
                            <p className="text-slate-400 text-sm">Privacy settings coming soon!</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function Tab({ label, icon, active, onClick }: { label: string; icon: React.ReactNode; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${active
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
        >
            {icon}
            <span className="font-medium">{label}</span>
        </button>
    );
}
