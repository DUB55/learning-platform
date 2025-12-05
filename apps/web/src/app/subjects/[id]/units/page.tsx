'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus, MoreVertical, Clock, FileText, Globe, Lock, Edit2, Trash2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ResourceContextMenu from '@/components/ResourceContextMenu';

export default function UnitsPage() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const params = useParams();
    const subjectId = params.id as string;

    const [subject, setSubject] = useState<any>(null);
    const [units, setUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newUnitTitle, setNewUnitTitle] = useState('');
    const [resourceMenu, setResourceMenu] = useState<{ x: number; y: number; unitId: string } | null>(null);
    const [editingUnit, setEditingUnit] = useState<{ id: string; title: string } | null>(null);

    useEffect(() => {
        if (user && subjectId) {
            fetchSubjectAndUnits();

            // Subscribe to real-time updates
            const channel = supabase
                .channel('units-changes')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'units', filter: `subject_id=eq.${subjectId}` },
                    () => {
                        fetchSubjectAndUnits();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user, subjectId]);

    const fetchSubjectAndUnits = async () => {
        setLoading(true);

        // Fetch subject details
        const { data: subjectData } = await (supabase.from('subjects') as any)
            .select('*')
            .eq('id', subjectId)
            .single();

        if (subjectData) {
            setSubject(subjectData);
        }

        // Fetch units with paragraph counts
        const { data: unitsData } = await supabase
            .from('units')
            .select('*')
            .eq('subject_id', subjectId)
            .order('order_index', { ascending: true });

        if (unitsData) {
            // Get paragraph counts for each unit
            const unitsWithCounts = await Promise.all(
                unitsData.map(async (unit) => {
                    const { count } = await supabase
                        .from('paragraphs')
                        .select('*', { count: 'exact', head: true })
                        .eq('unit_id', unit.id);

                    return {
                        ...unit,
                        paragraph_count: count || 0
                    };
                })
            );
            setUnits(unitsWithCounts);
        }

        setLoading(false);
    };

    const handleAddUnit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newUnitTitle.trim()) return;

        const { error } = await supabase
            .from('units')
            .insert([
                {
                    subject_id: subjectId,
                    title: newUnitTitle,
                    order_index: units.length
                }
            ]);

        if (!error) {
            setNewUnitTitle('');
            setShowAddModal(false);
            fetchSubjectAndUnits();
        }
    };

    const handleToggleGlobal = async (unitId: string) => {
        const unit = units.find(u => u.id === unitId);
        if (!unit) return;

        const { error } = await supabase
            .from('units')
            .update({ is_global: !unit.is_global })
            .eq('id', unitId);

        if (!error) {
            fetchSubjectAndUnits();
        }
    };

    const handleRenameUnit = (unitId: string) => {
        const unit = units.find(u => u.id === unitId);
        if (unit) {
            setEditingUnit({ id: unit.id, title: unit.title });
        }
    };

    const handleSaveRename = async () => {
        if (!editingUnit) return;

        const { error } = await supabase
            .from('units')
            .update({ title: editingUnit.title })
            .eq('id', editingUnit.id);

        if (!error) {
            setEditingUnit(null);
            fetchSubjectAndUnits();
        }
    };

    const handleResourceContextMenu = (e: React.MouseEvent, unitId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setResourceMenu({
            x: e.clientX,
            y: e.clientY,
            unitId
        });
    };

    const getResourceMenuItems = (unitId: string) => {
        const unit = units.find(u => u.id === unitId);
        if (!unit) return [];

        const items = [
            {
                icon: <Edit2 className="w-4 h-4" />,
                label: 'Rename',
                onClick: () => handleRenameUnit(unitId)
            }
        ];

        // Only admins can toggle global status
        if (profile?.is_admin) {
            items.unshift({
                icon: unit.is_global ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />,
                label: unit.is_global ? 'Make Private' : 'Make Global',
                onClick: () => handleToggleGlobal(unitId)
            });
        }

        items.push({
            icon: <Trash2 className="w-4 h-4" />,
            label: 'Delete',
            onClick: () => handleDeleteUnit(unitId),
            danger: true,
            divider: true
        });

        return items;
    };

    const handleDeleteUnit = async (unitId: string) => {
        if (!confirm('Delete this unit and all its paragraphs?')) return;

        const { error } = await supabase
            .from('units')
            .delete()
            .eq('id', unitId);

        if (!error) {
            setUnits(units.filter(u => u.id !== unitId));
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
                            onClick={() => router.push('/subjects')}
                            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Subjects</span>
                        </button>
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-serif font-bold text-white mb-2">
                                    {subject?.title}
                                </h1>
                                <p className="text-slate-400">Units in this subject</p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="glass-button px-4 py-2 rounded-xl flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Add Unit</span>
                            </button>
                        </div>
                    </div>

                    {/* Units Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {units.map((unit) => (
                            <div
                                key={unit.id}
                                className="glass-card p-6 border-l-4 border-purple-500/50 hover:bg-white/5 transition-all duration-300 group cursor-pointer"
                                onClick={() => router.push(`/subjects/${subjectId}/units/${unit.id}/paragraphs`)}
                                onContextMenu={(e) => handleResourceContextMenu(e, unit.id)}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex-1">
                                        {editingUnit && editingUnit.id === unit.id ? (
                                            <input
                                                type="text"
                                                value={editingUnit.title}
                                                onChange={(e) => setEditingUnit({ ...editingUnit, title: e.target.value })}
                                                onBlur={handleSaveRename}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSaveRename();
                                                    if (e.key === 'Escape') setEditingUnit(null);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                autoFocus
                                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-1 text-white text-lg font-bold focus:outline-none focus:border-blue-500"
                                            />
                                        ) : (
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-bold text-white">{unit.title}</h3>
                                                    {unit.is_global && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                                                            <Globe className="w-2.5 h-2.5" />
                                                            Global
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Paragraph count removed */}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-xs text-slate-400 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-1">
                                        {/* Unit label removed as requested */}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>0h studied</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Unit Modal */}
                    {showAddModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                            <div className="glass-card p-8 w-full max-w-md relative">
                                <h2 className="text-2xl font-bold text-white mb-6">Add New Unit</h2>
                                <form onSubmit={handleAddUnit}>
                                    <div className="mb-6">
                                        <label className="block text-slate-400 text-sm mb-2">Unit Title</label>
                                        <input
                                            type="text"
                                            value={newUnitTitle}
                                            onChange={(e) => setNewUnitTitle(e.target.value)}
                                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="e.g. Introduction to Calculus"
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
                                            Create Unit
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Resource Context Menu */}
                    {resourceMenu && (
                        <ResourceContextMenu
                            items={getResourceMenuItems(resourceMenu.unitId)}
                            position={{ x: resourceMenu.x, y: resourceMenu.y }}
                            onClose={() => setResourceMenu(null)}
                            resourceType="unit"
                            isGlobal={units.find(u => u.id === resourceMenu.unitId)?.is_global || false}
                            isAdmin={profile?.is_admin || false}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}
