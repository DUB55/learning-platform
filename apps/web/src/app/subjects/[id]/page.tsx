'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { Plus, ChevronRight, FileText, Trash2 } from 'lucide-react';

type Unit = { id: string; title: string; order_index: number };
type Paragraph = { id: string; title: string; order_index: number };
type Document = { id: string; title: string; document_type: string };

export default function SubjectDetailPage() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const params = useParams();
    const subjectId = params.id as string;

    const [subject, setSubject] = useState<any>(null);
    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
    const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
    const [selectedParagraph, setSelectedParagraph] = useState<string | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);

    const [showAddUnitModal, setShowAddUnitModal] = useState(false);
    const [showAddParagraphModal, setShowAddParagraphModal] = useState(false);
    const [newUnitTitle, setNewUnitTitle] = useState('');
    const [newParagraphTitle, setNewParagraphTitle] = useState('');

    const isOwner = subject?.user_id === user?.id;

    useEffect(() => {
        fetchSubject();
        fetchUnits();
    }, [subjectId]);

    useEffect(() => {
        if (selectedUnit) {
            fetchParagraphs(selectedUnit);
        }
    }, [selectedUnit]);

    useEffect(() => {
        if (selectedParagraph) {
            fetchDocuments(selectedParagraph);
        }
    }, [selectedParagraph]);

    const fetchSubject = async () => {
        const { data } = await supabase
            .from('subjects')
            .select('*')
            .eq('id', subjectId)
            .single();
        setSubject(data);
        setLoading(false);
    };

    const fetchUnits = async () => {
        const { data } = await supabase
            .from('units')
            .select('*')
            .eq('subject_id', subjectId)
            .order('order_index');
        setUnits(data || []);
    };

    const fetchParagraphs = async (unitId: string) => {
        const { data } = await supabase
            .from('paragraphs')
            .select('*')
            .eq('unit_id', unitId)
            .order('order_index');
        setParagraphs(data || []);
    };

    const fetchDocuments = async (paragraphId: string) => {
        const { data } = await supabase
            .from('documents')
            .select('*')
            .eq('paragraph_id', paragraphId)
            .order('order_index');
        setDocuments(data || []);
    };

    const handleAddUnit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUnitTitle.trim()) return;

        const { error } = await supabase.from('units').insert({
            subject_id: subjectId,
            title: newUnitTitle,
            order_index: units.length
        });

        if (!error) {
            setNewUnitTitle('');
            setShowAddUnitModal(false);
            fetchUnits();
        }
    };

    const handleAddParagraph = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newParagraphTitle.trim() || !selectedUnit) return;

        const { error } = await supabase.from('paragraphs').insert({
            unit_id: selectedUnit,
            title: newParagraphTitle,
            order_index: paragraphs.length
        });

        if (!error) {
            setNewParagraphTitle('');
            setShowAddParagraphModal(false);
            fetchParagraphs(selectedUnit);
        }
    };

    const handleDeleteUnit = async (unitId: string) => {
        if (!confirm('Delete this unit and all its content?')) return;
        const { error } = await supabase.from('units').delete().eq('id', unitId);
        if (!error) fetchUnits();
    };

    const handleDeleteParagraph = async (paragraphId: string) => {
        if (!confirm('Delete this paragraph and all its documents?')) return;
        const { error } = await supabase.from('paragraphs').delete().eq('id', paragraphId);
        if (!error && selectedUnit) fetchParagraphs(selectedUnit);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex">
            <Sidebar />
            <main className="flex-1 p-8">
                <header className="mb-8">
                    <button onClick={() => router.back()} className="text-slate-400 hover:text-white mb-4">
                        ← Back to Subjects
                    </button>
                    <h1 className="text-3xl font-serif font-bold text-white">{subject?.title}</h1>
                    <p className="text-slate-400 mt-2">Organize your study content with units, paragraphs, and documents</p>
                </header>

                <div className="grid grid-cols-3 gap-6">
                    {/* Units Column */}
                    <div className="glass-card p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-white">Units</h2>
                            {isOwner && (
                                <button
                                    onClick={() => setShowAddUnitModal(true)}
                                    className="p-1 text-blue-400 hover:text-blue-300"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {units.map((unit) => (
                                <div
                                    key={unit.id}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors flex justify-between items-center ${selectedUnit === unit.id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                                        }`}
                                >
                                    <div onClick={() => setSelectedUnit(unit.id)} className="flex-1">
                                        <p className="text-sm font-medium">{unit.title}</p>
                                    </div>
                                    {isOwner && (
                                        <button
                                            onClick={() => handleDeleteUnit(unit.id)}
                                            className="p-1 text-red-400 hover:text-red-300"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Paragraphs Column */}
                    <div className="glass-card p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-white">Paragraphs</h2>
                            {isOwner && selectedUnit && (
                                <button
                                    onClick={() => setShowAddParagraphModal(true)}
                                    className="p-1 text-blue-400 hover:text-blue-300"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {paragraphs.map((paragraph) => (
                                <div
                                    key={paragraph.id}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors flex justify-between items-center ${selectedParagraph === paragraph.id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                                        }`}
                                >
                                    <div onClick={() => setSelectedParagraph(paragraph.id)} className="flex-1">
                                        <p className="text-sm font-medium">{paragraph.title}</p>
                                    </div>
                                    {isOwner && (
                                        <button
                                            onClick={() => handleDeleteParagraph(paragraph.id)}
                                            className="p-1 text-red-400 hover:text-red-300"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Documents Column */}
                    <div className="glass-card p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-white">Documents</h2>
                        </div>
                        <div className="space-y-2">
                            {documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-blue-400" />
                                        <p className="text-sm text-slate-300">{doc.title}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Add Unit Modal */}
                {showAddUnitModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="glass-card p-6 w-96">
                            <h3 className="text-xl font-bold text-white mb-4">Add Unit</h3>
                            <form onSubmit={handleAddUnit}>
                                <input
                                    type="text"
                                    value={newUnitTitle}
                                    onChange={(e) => setNewUnitTitle(e.target.value)}
                                    placeholder="Unit title"
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white mb-4"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl">
                                        Add
                                    </button>
                                    <button type="button" onClick={() => setShowAddUnitModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Add Paragraph Modal */}
                {showAddParagraphModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="glass-card p-6 w-96">
                            <h3 className="text-xl font-bold text-white mb-4">Add Paragraph</h3>
                            <form onSubmit={handleAddParagraph}>
                                <input
                                    type="text"
                                    value={newParagraphTitle}
                                    onChange={(e) => setNewParagraphTitle(e.target.value)}
                                    placeholder="Paragraph title"
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white mb-4"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl">
                                        Add
                                    </button>
                                    <button type="button" onClick={() => setShowAddParagraphModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
