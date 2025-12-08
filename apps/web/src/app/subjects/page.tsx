'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BookOpen, Plus, MoreHorizontal, Clock, Calendar, Globe, Lock, Edit2, Trash2 } from 'lucide-react';

import SubjectMenu from '@/components/SubjectMenu';
import ResourceContextMenu from '@/components/ResourceContextMenu';

export default function SubjectsPage() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newSubjectTitle, setNewSubjectTitle] = useState('');
    const [resourceMenu, setResourceMenu] = useState<{ x: number; y: number; subjectId: string } | null>(null);
    const [editingSubject, setEditingSubject] = useState<{ id: string; title: string } | null>(null);

    useEffect(() => {
        if (user) {
            fetchSubjects();

            // Subscribe to real-time updates
            const channel = supabase
                .channel('subjects-changes')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'subjects' },
                    () => {
                        fetchSubjects();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user]);

    const fetchSubjects = async () => {
        setLoading(true);
        if (!user) return;

        // Fetch subjects with unit counts
        const { data: subjectsData, error: subjectsError } = await (supabase.from('subjects') as any)
            .select('*')
            .order('created_at', { ascending: false });

        if (subjectsError) {
            console.error('Error fetching subjects:', subjectsError);
            setLoading(false);
            return;
        }

        // Fetch unit counts for each subject
        const subjectsWithCounts = await Promise.all(
            (subjectsData || []).map(async (subject) => {
                const { count } = await supabase
                    .from('units')
                    .select('*', { count: 'exact', head: true })
                    .eq('subject_id', subject.id);

                return {
                    ...subject,
                    unit_count: count || 0
                };
            })
        );

        setSubjects(subjectsWithCounts);
        setLoading(false);
    };

    const handleAddSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newSubjectTitle.trim()) return;

        const { error } = await (supabase.from('subjects') as any)
            .insert([
                {
                    user_id: user.id,
                    title: newSubjectTitle,
                    color: 'blue'
                }
            ] as any);

        if (!error) {
            setNewSubjectTitle('');
            setShowAddModal(false);
            fetchSubjects();
        }
    };

    const handleToggleGlobal = async (subjectId: string) => {
        const subject = subjects.find(s => s.id === subjectId);
        if (!subject) return;

        const { error } = await (supabase.from('subjects') as any)
            .update({ is_global: !subject.is_global })
            .eq('id', subjectId);

        if (!error) {
            fetchSubjects();
        }
    };

    const handleRenameSubject = (subjectId: string) => {
        const subject = subjects.find(s => s.id === subjectId);
        if (subject) {
            setEditingSubject({ id: subject.id, title: subject.title });
        }
    };

    const handleSaveRename = async () => {
        if (!editingSubject) return;

        const { error } = await (supabase.from('subjects') as any)
            .update({ title: editingSubject.title })
            .eq('id', editingSubject.id);

        if (!error) {
            setEditingSubject(null);
            fetchSubjects();
        }
    };

    const handleResourceContextMenu = (e: React.MouseEvent, subjectId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setResourceMenu({
            x: e.clientX,
            y: e.clientY,
            subjectId
        });
    };

    const getResourceMenuItems = (subjectId: string) => {
        const subject = subjects.find(s => s.id === subjectId);
        if (!subject) return [];

        const items = [
            {
                icon: <Edit2 className="w-4 h-4" />,
                label: 'Rename',
                onClick: () => handleRenameSubject(subjectId)
            }
        ];

        // Only admins can toggle global status
        if (profile?.is_admin) {
            items.unshift({
                icon: subject.is_global ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />,
                label: subject.is_global ? 'Make Private' : 'Make Global',
                onClick: () => handleToggleGlobal(subjectId)
            });
        }

        items.push({
            icon: <Trash2 className="w-4 h-4" />,
            label: 'Delete',
            onClick: () => handleDeleteSubject(subjectId),
            danger: true,
            divider: true
        });

        return items;
    };

    const handleDeleteSubject = async (subjectId: string) => {
        if (!confirm('Are you sure you want to delete this subject?')) return;

        const { error } = await (supabase.from('subjects') as any)
            .delete()
            .eq('id', subjectId);

        if (!error) {
            setSubjects(subjects.filter(s => s.id !== subjectId));
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-8">


            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-white mb-2">Subjects</h1>
                        <p className="text-slate-400">Manage your courses and learning materials</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="glass-button px-4 py-2 rounded-xl flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Subject</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subjects.map((subject) => (
                        <div
                            key={subject.id}
                            className="glass-card p-6 border-l-4 border-blue-500/50 hover:bg-white/5 transition-all duration-300 group cursor-pointer"
                            onClick={() => router.push(`/subjects/${subject.id}/units`)}
                            onContextMenu={(e) => handleResourceContextMenu(e, subject.id)}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex-1">
                                    {editingSubject && editingSubject.id === subject.id ? (
                                        <input
                                            type="text"
                                            value={editingSubject.title}
                                            onChange={(e) => setEditingSubject({ ...editingSubject, title: e.target.value })}
                                            onBlur={handleSaveRename}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveRename();
                                                if (e.key === 'Escape') setEditingSubject(null);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-1 text-white text-lg font-bold focus:outline-none focus:border-blue-500"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-bold text-white">{subject.title}</h3>
                                            {subject.is_global && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                                                    <Globe className="w-2.5 h-2.5" />
                                                    Global
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-slate-400 text-sm">{subject.unit_count || 0} units</p>
                                </div>
                                <div data-subject-menu={subject.id} onClick={(e) => e.stopPropagation()}>
                                    <SubjectMenu
                                        subjectId={subject.id}
                                        subjectTitle={subject.title}
                                        isOwner={subject.user_id === user?.id}
                                        onView={() => router.push(`/subjects/${subject.id}/units`)}
                                        onDelete={() => handleDeleteSubject(subject.id)}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-xs text-slate-400 pt-4 border-t border-white/5">
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>0h studied</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>Created {new Date(subject.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Subject Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="glass-card p-8 w-full max-w-md relative">
                            <h2 className="text-2xl font-bold text-white mb-6">Add New Subject</h2>
                            <form onSubmit={handleAddSubject}>
                                <div className="mb-6">
                                    <label className="block text-slate-400 text-sm mb-2">Subject Title</label>
                                    <input
                                        type="text"
                                        value={newSubjectTitle}
                                        onChange={(e) => setNewSubjectTitle(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder="e.g. Advanced Calculus"
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
                                        Create Subject
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Resource Context Menu */}
                {resourceMenu && (
                    <ResourceContextMenu
                        items={getResourceMenuItems(resourceMenu.subjectId)}
                        position={{ x: resourceMenu.x, y: resourceMenu.y }}
                        onClose={() => setResourceMenu(null)}
                        resourceType="subject"
                        isGlobal={subjects.find(s => s.id === resourceMenu.subjectId)?.is_global || false}
                        isAdmin={profile?.is_admin || false}
                    />
                )}
            </div>

        </div>
    );
}
