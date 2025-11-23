'use client';
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { BookOpen, Plus, MoreHorizontal, Clock, Calendar } from 'lucide-react';

import Sidebar from '@/components/Sidebar';

export default function SubjectsPage() {
    const { user } = useAuth();
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newSubjectTitle, setNewSubjectTitle] = useState('');

    useEffect(() => {
        if (user) {
            fetchSubjects();
        }
    }, [user]);

    const fetchSubjects = async () => {
        try {
            const { data } = await supabase
                .from('subjects')
                .select('*, chapters(count)')
                .order('created_at', { ascending: false });

            if (data) setSubjects(data);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubject = async (e: React.FormEvent) => {
        e.preventDefault();
    } catch (error) {
        console.error('Error adding subject:', error);
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
                        <div key={subject.id} className="glass-card p-6 border-l-4 border-blue-500/50 hover:bg-white/5 transition-all duration-300 group">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">{subject.title}</h3>
                                    <p className="text-slate-400 text-sm">{subject.chapters[0]?.count || 0} chapters</p>
                                </div>
                                <button className="text-slate-500 hover:text-white transition-colors">
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
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
            </div>
        </main>
    </div>
);
}
