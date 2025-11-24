'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus, MoreVertical, FileText, Calendar, Eye, BookOpen, Globe, Lock, Edit2, Trash2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ResourceContextMenu from '@/components/ResourceContextMenu';

export default function DocumentsPage() {
    const { user, profile } = useAuth();
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
    const [resourceMenu, setResourceMenu] = useState<{ x: number; y: number; documentId: string } | null>(null);
    const [editingDocument, setEditingDocument] = useState<{ id: string; title: string } | null>(null);

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

    const handleToggleGlobal = async (documentId: string) => {
        const document = documents.find(d => d.id === documentId);
        if (!document) return;

        const { error } = await supabase
            .from('documents')
            .update({ is_global: !document.is_global })
            .eq('id', documentId);

        if (!error) {
            fetchParagraphAndDocuments();
        }
    };

    const handleRenameDocument = (documentId: string) => {
        const document = documents.find(d => d.id === documentId);
        if (document) {
            setEditingDocument({ id: document.id, title: document.title });
        }
    };

    const handleSaveRename = async () => {
        if (!editingDocument) return;

        const { error } = await supabase
            .from('documents')
            .update({ title: editingDocument.title })
            .eq('id', editingDocument.id);

        if (!error) {
            setEditingDocument(null);
            fetchParagraphAndDocuments();
        }
    };

    const handleResourceContextMenu = (e: React.MouseEvent, documentId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setResourceMenu({
            x: e.clientX,
            y: e.clientY,
            documentId
        });
    };

    const getResourceMenuItems = (documentId: string) => {
        const document = documents.find(d => d.id === documentId);
        if (!document) return [];

        const items = [
            {
                icon: <Edit2 className="w-4 h-4" />,
                label: 'Rename',
                onClick: () => handleRenameDocument(documentId)
            }
        ];

        // Only admins can toggle global status
        if (profile?.is_admin) {
            items.unshift({
                icon: document.is_global ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />,
                label: document.is_global ? 'Make Private' : 'Make Global',
                onClick: () => handleToggleGlobal(documentId)
            });
        }

        items.push({
            icon: <Trash2 className="w-4 h-4" />,
            label: 'Delete',
            onClick: () => handleDeleteDocument(documentId),
            danger: true,
            divider: true
        });

        return items;
    };

    const handleDeleteDocument = async (documentId: string) => {
        if (!confirm('Delete this document?')) return;

        const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', documentId);

        if (!error) {
            setDocuments(documents.filter(d => d.id !== documentId));
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
                                onContextMenu={(e) => handleResourceContextMenu(e, document.id)}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex-1">
                                        {editingDocument && editingDocument.id === document.id ? (
                                            <input
                                                type="text"
                                                value={editingDocument.title}
                                                onChange={(e) => setEditingDocument({ ...editingDocument, title: e.target.value })}
                                                onBlur={handleSaveRename}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSaveRename();
                                                    if (e.key === 'Escape') setEditingDocument(null);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                autoFocus
                                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-1 text-white text-lg font-bold focus:outline-none focus:border-blue-500"
                                            />
                                        ) : (
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-bold text-white">{document.title}</h3>
                                                    {document.is_global && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                                                            <Globe className="w-2.5 h-2.5" />
                                                            Global
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-slate-400 text-sm capitalize">{document.type} document</p>
                                            </div>
                                        )}
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

                    {/* Resource Context Menu */}
                    {resourceMenu && (
                        <ResourceContextMenu
                            items={getResourceMenuItems(resourceMenu.documentId)}
                            position={{ x: resourceMenu.x, y: resourceMenu.y }}
                            onClose={() => setResourceMenu(null)}
                            resourceType="document"
                            isGlobal={documents.find(d => d.id === resourceMenu.documentId)?.is_global || false}
                            isAdmin={profile?.is_admin || false}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}
