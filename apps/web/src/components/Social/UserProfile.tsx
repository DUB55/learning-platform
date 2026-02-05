'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Trophy, UserPlus, Check, Clock, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface Profile {
    id: string;
    username?: string;
    full_name?: string;
    is_admin?: boolean;
    bio?: string;
    avatar_url?: string;
    total_xp?: number;
}

export default function UserProfile({ profileId, currentUserId }: { profileId: string, currentUserId: string }) {
    const { showToast } = useToast();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'accepted'>('none');
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profileId)
            .single();
        setProfile(data);
        setLoading(false);
    }, [profileId]);

    const checkFriendship = useCallback(async () => {
        if (!currentUserId || currentUserId === profileId) return;
        const { data } = await supabase
            .from('friendships')
            .select('*')
            .or(`and(user_id.eq.${currentUserId},friend_id.eq.${profileId}),and(user_id.eq.${profileId},friend_id.eq.${currentUserId})`)
            .single();

        if (data) setFriendStatus(data.status as 'none' | 'pending' | 'accepted');
    }, [currentUserId, profileId]);

    const sendFriendRequest = async () => {
        try {
            const { error } = await supabase
                .from('friendships')
                .insert({
                    user_id: currentUserId,
                    friend_id: profileId,
                    status: 'pending'
                });
            if (error) throw error;
            setFriendStatus('pending');
            showToast('Friend request sent!', 'success');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to send friend request';
            showToast(message, 'error');
        }
    };

    useEffect(() => {
        fetchProfile();
        checkFriendship();
    }, [fetchProfile, checkFriendship]);

    if (loading) return <div className="text-white p-8">Loading profile...</div>;
    if (!profile) return <div className="text-white p-8">User not found.</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-8 animate-fade-in">
            {/* Profile Header */}
            <div className="bg-[#1e293b] rounded-3xl border border-white/10 p-10 overflow-hidden relative mb-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32" />

                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="w-32 h-32 rounded-3xl bg-slate-800 border-2 border-white/10 overflow-hidden flex-shrink-0">
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                                <User size={48} />
                            </div>
                        )}
                    </div>

                    <div className="text-center md:text-left flex-1">
                        <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                            <h1 className="text-4xl font-black text-white">{profile.username || profile.full_name}</h1>
                            {profile.is_admin && (
                                <span className="bg-yellow-500 text-slate-900 text-[10px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1">
                                    <ShieldCheck size={12} /> Admin
                                </span>
                            )}
                        </div>
                        <p className="text-slate-400 max-w-lg mb-6">{profile.bio || "No bio yet."}</p>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <div className="bg-slate-900 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3">
                                <Trophy className="text-yellow-400" size={18} />
                                <div>
                                    <span className="block text-white font-bold">{profile.total_xp?.toLocaleString() || 0}</span>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Total XP</span>
                                </div>
                            </div>

                            {currentUserId && currentUserId !== profileId && (
                                <button
                                    onClick={sendFriendRequest}
                                    disabled={friendStatus !== 'none'}
                                    className={`px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${friendStatus === 'accepted' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                            friendStatus === 'pending' ? 'bg-slate-800 text-slate-400 border border-white/5' :
                                                'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20'
                                        }`}
                                >
                                    {friendStatus === 'accepted' ? <Check size={18} /> :
                                        friendStatus === 'pending' ? <Clock size={18} /> : <UserPlus size={18} />}
                                    {friendStatus === 'accepted' ? 'Friends' :
                                        friendStatus === 'pending' ? 'Request Sent' : 'Add Friend'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Tabs TBD (Achievements, Recent Games etc) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#1e293b] rounded-3xl border border-white/10 p-8">
                    <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                        <Trophy className="text-yellow-400" size={20} />
                        Study Achievements
                    </h3>
                    <div className="flex items-center justify-center h-40 text-slate-600 italic">
                        No achievements yet.
                    </div>
                </div>
                <div className="bg-[#1e293b] rounded-3xl border border-white/10 p-8">
                    <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                        <ShieldCheck className="text-blue-400" size={20} />
                        Recent Activities
                    </h3>
                    <div className="flex items-center justify-center h-40 text-slate-600 italic">
                        No recent activity.
                    </div>
                </div>
            </div>
        </div>
    );
}
