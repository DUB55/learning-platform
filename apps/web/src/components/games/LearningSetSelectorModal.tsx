'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    X, 
    ChevronRight, 
    Brain, 
    BookOpen, 
    FolderOpen, 
    FileText,
    Search,
    Loader2
} from 'lucide-react';

interface LearningSet {
    id: string;
    title: string;
    description: string | null;
}

interface Paragraph {
    id: string;
    title: string;
    learning_sets: LearningSet[];
}

interface Unit {
    id: string;
    title: string;
    paragraphs: Paragraph[];
}

interface Subject {
    id: string;
    title: string;
    color: string;
    units: Unit[];
}

interface LearningSetSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (setId: string) => void;
    gameTitle: string;
}

export default function LearningSetSelectorModal({ 
    isOpen, 
    onClose, 
    onSelect,
    gameTitle
}: LearningSetSelectorModalProps) {
    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
    const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
    const [expandedParagraphs, setExpandedParagraphs] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch subjects
            const { data: subjectsData, error: subjectsError } = await supabase
                .from('subjects')
                .select('id, title, color')
                .order('title');

            if (subjectsError) throw subjectsError;

            const subjectsWithContent: Subject[] = [];

            for (const subject of (subjectsData as any[])) {
                // Fetch units for this subject
                const { data: unitsData, error: unitsError } = await supabase
                    .from('units')
                    .select('id, title')
                    .eq('subject_id', subject.id)
                    .order('title');

                if (unitsError) throw unitsError;

                const unitsWithContent: Unit[] = [];

                for (const unit of (unitsData as any[])) {
                    // Fetch paragraphs for this unit
                    const { data: paragraphsData, error: paragraphsError } = await supabase
                        .from('paragraphs')
                        .select('id, title')
                        .eq('unit_id', unit.id)
                        .order('title');

                    if (paragraphsError) throw paragraphsError;

                    const paragraphsWithContent: Paragraph[] = [];

                    for (const paragraph of (paragraphsData as any[])) {
                        // Fetch learning sets for this paragraph
                        const { data: setsData, error: setsError } = await supabase
                            .from('learning_sets')
                            .select('id, title, description')
                            .eq('paragraph_id', paragraph.id)
                            .order('created_at', { ascending: false });

                        if (setsError) throw setsError;

                        if (setsData && setsData.length > 0) {
                            paragraphsWithContent.push({
                                ...paragraph,
                                learning_sets: setsData as any[]
                            });
                        }
                    }

                    if (paragraphsWithContent.length > 0) {
                        unitsWithContent.push({
                            ...unit,
                            paragraphs: paragraphsWithContent
                        });
                    }
                }

                if (unitsWithContent.length > 0) {
                    subjectsWithContent.push({
                        ...subject,
                        units: unitsWithContent
                    });
                }
            }

            setSubjects(subjectsWithContent);
        } catch (error) {
            console.error('Error fetching organized learning sets:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSubject = (id: string) => {
        const newSet = new Set(expandedSubjects);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedSubjects(newSet);
    };

    const toggleUnit = (id: string) => {
        const newSet = new Set(expandedUnits);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedUnits(newSet);
    };

    const toggleParagraph = (id: string) => {
        const newSet = new Set(expandedParagraphs);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedParagraphs(newSet);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-[2rem] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Brain className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Select Study Material</h2>
                            <p className="text-slate-400 text-xs">Choose a learning set for {gameTitle}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-white/5 bg-slate-900/30">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search learning sets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            <p className="text-slate-400 text-sm">Organizing your learning sets...</p>
                        </div>
                    ) : subjects.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="w-8 h-8 text-slate-600" />
                            </div>
                            <h3 className="text-white font-bold mb-1">No learning sets found</h3>
                            <p className="text-slate-400 text-sm">Create some learning sets first in your subjects.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {subjects.map((subject) => (
                                <div key={subject.id} className="space-y-1">
                                    <button
                                        onClick={() => toggleSubject(subject.id)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                                    >
                                        <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${expandedSubjects.has(subject.id) ? 'rotate-90' : ''}`} />
                                        <div className={`w-2 h-2 rounded-full ${subject.color || 'bg-blue-500'}`} />
                                        <span className="text-white font-semibold">{subject.title}</span>
                                        <span className="ml-auto text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full">
                                            {subject.units.length} Units
                                        </span>
                                    </button>

                                    {expandedSubjects.has(subject.id) && (
                                        <div className="ml-7 space-y-1 border-l border-white/5 pl-2 py-1">
                                            {subject.units.map((unit) => (
                                                <div key={unit.id} className="space-y-1">
                                                    <button
                                                        onClick={() => toggleUnit(unit.id)}
                                                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                                                    >
                                                        <ChevronRight className={`w-3 h-3 text-slate-600 transition-transform ${expandedUnits.has(unit.id) ? 'rotate-90' : ''}`} />
                                                        <FolderOpen className="w-4 h-4 text-blue-400/60" />
                                                        <span className="text-slate-300 text-sm font-medium">{unit.title}</span>
                                                    </button>

                                                    {expandedUnits.has(unit.id) && (
                                                        <div className="ml-6 space-y-1 border-l border-white/5 pl-2 py-1">
                                                            {unit.paragraphs.map((paragraph) => (
                                                                <div key={paragraph.id} className="space-y-1">
                                                                    <button
                                                                        onClick={() => toggleParagraph(paragraph.id)}
                                                                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                                                                    >
                                                                        <ChevronRight className={`w-3 h-3 text-slate-700 transition-transform ${expandedParagraphs.has(paragraph.id) ? 'rotate-90' : ''}`} />
                                                                        <FileText className="w-4 h-4 text-slate-500" />
                                                                        <span className="text-slate-400 text-sm">{paragraph.title}</span>
                                                                    </button>

                                                                    {expandedParagraphs.has(paragraph.id) && (
                                                                        <div className="ml-6 space-y-1">
                                                                            {paragraph.learning_sets.map((set) => (
                                                                                <button
                                                                                    key={set.id}
                                                                                    onClick={() => onSelect(set.id)}
                                                                                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 hover:bg-blue-500/20 border border-blue-500/10 hover:border-blue-500/30 transition-all text-left group"
                                                                                >
                                                                                    <Brain className="w-4 h-4 text-blue-400" />
                                                                                    <div className="flex-1">
                                                                                        <p className="text-white text-sm font-bold group-hover:text-blue-300 transition-colors">{set.title}</p>
                                                                                        {set.description && (
                                                                                            <p className="text-slate-500 text-[11px] line-clamp-1">{set.description}</p>
                                                                                        )}
                                                                                    </div>
                                                                                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-all group-hover:translate-x-1" />
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-slate-900/50 flex justify-between items-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        Choose content to customize your experience
                    </p>
                    <button 
                        onClick={onClose}
                        className="text-sm font-bold text-slate-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
