'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    BookOpen, ChevronRight, Plus, Trash2, Edit2, 
    Save, X, Layers, FileText, Globe, Lock
} from 'lucide-react';
import ErrorLogger from '@/lib/ErrorLogger';

type Subject = { id: string; title: string; color: string; is_public: boolean };
type Chapter = { id: string; title: string; order_index: number; subject_id: string };
type Paragraph = { id: string; title: string; order_index: number; chapter_id: string };

export default function AdminContentManager() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
    
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
    
    const [loading, setLoading] = useState({ subjects: false, chapters: false, paragraphs: false });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        setLoading(prev => ({ ...prev, subjects: true }));
        try {
            const { data, error } = await supabase.from('subjects').select('*').order('title');
            if (error) throw error;
            setSubjects(data || []);
        } catch (error) {
            ErrorLogger.error('Error fetching subjects', error);
        } finally {
            setLoading(prev => ({ ...prev, subjects: false }));
        }
    };

    const fetchChapters = async (subjectId: string) => {
        setLoading(prev => ({ ...prev, chapters: true }));
        try {
            const { data, error } = await supabase
                .from('chapters')
                .select('*')
                .eq('subject_id', subjectId)
                .order('order_index');
            if (error) throw error;
            setChapters(data || []);
            setParagraphs([]);
            setSelectedChapter(null);
        } catch (error) {
            ErrorLogger.error('Error fetching chapters', error);
        } finally {
            setLoading(prev => ({ ...prev, chapters: false }));
        }
    };

    const fetchParagraphs = async (chapterId: string) => {
        setLoading(prev => ({ ...prev, paragraphs: true }));
        try {
            const { data, error } = await supabase
                .from('paragraphs')
                .select('*')
                .eq('chapter_id', chapterId)
                .order('order_index');
            if (error) throw error;
            setParagraphs(data || []);
        } catch (error) {
            ErrorLogger.error('Error fetching paragraphs', error);
        } finally {
            setLoading(prev => ({ ...prev, paragraphs: false }));
        }
    };

    const handleSubjectClick = (id: string) => {
        setSelectedSubject(id);
        fetchChapters(id);
    };

    const handleChapterClick = (id: string) => {
        setSelectedChapter(id);
        fetchParagraphs(id);
    };

    const startEditing = (id: string, currentTitle: string) => {
        setEditingId(id);
        setEditValue(currentTitle);
    };

    const saveEdit = async (type: 'subjects' | 'chapters' | 'paragraphs', id: string) => {
        try {
            const { error } = await supabase
                .from(type)
                .update({ title: editValue })
                .eq('id', id);

            if (error) throw error;

            if (type === 'subjects') setSubjects(subjects.map(s => s.id === id ? { ...s, title: editValue } : s));
            if (type === 'chapters') setChapters(chapters.map(c => c.id === id ? { ...c, title: editValue } : c));
            if (type === 'paragraphs') setParagraphs(paragraphs.map(p => p.id === id ? { ...p, title: editValue } : p));

            setEditingId(null);
        } catch (error) {
            ErrorLogger.error(`Error saving ${type}`, error);
            alert('Failed to save changes');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
            {/* Subjects Column */}
            <div className="glass-card flex flex-col overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/2">
                    <h3 className="text-white font-medium flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-400" />
                        Subjects
                    </h3>
                    <button className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {subjects.map(s => (
                        <div 
                            key={s.id}
                            onClick={() => handleSubjectClick(s.id)}
                            className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${selectedSubject === s.id ? 'bg-blue-600/20 border border-blue-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`w-2 h-2 rounded-full shrink-0 bg-${s.color}-500 shadow-[0_0_8px_rgba(var(--${s.color}-500-rgb),0.5)]`} />
                                {editingId === s.id ? (
                                    <input 
                                        autoFocus
                                        value={editValue}
                                        onChange={e => setEditValue(e.target.value)}
                                        onBlur={() => saveEdit('subjects', s.id)}
                                        onKeyDown={e => e.key === 'Enter' && saveEdit('subjects', s.id)}
                                        className="bg-slate-800 border-none p-0 text-white focus:ring-0 w-full"
                                    />
                                ) : (
                                    <span className="text-sm text-slate-200 truncate">{s.title}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); startEditing(s.id, s.title); }}
                                    className="p-1 hover:text-white text-slate-500"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <ChevronRight className="w-4 h-4 text-slate-600" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chapters Column */}
            <div className="glass-card flex flex-col overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/2">
                    <h3 className="text-white font-medium flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-400" />
                        Chapters
                    </h3>
                    {selectedSubject && (
                        <button className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white">
                            <Plus className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {!selectedSubject ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
                            <BookOpen className="w-8 h-8 opacity-20" />
                            Select a subject
                        </div>
                    ) : chapters.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">No chapters found</div>
                    ) : (
                        chapters.map(c => (
                            <div 
                                key={c.id}
                                onClick={() => handleChapterClick(c.id)}
                                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${selectedChapter === c.id ? 'bg-purple-600/20 border border-purple-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <span className="text-xs font-mono text-slate-500 shrink-0">{c.order_index}</span>
                                    {editingId === c.id ? (
                                        <input 
                                            autoFocus
                                            value={editValue}
                                            onChange={e => setEditValue(e.target.value)}
                                            onBlur={() => saveEdit('chapters', c.id)}
                                            className="bg-slate-800 border-none p-0 text-white focus:ring-0 w-full"
                                        />
                                    ) : (
                                        <span className="text-sm text-slate-200 truncate">{c.title}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); startEditing(c.id, c.title); }}
                                        className="p-1 hover:text-white text-slate-500"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <ChevronRight className="w-4 h-4 text-slate-600" />
                                </div>
                            </div>
                        )
                    ))}
                </div>
            </div>

            {/* Paragraphs Column */}
            <div className="glass-card flex flex-col overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/2">
                    <h3 className="text-white font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        Paragraphs
                    </h3>
                    {selectedChapter && (
                        <button className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white">
                            <Plus className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {!selectedChapter ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
                            <Layers className="w-8 h-8 opacity-20" />
                            Select a chapter
                        </div>
                    ) : paragraphs.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">No paragraphs found</div>
                    ) : (
                        paragraphs.map(p => (
                            <div 
                                key={p.id}
                                className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent transition-all"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <span className="text-xs font-mono text-slate-500 shrink-0">{p.order_index}</span>
                                    {editingId === p.id ? (
                                        <input 
                                            autoFocus
                                            value={editValue}
                                            onChange={e => setEditValue(e.target.value)}
                                            onBlur={() => saveEdit('paragraphs', p.id)}
                                            className="bg-slate-800 border-none p-0 text-white focus:ring-0 w-full"
                                        />
                                    ) : (
                                        <span className="text-sm text-slate-200 truncate">{p.title}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => startEditing(p.id, p.title)}
                                        className="p-1 hover:text-white text-slate-500"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button className="p-1 hover:text-red-400 text-slate-500">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )
                    ))}
                </div>
            </div>
        </div>
    );
}
