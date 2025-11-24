'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus, MoreVertical, FileText, Files } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function ParagraphsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const subjectId = params.id as string;
    const unitId = params.unitId as string;

    const [unit, setUnit] = useState<any>(null);
    const [paragraphs, setParagraphs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newParagraphTitle, setNewParagraphTitle] = useState('');

    useEffect(() => {
        if (user && unitId) {
            fetchUnitAndParagraphs();
        }
    }, [user, unitId]);

    const fetchUnitAndParagraphs = async () => {
        setLoading(true);

        // Fetch unit details
        const { data: unitData } = await supabase
            .from('units')
            .select('*')
            .eq('id', unitId)
            .single();

        if (unitData) {
            setUnit(unitData);
        }

        // Fetch paragraphs with document counts
        const { data: paragraphsData } = await supabase
            .from('paragraphs')
            .select('*')
            .eq('unit_id', unitId)
            .order('order_index', { ascending: true });

        if (paragraphsData) {
            // Get document counts for each paragraph
            const paragraphsWithCounts = await Promise.all(
                paragraphsData.map(async (paragraph) => {
                    const { count } = await supabase
                        .from('documents')
                        .select('*', { count: 'exact', head: true })
                        .eq('paragraph_id', paragraph.id);

                    return {
                        ...paragraph,
                        document_count: count || 0
                    };
                })
            );
            setParagraphs(paragraphsWithCounts);
        }

        setLoading(false);
    };

    const handleAddParagraph = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newParagraphTitle.trim()) return;

        const { error } = await supabase
            .from('paragraphs')
            .insert([
                {
                    unit_id: unitId,
                    title: newParagraphTitle,
                    order_index: paragraphs.length
                }
            ]);

        if (!error) {
            setNewParagraphTitle('');
            setShowAddModal(false);
            fetchUnitAndParagraphs();
        }
    };

    const handleDeleteParagraph = async (paragraphId: string) => {
        if (confirm('Delete this paragraph and all its documents?')) {
            const { error } = await supabase
                .from('paragraphs')
                .delete()
                .eq('id', paragraphId);

            if (!error) {
                setParagraphs(paragraphs.filter(p => p.id !== paragraphId));
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
                            onClick={() => router.push(`/subjects/${subjectId}/units`)}
                            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Units</span>
                        </button>
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-serif font-bold text-white mb-2">
                                    {unit?.title}
                                </h1>
                                <p className="text-slate-400">Paragraphs in this unit</p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="glass-button px-4 py-2 rounded-xl flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Add Paragraph</span>
                            </button>
                        </div>
                    </div>

                    {/* Paragraphs Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paragraphs.map((paragraph) => (
                            <div
                                key={paragraph.id}
                                className="glass-card p-6 border-l-4 border-green-500/50 hover:bg-white/5 transition-all duration-300 group cursor-pointer"
                                onClick={() => router.push(`/subjects/${subjectId}/units/${unitId}/paragraphs/${paragraph.id}/documents`)}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-1">{paragraph.title}</h3>
                                        <p className="text-slate-400 text-sm">{paragraph.document_count || 0} documents</p>
                                    </div>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => handleDeleteParagraph(paragraph.id)}
                                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-xs text-slate-400 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        <span>Paragraph {paragraph.order_index + 1}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Files className="w-3 h-3" />
                                        <span>{paragraph.document_count || 0} docs</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Paragraph Modal */}
                    {showAddModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                            <div className="glass-card p-8 w-full max-w-md relative">
                                <h2 className="text-2xl font-bold text-white mb-6">Add New Paragraph</h2>
                                <form onSubmit={handleAddParagraph}>
                                    <div className="mb-6">
                                        <label className="block text-slate-400 text-sm mb-2">Paragraph Title</label>
                                        <input
                                            type="text"
                                            value={newParagraphTitle}
                                            onChange={(e) => setNewParagraphTitle(e.target.value)}
                                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="e.g. Derivatives and Limits"
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
                                            Create Paragraph
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
