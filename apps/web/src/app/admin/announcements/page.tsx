'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Plus, Edit2, Trash2, Eye, Clock, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Announcement {
    id: string;
    title: string;
    content: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    linked_page_id: string | null;
    expires_at: string | null;
    created_at: string;
}

interface AnnouncementPage {
    id: string;
    title: string;
    slug: string;
}

export default function AdminAnnouncementsPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [pages, setPages] = useState<AnnouncementPage[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [createLinkedPage, setCreateLinkedPage] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
        expires_at: '',
        pageTitle: '',
        pageSlug: '',
        pageContent: ''
    });

    useEffect(() => {
        if (!loading) {
            if (!user || !profile?.is_admin) {
                router.push('/dashboard');
                return;
            }
            fetchData();
        }
    }, [user, profile, loading, router]);

    const fetchData = async () => {
        setIsLoadingData(true);

        // Fetch announcements
        const { data: announcementsData } = await supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });

        if (announcementsData) {
            setAnnouncements(announcementsData);
        }

        // Fetch pages
        const { data: pagesData } = await supabase
            .from('announcement_pages')
            .select('id, title, slug')
            .order('created_at', { ascending: false });

        if (pagesData) {
            setPages(pagesData);
        }

        setIsLoadingData(false);
    };

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !formData.title.trim() || !formData.content.trim()) return;

        let linkedPageId = null;

        // Create linked page if requested
        if (createLinkedPage && formData.pageTitle.trim() && formData.pageContent.trim()) {
            const slug = formData.pageSlug || generateSlug(formData.pageTitle);

            const { data: pageData, error: pageError } = await supabase
                .from('announcement_pages')
                .insert([{
                    created_by: user.id,
                    title: formData.pageTitle,
                    slug: slug,
                    content: formData.pageContent,
                    is_published: true
                }] as any)
                .select()
                .single() as any;

            if (!pageError && pageData) {
                linkedPageId = pageData.id;
            }
        }

        const announcementData = {
            created_by: user.id,
            title: formData.title,
            content: formData.content,
            priority: formData.priority,
            expires_at: formData.expires_at || null,
            linked_page_id: linkedPageId
        };

        if (editingAnnouncement) {
            // Update existing
            const { error } = await supabase
                .from('announcements')
                .update(announcementData as any)
                .eq('id', editingAnnouncement.id);

            if (!error) {
                setEditingAnnouncement(null);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            content: '',
            priority: 'normal',
            expires_at: '',
            pageTitle: '',
            pageSlug: '',
            pageContent: ''
        });
        setCreateLinkedPage(false);
    };

    const handleEdit = (announcement: Announcement) => {
        setEditingAnnouncement(announcement);
        setFormData({
            title: announcement.title,
            content: announcement.content,
            priority: announcement.priority,
            expires_at: announcement.expires_at ? announcement.expires_at.split('T')[0] : '',
            pageTitle: '',
            pageSlug: '',
            pageContent: ''
        });
        setShowAddModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this announcement?')) return;

        const { error } = await supabase
            .from('announcements')
            .delete()
            .eq('id', id);

        if (!error) {
            fetchData();
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-500/20 text-red-300 border-red-500/30';
            case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
            case 'normal': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            case 'low': return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
            default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
        }
    };

    if (loading || !profile?.is_admin) {
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
                <div className="max-w-6xl mx-auto">
                    <header className="mb-10">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h1 className="text-3xl font-serif font-bold text-white mb-2">Announcements</h1>
                                <p className="text-slate-400">Manage system-wide announcements</p>
                            </div>
                            <button
                                onClick={() => {
                                    setEditingAnnouncement(null);
                                    resetForm();
                                    setShowAddModal(true);
                                }}
                                className="glass-button px-4 py-2 rounded-xl flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span>New Announcement</span>
                            </button>
                        </div>
                    </header>

                    {isLoadingData ? (
                        <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {announcements.map((announcement) => (
                                <div key={announcement.id} className="glass-card p-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-white">{announcement.title}</h3>
                                                <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(announcement.priority)}`}>
                                                    {announcement.priority}
                                                </span>
                                            </div>
                                            <p className="text-slate-400 mb-4 whitespace-pre-wrap">{announcement.content}</p>
                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>Created {new Date(announcement.created_at).toLocaleDateString()}</span>
                                                </div>
                                                {announcement.expires_at && (
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        <span>Expires {new Date(announcement.expires_at).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                                {announcement.linked_page_id && (
                                                    <div className="flex items-center gap-1">
                                                        <FileText className="w-3 h-3" />
                                                        <span>Has linked page</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(announcement)}
                                                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(announcement.id)}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add/Edit Modal */}
                    {showAddModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                            <div className="glass-card p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                                <h2 className="text-2xl font-bold text-white mb-6">
                                    {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
                                </h2>
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-slate-400 text-sm mb-2">Title</label>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                placeholder="Announcement title"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 text-sm mb-2">Content</label>
                                            <textarea
                                                value={formData.content}
                                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white h-32 resize-none focus:outline-none focus:border-blue-500"
                                                placeholder="Announcement content"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-slate-400 text-sm mb-2">Priority</label>
                                                <select
                                                    value={formData.priority}
                                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                >
                                                    <option value="low">Low</option>
                                                    <option value="normal">Normal</option>
                                                    <option value="high">High</option>
                                                    <option value="urgent">Urgent</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-slate-400 text-sm mb-2">Expires At (Optional)</label>
                                                <input
                                                    type="date"
                                                    value={formData.expires_at}
                                                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                        </div>

                                        {/* Create Linked Page Option */}
                                        <div className="border-t border-white/10 pt-4">
                                            <label className="flex items-center gap-2 text-white cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={createLinkedPage}
                                                    onChange={(e) => setCreateLinkedPage(e.target.checked)}
                                                    className="w-4 h-4 rounded bg-slate-800/50 border-white/10"
                                                />
                                                <span>Create a detailed page for this announcement</span>
                                            </label>
                                        </div>

                                        {createLinkedPage && (
                                            <div className="space-y-4 bg-slate-900/50 p-4 rounded-lg">
                                                <div>
                                                    <label className="block text-slate-400 text-sm mb-2">Page Title</label>
                                                    <input
                                                        type="text"
                                                        value={formData.pageTitle}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            pageTitle: e.target.value,
                                                            pageSlug: generateSlug(e.target.value)
                                                        })}
                                                        className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                        placeholder="Page title"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-slate-400 text-sm mb-2">Page URL Slug</label>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-500">/announcements/</span>
                                                        <input
                                                            type="text"
                                                            value={formData.pageSlug}
                                                            onChange={(e) => setFormData({ ...formData, pageSlug: e.target.value })}
                                                            className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                            placeholder="page-url-slug"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-slate-400 text-sm mb-2">Page Content</label>
                                                    <textarea
                                                        value={formData.pageContent}
                                                        onChange={(e) => setFormData({ ...formData, pageContent: e.target.value })}
                                                        className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white h-48 resize-none focus:outline-none focus:border-blue-500"
                                                        placeholder="Detailed page content (plain text for now)"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-4 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAddModal(false);
                                                setEditingAnnouncement(null);
                                                resetForm();
                                            }}
                                            className="flex-1 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 glass-button rounded-lg"
                                        >
                                            {editingAnnouncement ? 'Update' : 'Create'} Announcement
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
