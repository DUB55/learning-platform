'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus, MoreVertical, FileText, Files, Globe, Lock, Edit2, Trash2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ResourceContextMenu from '@/components/ResourceContextMenu';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

export default function ParagraphsPage() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const params = useParams();
    const subjectId = params.id as string;
    const unitId = params.unitId as string;
    const { toasts, hideToast, success, error, info } = useToast();

    const [unit, setUnit] = useState<any>(null);
    const [paragraphs, setParagraphs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newParagraphTitle, setNewParagraphTitle] = useState('');
    const [resourceMenu, setResourceMenu] = useState<{ x: number; y: number; paragraphId: string } | null>(null);
    const [editingParagraph, setEditingParagraph] = useState<{ id: string; title: string } | null>(null);

    useEffect(() => {
        if (user && unitId) {
            fetchUnitAndParagraphs();

            // Subscribe to real-time updates
            const channel = supabase
                .channel('paragraphs-changes')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'paragraphs', filter: `unit_id=eq.${unitId}` },
                    () => {
                        fetchUnitAndParagraphs();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
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

        if (!user) {
            error('You must be logged in to create a paragraph');
            return;
        }

        if (!newParagraphTitle.trim()) {
            error('Please enter a paragraph title');
            return;
        }

        const { data, error: insertError } = await supabase
            .from('paragraphs')
            .insert([
                {
                    unit_id: unitId,
                    title: newParagraphTitle.trim(),
                    order_index: paragraphs.length
                }
            ])
            .select();

        if (insertError) {
            console.error('Error creating paragraph:', insertError);
            error(`Failed to create paragraph: ${insertError.message}`);
        } else {
            success('Paragraph created successfully!');
            setNewParagraphTitle('');
            setShowAddModal(false);
            fetchUnitAndParagraphs();
        }
    };

    const handleToggleGlobal = async (paragraphId: string) => {
        const paragraph = paragraphs.find(p => p.id === paragraphId);
        if (!paragraph) return;

        const { error: updateError } = await supabase
            .from('paragraphs')
            .update({ is_global: !paragraph.is_global })
            .eq('id', paragraphId);

        if (!updateError) {
            fetchUnitAndParagraphs();
        }
    };

    const handleRenameParagraph = (paragraphId: string) => {
        const paragraph = paragraphs.find(p => p.id === paragraphId);
        if (paragraph) {
            setEditingParagraph({ id: paragraph.id, title: paragraph.title });
        }
    };

    const handleSaveRename = async () => {
        if (!editingParagraph) return;

        const { error: updateError } = await supabase
            .from('paragraphs')
            .update({ title: editingParagraph.title })
            .eq('id', editingParagraph.id);

        if (!updateError) {
            setEditingParagraph(null);
            fetchUnitAndParagraphs();
        }
    };

    const handleResourceContextMenu = (e: React.MouseEvent, paragraphId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setResourceMenu({
            x: e.clientX,
            y: e.clientY,
            paragraphId
        });
    };

    const getResourceMenuItems = (paragraphId: string) => {
        const paragraph = paragraphs.find(p => p.id === paragraphId);
        if (!paragraph) return [];

        const items: any[] = [
            {
                icon: <Edit2 className="w-4 h-4" />,
                label: 'Rename',
                onClick: () => handleRenameParagraph(paragraphId)
            }
        ];

        // Only admins can toggle global status
        if (profile?.is_admin) {
            items.unshift({
                icon: paragraph.is_global ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />,
                label: paragraph.is_global ? 'Make Private' : 'Make Global',
                onClick: () => handleToggleGlobal(paragraphId)
            });
        }

        items.push({
            icon: <Trash2 className="w-4 h-4" />,
            label: 'Delete',
            onClick: () => handleDeleteParagraph(paragraphId)
        });

        return items;
    };

    const handleDeleteParagraph = async (paragraphId: string) => {
        if (!confirm('Delete this paragraph and all its documents?')) return;

        const { error: deleteError } = await supabase
            .from('paragraphs')
            .delete()
            .eq('id', paragraphId);

        if (!deleteError) {
            setParagraphs(paragraphs.filter(p => p.id !== paragraphId));
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
                                onContextMenu={(e) => handleResourceContextMenu(e, paragraph.id)}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex-1">
                                        {editingParagraph && editingParagraph.id === paragraph.id ? (
                                            <input
                                                type="text"
                                                value={editingParagraph.title}
                                                onChange={(e) => setEditingParagraph({ ...editingParagraph, title: e.target.value })}
                                                onBlur={handleSaveRename}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSaveRename();
                                                    if (e.key === 'Escape') setEditingParagraph(null);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                autoFocus
                                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-1 text-white text-lg font-bold focus:outline-none focus:border-blue-500"
                                            />
                                        ) : (
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-bold text-white">{paragraph.title}</h3>
                                                    {paragraph.is_global && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                                                            <Globe className="w-2.5 h-2.5" />
                                                            Global
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-slate-400 text-sm">{paragraph.document_count || 0} documents</p>
                                            </div>
                                        )}
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

                    {/* Resource Context Menu */}
                    {resourceMenu && (
                        <ResourceContextMenu
                            items={getResourceMenuItems(resourceMenu.paragraphId)}
                            position={{ x: resourceMenu.x, y: resourceMenu.y }}
                            onClose={() => setResourceMenu(null)}
                            resourceType="paragraph"
                            isGlobal={paragraphs.find(p => p.id === resourceMenu.paragraphId)?.is_global || false}
                            isAdmin={profile?.is_admin || false}
                        />
                    )}
                </div>
            </main>

            {/* Toast Notifications */}
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => hideToast(toast.id)}
                />
            ))}
        </div>
    );
}
