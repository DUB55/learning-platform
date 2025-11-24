'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus, MoreVertical, FileText, Calendar, Eye, BookOpen } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function DocumentsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const subjectId = params.id as string;
    const unitId = params.unitId as string;
    const paragraphId = params.paragraphId as string;

    const [paragraph, setParagraph] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAddLearningSetModal, setShowAddLearningSetModal] = useState(false);
    const [newDocumentTitle, setNewDocumentTitle] = useState('');

    useEffect(() => {
        if (user && paragraphId) {
            fetchParagraphAndDocuments();
        }
    }, [user, paragraphId]);

    const fetchParagraphAndDocuments = async () => {
        setLoading(true);

        // Fetch paragraph details
        const { data: paragraphData } = await supabase
            .from('paragraphs')
            .select('*')
            .eq('id', paragraphId)
            .single();

        if (paragraphData) {
            setParagraph(paragraphData);
        }

        // Fetch documents
        const { data: documentsData } = await supabase
            .from('documents')
            .select('*')
            .eq('paragraph_id', paragraphId)
            .order('created_at', { ascending: false });

        if (documentsData) {
            setDocuments(documentsData);
        }

        setLoading(false);
    };

    const handleAddDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newDocumentTitle.trim()) return;

        const { error } = await supabase
            .from('documents')
            .insert([
                {
                    paragraph_id: paragraphId,
                    title: newDocumentTitle,
                    content: '',
                    type: 'text' // Default type
                }
            ]);

        if (!error) {
            setNewDocumentTitle('');
            setShowAddModal(false);
            fetchParagraphAndDocuments();
        }
    };

    const handleDeleteDocument = async (documentId: string) => {
        if (confirm('Delete this document?')) {
            const { error } = await supabase
                .from('documents')
                .delete()
                .eq('id', documentId);

            if (!error) {
                setDocuments(documents.filter(d => d.id !== documentId));
            }
        }
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
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => router.push(`/subjects/${subjectId}/units/${unitId}/paragraphs`)}
                            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Paragraphs</span>
                        </button>
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-serif font-bold text-white mb-2">
                                    {paragraph?.title}
                                </h1>
                                <p className="text-slate-400">Documents and learning sets</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="glass-button px-4 py-2 rounded-xl flex items-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Add Document</span>
                                </button>
                                <button
                                    onClick={() => setShowAddLearningSetModal(true)}
                                    className="glass-button px-4 py-2 rounded-xl flex items-center gap-2"
                                >
                                    <BookOpen className="w-5 h-5" />
                                    <span>Add Learning Set</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Documents Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {documents.map((document) => (
                            <div
                                key={document.id}
                                className="glass-card p-6 border-l-4 border-orange-500/50 hover:bg-white/5 transition-all duration-300 group cursor-pointer"
                                onClick={() => {
                                    // TODO: Navigate to document editor/viewer
                                    console.log('View document:', document.id);
                                }}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-1">{document.title}</h3>
                                        <p className="text-slate-400 text-sm capitalize">{document.type} document</p>
                                    </div>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => handleDeleteDocument(document.id)}
                                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-xs text-slate-400 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        <span>{document.type}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        <span>{new Date(document.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Document Modal */}
                    {showAddModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                            <div className="glass-card p-8 w-full max-w-md relative">
                                <h2 className="text-2xl font-bold text-white mb-6">Add New Document</h2>
                                <form onSubmit={handleAddDocument}>
                                    <div className="mb-6">
                                        <label className="block text-slate-400 text-sm mb-2">Document Title</label>
                                        <input
                                            type="text"
                                            value={newDocumentTitle}
                                            onChange={(e) => setNewDocumentTitle(e.target.value)}
                                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="e.g. Lecture Notes"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddModal(false)}
                                            className="flex-1 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 glass-button rounded-lg"
                                        >
                                            Create Document
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Add Learning Set Modal (Placeholder) */}
                    {showAddLearningSetModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                            <div className="glass-card p-8 w-full max-w-md relative">
                                <h2 className="text-2xl font-bold text-white mb-6">Add Learning Set</h2>
                                <p className="text-slate-400 mb-6">
                                    Learning sets feature is coming soon! This will allow you to create flashcards and study materials.
                                </p>
                                <button
                                    onClick={() => setShowAddLearningSetModal(false)}
                                    className="w-full glass-button rounded-lg py-3"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
