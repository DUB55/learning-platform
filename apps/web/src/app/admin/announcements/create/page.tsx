'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Save, Loader2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export default function CreateAnnouncementPage() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [slug, setSlug] = useState('');
    const [isPublished, setIsPublished] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Auto-generate slug from title
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setTitle(val);
        setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    };

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) {
            return showToast('Title and content are required', 'error');
        }

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('announcements')
                .insert({
                    title,
                    content,
                    slug,
                    author_id: user?.id,
                    is_published: isPublished
                });

            if (error) throw error;

            showToast('Announcement created successfully!', 'success');
            router.push('/admin/announcements');
        } catch (error: any) {
            console.error('Error creating announcement:', error);
            showToast('Failed to create announcement: ' + error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] p-8">
            <div className="max-w-4xl mx-auto animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <FileText className="w-6 h-6 text-blue-400" />
                            Create Announcement
                        </h1>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Publish
                    </button>
                </div>

                {/* Editor */}
                <div className="glass-card p-8 space-y-6 intro-y">
                    <div>
                        <label className="block text-slate-400 text-sm mb-2">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={handleTitleChange}
                            placeholder="e.g. New Features Released!"
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-400 text-sm mb-2">Slug (URL)</label>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-slate-300 font-mono text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-400 text-sm mb-2">Content (Markdown supported)</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={15}
                            placeholder="# Heading\n\nYour announcement content here..."
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-blue-500 resize-none"
                        />
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                        <input
                            type="checkbox"
                            checked={isPublished}
                            onChange={(e) => setIsPublished(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                        />
                        <div>
                            <span className="text-white font-medium block">Publish Immediately</span>
                            <span className="text-slate-400 text-sm block">If unchecked, it will be saved as a draft.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
