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
    const [tests, setTests] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'content' | 'tests'>('content');

    useEffect(() => {
        fetchSubject();
        fetchUnits();
        fetchTests();
    }, [subjectId]);

    const fetchTests = async () => {
        const { data } = await supabase
            .from('practice_tests')
            .select('*')
            .eq('subject_id', subjectId)
            .order('created_at', { ascending: false });
        setTests(data || []);
    };

    const handleDeleteTest = async (testId: string) => {
        if (!confirm('Delete this test?')) return;
        const { error } = await supabase.from('practice_tests').delete().eq('id', testId);
        if (!error) fetchTests();
    };

    // ... existing fetch functions ...

    return (
        <div className="min-h-screen bg-[#0f172a] flex">
            <Sidebar />
            <main className="flex-1 p-8">
                <header className="mb-8">
                    <button onClick={() => router.back()} className="text-slate-400 hover:text-white mb-4">
                        ← Back to Subjects
                    </button>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-white">{subject?.title}</h1>
                            <p className="text-slate-400 mt-2">Organize your study content with units, paragraphs, and documents</p>
                        </div>
                        <div className="flex gap-2 bg-slate-800/50 p-1 rounded-xl">
                            <button
                                onClick={() => setActiveTab('content')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'content' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                Content
                            </button>
                            <button
                                onClick={() => setActiveTab('tests')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'tests' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                Practice Tests
                            </button>
                        </div>
                    </div>
                </header>

                {activeTab === 'content' ? (
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
                ) : (
                    <div className="max-w-4xl mx-auto animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Your Practice Tests</h2>
                            <button
                                onClick={() => router.push(`/subjects/${subjectId}/test-generator`)}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Create New Test</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tests.map((test) => (
                                <div key={test.id} className="glass-card p-6 hover:bg-white/5 transition-colors group relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-white">{test.title}</h3>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteTest(test.id);
                                            }}
                                            className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">{test.description}</p>
                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-xs text-slate-500">
                                            {new Date(test.created_at).toLocaleDateString()}
                                        </span>
                                        <button
                                            onClick={() => router.push(`/subjects/${subjectId}/tests/${test.id}`)}
                                            className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1"
                                        >
                                            Start Test <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {tests.length === 0 && (
                                <div className="col-span-2 text-center py-12 glass-card border-dashed border-2 border-white/10">
                                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText className="w-8 h-8 text-slate-500" />
                                    </div>
                                    <h3 className="text-lg font-medium text-white mb-2">No tests yet</h3>
                                    <p className="text-slate-400 mb-6">Create your first AI-powered practice test to start studying.</p>
                                    <button
                                        onClick={() => router.push(`/subjects/${subjectId}/test-generator`)}
                                        className="text-blue-400 hover:text-blue-300 font-medium"
                                    >
                                        Create Test Now
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

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
