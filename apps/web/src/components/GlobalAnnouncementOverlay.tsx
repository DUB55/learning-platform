'use client';

import { useEffect, useState, ElementType } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { X, AlertTriangle, AlertCircle, Lock, ShieldAlert, Info, Megaphone } from 'lucide-react';

interface Announcement {
    id: string;
    title: string;
    content: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    icon?: string;
    badge_text?: string;
    created_at: string;
}

const IconMap: Record<string, ElementType> = {
    'alert-circle': AlertCircle,
    'alert-triangle': AlertTriangle,
    'lock': Lock,
    'shield-alert': ShieldAlert,
    'info': Info,
    'megaphone': Megaphone
};

import { useSearchParams } from 'next/navigation';

export default function GlobalAnnouncementOverlay() {
    const { profile } = useAuth();
    const searchParams = useSearchParams();
    const [blockingAnnouncement, setBlockingAnnouncement] = useState<Announcement | null>(null);
    const [modalAnnouncement, setModalAnnouncement] = useState<Announcement | null>(null);
    const safeMode = Boolean(searchParams.get('safe_mode'));

    useEffect(() => {
        const controller = new AbortController();
        fetchAnnouncements(controller.signal);
        
        // Listen for announcements via Realtime
        const channel = supabase
            .channel('announcements_changes')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'announcements' 
            }, () => {
                fetchAnnouncements(controller.signal);
            })
            .subscribe();

        return () => { 
            supabase.removeChannel(channel); 
            controller.abort();
        };
    }, [safeMode, profile?.is_admin]);

    const fetchAnnouncements = async (signal?: AbortSignal) => {
        try {
            const { data } = await supabase
                .from('announcements')
                .select('*')
                .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
                .order('created_at', { ascending: false })
                .abortSignal(signal);

            if (data) {
                // Find blocking (urgent) - Takes precedence
                // We look for ANY active urgent announcement
                const list = data as unknown as Announcement[];
                const blocking = list.find((a) => a.priority === 'urgent');

                if (blocking) {
                    setBlockingAnnouncement(blocking);
                    setModalAnnouncement(null); // Hide modal if blocking is active
                } else {
                    setBlockingAnnouncement(null);

                    // Find modal (high) - Only if no blocking
                    // We look for the most recent high priority announcement
                    const modal = list.find((a) => a.priority === 'high');

                    if (modal) {
                        // Check local storage to see if already dismissed
                        const seen = localStorage.getItem(`seen_announcement_${modal.id}`);
                        if (!seen) {
                            setModalAnnouncement(modal);
                        } else {
                            setModalAnnouncement(null);
                        }
                    } else {
                        setModalAnnouncement(null);
                    }
                }
            }
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            console.error('Error fetching announcements:', error);
        }
    };

    const dismissModal = () => {
        if (modalAnnouncement) {
            localStorage.setItem(`seen_announcement_${modalAnnouncement.id}`, 'true');
            setModalAnnouncement(null);
        }
    };

    // BLOCKING OVERLAY (Urgent)
    if (blockingAnnouncement && profile?.is_admin) {
        const IconComponent = IconMap[blockingAnnouncement.icon || 'alert-circle'] || AlertCircle;

        return (
            <div className="fixed inset-0 z-[10000] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="max-w-2xl w-full text-center space-y-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500 blur-3xl opacity-20 rounded-full"></div>
                        <IconComponent className="relative w-24 h-24 text-red-500 mx-auto animate-pulse" />
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                            {blockingAnnouncement.title}
                        </h1>
                        <div className="text-xl text-slate-300 leading-relaxed max-w-xl mx-auto">
                            {blockingAnnouncement.content}
                        </div>
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-sm font-medium">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        {blockingAnnouncement.badge_text || 'System Locked by Administrator'}
                    </div>

                    {profile?.is_admin && (
                        <div className="pt-8">
                            <button
                                onClick={() => setBlockingAnnouncement(null)}
                                className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-2 mx-auto"
                            >
                                <Lock className="w-3 h-3" />
                                Admin Bypass: Dismiss Overlay
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // MODAL OVERLAY (High)
    if (modalAnnouncement && profile?.is_admin) {
        return (
            <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                    <button
                        onClick={dismissModal}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                            <AlertTriangle className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Announcement</h2>
                            <p className="text-sm text-slate-400">Important update</p>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        <h3 className="text-2xl font-bold text-white">
                            {modalAnnouncement.title}
                        </h3>
                        <p className="text-slate-300 leading-relaxed">
                            {modalAnnouncement.content}
                        </p>
                    </div>

                    <button
                        onClick={dismissModal}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/25"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        );
    }

    if (safeMode) return null;
    if (!profile?.is_admin) return null;
    return null;
}
