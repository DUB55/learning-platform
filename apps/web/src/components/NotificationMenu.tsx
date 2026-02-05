'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, ExternalLink, AlertCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import ErrorLogger from '@/lib/ErrorLogger';

interface Announcement {
    id: string;
    title: string;
    content: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    linked_page_id: string | null;
    created_at: string | null;
    is_read: boolean;
}

interface NotificationMenuProps {
    userId: string;
}

export default function NotificationMenu({ userId }: NotificationMenuProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const fetchUnreadCount = useCallback(async (signal?: AbortSignal) => {
        try {
            const { count } = await (supabase
                .from('announcement_reads') as any)
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .abortSignal(signal as any);
            
            // This logic is simplified - we want unread count which is total announcements - read count
            // Fetch total active announcements first
            const { count: totalCount } = await (supabase
                .from('announcements') as any)
                .select('*', { count: 'exact', head: true })
                .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
                .abortSignal(signal as any);
            
            const dbReadCount = count || 0;
            const dbUnreadCount = Math.max(0, (totalCount || 0) - dbReadCount);
            setUnreadCount(dbUnreadCount);
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            // Silent error for unread count
        }
    }, [userId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const fetchAnnouncements = useCallback(async (signal?: AbortSignal) => {
        setLoading(true);

        try {
            // Fetch announcements
            const { data: announcementsData } = await (supabase
                .from('announcements') as any)
                .select('*')
                .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
                .order('created_at', { ascending: false })
                .limit(10)
                .abortSignal(signal as any);

            if (announcementsData) {
                // Fetch read status for each announcement
                const { data: readsData } = await (supabase
                    .from('announcement_reads') as any)
                    .select('announcement_id')
                    .eq('user_id', userId)
                    .abortSignal(signal as any);

                const serverReadIds = new Set((readsData as any[])?.map(r => r.announcement_id) || []);

                // Get local read IDs
                let localReadIds = new Set<string>();
                try {
                    const stored = localStorage.getItem(`read_announcements_${userId}`);
                    if (stored) {
                        localReadIds = new Set(JSON.parse(stored));
                    }
                } catch (e) {
                    ErrorLogger.error('Error reading from localStorage', e);
                }

                setAnnouncements(
                    (announcementsData as any[])
                        .filter(a => a.priority !== null)  // Filter out null priorities
                        .map(a => ({
                            ...a,
                            priority: a.priority as 'low' | 'normal' | 'high' | 'urgent',  // Type cast to literal union
                            is_read: serverReadIds.has(a.id) || localReadIds.has(a.id)
                        }))
                );
            }
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            ErrorLogger.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const markAllAsRead = useCallback(async () => {
        const unreadAnnouncements = announcements.filter(a => !a.is_read);
        if (unreadAnnouncements.length === 0) return;

        // Optimistically update UI
        setAnnouncements(prev => prev.map(a => ({ ...a, is_read: true })));
        setUnreadCount(0);

        // Save to localStorage
        try {
            const allReadIds = announcements.map(a => a.id);
            const stored = localStorage.getItem(`read_announcements_${userId}`);
            const currentIds = stored ? JSON.parse(stored) : [];
            const newIds = [...new Set([...currentIds, ...allReadIds])];
            localStorage.setItem(`read_announcements_${userId}`, JSON.stringify(newIds));
        } catch (e) {
            ErrorLogger.error('Error saving to localStorage', e);
        }

        // Mark all as read in parallel for max speed
        try {
            await Promise.all(unreadAnnouncements.map(a =>
                (supabase.rpc as any)('mark_announcement_read', {
                    announcement_uuid: a.id,
                    user_uuid: userId
                })
            ));
        } catch (error) {
            ErrorLogger.error('Error marking announcements as read:', error);
            // Revert on error would be complex, assuming success for speed
        }
    }, [announcements, userId]);

    useEffect(() => {
        if (userId) {
            const controller = new AbortController();
            fetchAnnouncements(controller.signal);
            fetchUnreadCount(controller.signal);

            const channel = supabase
                .channel('announcements')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'announcements' },
                    () => {
                        fetchAnnouncements(controller.signal);
                        fetchUnreadCount(controller.signal);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
                controller.abort();
            };
        }
    }, [userId, fetchAnnouncements, fetchUnreadCount]);

    useEffect(() => {
        if (isOpen && announcements.length > 0 && unreadCount > 0) {
            markAllAsRead();
        }
    }, [isOpen, announcements, unreadCount, markAllAsRead]);

    const handleAnnouncementClick = (announcement: Announcement) => {
        // Navigate to linked page if exists
        if (announcement.linked_page_id) {
            router.push(`/announcements/${announcement.linked_page_id}`);
            setIsOpen(false);
        }
    };

    const getPriorityIcon = (priority: string) => {
        if (priority === 'urgent') {
            return <AlertCircle className="w-4 h-4 text-red-400" />;
        } else if (priority === 'high') {
            return <AlertTriangle className="w-4 h-4 text-orange-400" />;
        }
        return null;
    };

    const shouldShowPriority = (priority: string) => {
        return priority === 'high' || priority === 'urgent';
    };

    const getPriorityStyles = (priority: string) => {
        if (priority === 'urgent') {
            return 'bg-red-500/10';
        } else if (priority === 'high') {
            return 'bg-orange-500/10';
        }
        return '';
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* Bell Icon Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
                <Bell className="w-5 h-5 text-slate-400 hover:text-white transition-colors" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-slate-800 rounded-xl border border-white/10 shadow-xl overflow-hidden z-50">
                    {/* Header */}
                    <div className="px-4 py-3 bg-slate-900/50 border-b border-white/10 flex justify-between items-center">
                        <h3 className="text-white font-medium">Notifications</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>

                    {/* Announcements List */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                            </div>
                        ) : announcements.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No announcements</p>
                            </div>
                        ) : (
                            announcements.map((announcement) => (
                                <div
                                    key={announcement.id}
                                    className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!announcement.is_read ? 'bg-blue-500/5' : ''
                                        } ${getPriorityStyles(announcement.priority)}`}
                                    onClick={() => handleAnnouncementClick(announcement)}
                                >
                                    <div className="flex items-start gap-3">
                                        {!announcement.is_read && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                        )}
                                        {shouldShowPriority(announcement.priority) && getPriorityIcon(announcement.priority)}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-white font-medium text-sm truncate">
                                                    {announcement.title}
                                                </h4>
                                            </div>
                                            <p className="text-slate-400 text-xs line-clamp-2">
                                                {announcement.content.replace(/<[^>]*>/g, '')}
                                            </p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-slate-500 text-xs">
                                                    {announcement.created_at ? new Date(announcement.created_at).toLocaleDateString() : 'N/A'}
                                                </span>
                                                {announcement.linked_page_id && (
                                                    <span className="flex items-center gap-1 text-blue-400 text-xs">
                                                        <span>View details</span>
                                                        <ExternalLink className="w-3 h-3" />
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {announcements.length > 0 && (
                        <div className="px-4 py-3 bg-slate-900/50 border-t border-white/10">
                            <button
                                onClick={() => {
                                    router.push('/announcements');
                                    setIsOpen(false);
                                }}
                                className="w-full text-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                View all announcements
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
