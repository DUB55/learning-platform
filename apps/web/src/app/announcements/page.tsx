'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { AlertCircle, AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Announcement {
    id: string;
    title: string;
    content: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    linked_page_id: string | null;
    linked_page?: {
        slug: string;
        title: string;
    };
    created_at: string;
    is_read: boolean;
}

export default function AnnouncementsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            fetchAnnouncements();

            // Subscribe to real-time updates
            const channel = supabase
                .channel('announcements-list-changes')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'announcements' },
                    () => {
                        fetchAnnouncements();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user]);

    const fetchAnnouncements = async () => {
        setIsLoadingData(true);

        // Fetch announcements with linked pages
        const { data: announcementsData } = await supabase
            .from('announcements')
            .select(`
                *,
                linked_page:announcement_pages!linked_page_id(slug, title)
            `)
            .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
            .order('created_at', { ascending: false });

        if (announcementsData) {
            // Fetch read status FIRST, then set announcements ONCE
            const { data: readsData } = await supabase
                .from('announcement_reads')
                .select('announcement_id')
                .eq('user_id', user!.id);

            const readIds = new Set((readsData as any)?.map((r: any) => r.announcement_id) || []);

            setAnnouncements(
                announcementsData
                    .filter(a => a.priority !== null)  // Fix priority null error
                    .map(a => ({
                        ...a,
                        priority: a.priority!,  // Non-null assertion after filter
                        is_read: readIds.has((a as any).id)
                    }))
            );
        }

        setIsLoadingData(false);
    };

        setIsLoadingData(false);


    const markAsRead = async (announcementId: string) => {
        if (!user) return;

        await (supabase.rpc('mark_announcement_read') as any)({
            announcement_uuid: announcementId,
            user_uuid: user.id
        });

        setAnnouncements(announcements.map(a =>
            a.id === announcementId ? { ...a, is_read: true } : a
        ));
    };

    const handleAnnouncementClick = async (announcement: Announcement) => {
        // Mark as read
        if (!announcement.is_read) {
            await markAsRead(announcement.id);
        }

        // Navigate to linked page if exists
        if (announcement.linked_page_id && announcement.linked_page) {
            router.push(`/announcements/${announcement.linked_page.slug}`);
        }
    };

    const getPriorityIcon = (priority: string) => {
        if (priority === 'urgent') {
            return <AlertCircle className="w-5 h-5 text-red-400" />;
        } else if (priority === 'high') {
            return <AlertTriangle className="w-5 h-5 text-orange-400" />;
        }
        return null;
    };

    const getPriorityStyles = (priority: string) => {
        if (priority === 'urgent') {
            return 'border-l-4 border-red-500 bg-red-500/5';
        } else if (priority === 'high') {
            return 'border-l-4 border-orange-500 bg-orange-500/5';
        }
        return 'border-l-4 border-blue-500/50';
    };

    if (loading) {
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
                <div className="max-w-4xl mx-auto">
                    <header className="mb-10">
                        <h1 className="text-3xl font-serif font-bold text-white mb-2">Announcements</h1>
                        <p className="text-slate-400">Stay updated with the latest news and updates</p>
                    </header>

                    {isLoadingData ? (
                        <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="glass-card p-12 text-center">
                            <p className="text-slate-400">No announcements at this time</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {announcements.map((announcement) => (
                                <div
                                    key={announcement.id}
                                    className={`glass-card p-6 transition-all duration-300 ${getPriorityStyles(announcement.priority)} ${!announcement.is_read ? 'bg-blue-500/5' : ''
                                        } ${announcement.linked_page_id ? 'cursor-pointer hover:bg-white/5' : ''}`}
                                    onClick={() => handleAnnouncementClick(announcement)}
                                >
                                    <div className="flex items-start gap-4">
                                        {!announcement.is_read && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                        )}

                                        {getPriorityIcon(announcement.priority)}

                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xl font-bold text-white mb-2">
                                                {announcement.title}
                                            </h3>
                                            <p className="text-slate-300 whitespace-pre-wrap mb-4">
                                                {announcement.content}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                                                </div>
                                                {announcement.linked_page_id && announcement.linked_page && (
                                                    <div className="flex items-center gap-1 text-blue-400 text-sm">
                                                        <span>Read more</span>
                                                        <ExternalLink className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
