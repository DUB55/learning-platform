'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AnnouncementPage {
    id: string;
    title: string;
    content: string;
    slug: string;
    created_at: string | null;
}

export default function AnnouncementPageView() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const slug = params.slug as string;
    const [page, setPage] = useState<AnnouncementPage | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user && slug) {
            fetchPage();
        }
    }, [user, slug]);

    const fetchPage = async () => {
        setIsLoadingData(true);

        const { data, error } = await supabase
            .from('announcement_pages')
            .select('*')
            .eq('slug', slug)
            .eq('is_published', true)
            .single();

        if (!error && data) {
            setPage(data);
        }

        setIsLoadingData(false);
    };

    if (loading || isLoadingData) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!page) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto relative p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="glass-card p-12 text-center">
                            <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
                            <p className="text-slate-400 mb-6">This announcement page doesn't exist or has been removed.</p>
                            <button
                                onClick={() => router.push('/announcements')}
                                className="glass-button px-6 py-3 rounded-xl"
                            >
                                Back to Announcements
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto relative p-8">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => router.push('/announcements')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Announcements</span>
                    </button>

                    <article className="glass-card p-8">
                        <header className="mb-8 pb-6 border-b border-white/10">
                            <h1 className="text-4xl font-serif font-bold text-white mb-4">
                                {page.title}
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Clock className="w-4 h-4" />
                                <span>{page.created_at ? new Date(page.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) : 'N/A'}</span>
                            </div>
                        </header>

                        <div className="prose prose-invert prose-slate max-w-none">
                            <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                                {page.content}
                            </div>
                        </div>
                    </article>
                </div>
            </main>
        </div>
    );
}
