'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DocumentElement {
    id: string;
    type: 'text' | 'youtube' | 'image' | 'table' | 'html';
    content: string;
    styling?: {
        color?: string;
        fontSize?: string;
        fontFamily?: string;
        alignment?: 'left' | 'center' | 'right';
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
    };
    order: number;
}

interface Document {
    id: string;
    title: string;
    document_type: string;
    elements: DocumentElement[];
    user_id: string;
}

export default function ViewDocumentPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const documentId = params.documentId as string;

    const [document, setDocument] = useState<Document | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && documentId) {
            fetchDocument();
        }
    }, [user, documentId]);

    const fetchDocument = async () => {
        setLoading(true);

        const { data } = await supabase
            .from('documents')
            .select('*')
            .eq('id', documentId)
            .single();

        if (data) setDocument(data);
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!confirm('Delete this document?')) return;

        await supabase
            .from('documents')
            .delete()
            .eq('id', documentId);

        router.back();
    };

    const getYouTubeEmbedUrl = (url: string) => {
        const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/)?.[1];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!document) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Document Not Found</h2>
                    <button onClick={() => router.back()} className="glass-button px-6 py-3 rounded-xl">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto relative p-8">
                <div className={`mx-auto ${document?.elements?.some(e => e.type === 'html') ? 'relative z-10 pointer-events-none' : 'max-w-4xl'}`}>
                    <div className={document?.elements?.some(e => e.type === 'html') ? 'pointer-events-auto inline-block' : ''}>
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back</span>
                        </button>

                        <div className="flex items-center justify-between mb-10">
                            <h1 className="text-3xl font-serif font-bold text-white">{document.title}</h1>

                            {user?.id === document.user_id && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => router.push(`${documentId}/edit`)}
                                        className="p-3 glass-button rounded-xl"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Document Content */}
                        <div className="space-y-6">
                            {document.elements && document.elements.length > 0 ? (
                                document.elements
                                    .sort((a, b) => a.order - b.order)
                                    .map((element) => (
                                        <div key={element.id}>
                                            {element.type === 'text' && (
                                                <div
                                                    className="glass-card p-6"
                                                    style={{
                                                        color: element.styling?.color,
                                                        fontSize: element.styling?.fontSize,
                                                        fontFamily: element.styling?.fontFamily,
                                                        textAlign: element.styling?.alignment,
                                                        fontWeight: element.styling?.bold ? 'bold' : 'normal',
                                                        fontStyle: element.styling?.italic ? 'italic' : 'normal',
                                                        textDecoration: element.styling?.underline ? 'underline' : 'none'
                                                    }}
                                                >
                                                    {element.content}
                                                </div>
                                            )}

                                            {element.type === 'youtube' && element.content && (
                                                <div className="glass-card p-4">
                                                    <iframe
                                                        src={getYouTubeEmbedUrl(element.content)}
                                                        className="w-full aspect-video rounded-lg"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                    />
                                                </div>
                                            )}

                                            {element.type === 'image' && element.content && (
                                                <div className="glass-card p-4">
                                                    <img
                                                        src={element.content}
                                                        alt="Document image"
                                                        className="max-w-full h-auto rounded-lg"
                                                    />
                                                </div>
                                            )}

                                            {element.type === 'html' && element.content && (
                                                <div className="w-full min-h-[800px] bg-white rounded-lg overflow-hidden shadow-lg">
                                                    <iframe
                                                        srcDoc={element.content}
                                                        sandbox="allow-scripts allow-same-origin allow-forms"
                                                        className="w-full h-[800px] border-0"
                                                    />
                                                </div>
                                            )}

                                            {element.type === 'table' && (
                                                <div className="glass-card p-6 overflow-x-auto">
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {Array(9).fill(null).map((_, i) => (
                                                            <div key={i} className="bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-white text-sm">
                                                                Cell {i + 1}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                            ) : (
                                <div className="glass-card p-12 text-center">
                                    <p className="text-slate-400">This document is empty</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
