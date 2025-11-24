'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { User, Mail, Calendar, Award } from 'lucide-react';

export default function ProfilePage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

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
                        <h1 className="text-3xl font-serif font-bold text-white mb-2">Profile</h1>
                        <p className="text-slate-400">Your public profile and activity</p>
                    </header>

                    {/* Profile Card */}
                    <div className="glass-card p-8 mb-6">
                        <div className="flex items-start gap-6">
                            {/* Avatar */}
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[3px]">
                                {profile?.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt="Profile"
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-2xl">
                                        {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0].toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-white mb-1">
                                    {profile?.full_name || 'User'}
                                </h2>
                                <p className="text-slate-400 mb-4">{user?.email}</p>

                                <div className="flex gap-4 text-sm">
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <Calendar className="w-4 h-4" />
                                        <span>Joined {new Date(user?.created_at || '').toLocaleDateString()}</span>
                                    </div>
                                    {profile?.is_admin && (
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/50 uppercase">
                                                Admin
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <StatCard icon={<Award className="w-5 h-5 text-blue-400" />} label="Study Streak" value="0 days" />
                        <StatCard icon={<User className="w-5 h-5 text-purple-400" />} label="Subjects" value="0" />
                        <StatCard icon={<Mail className="w-5 h-5 text-emerald-400" />} label="Tasks" value="0" />
                    </div>

                    {/* Activity */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-medium text-white mb-4">Recent Activity</h3>
                        <p className="text-slate-400 text-sm">No recent activity to display</p>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="glass-card p-4 text-center">
            <div className="flex justify-center mb-2">{icon}</div>
            <p className="text-2xl font-bold text-white mb-1">{value}</p>
            <p className="text-xs text-slate-400">{label}</p>
        </div>
    );
}
