'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Edit2, Trash2, Play, Shuffle, Eye, EyeOff, ChevronsRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface LearningSetItem {
    id: string;
    term: string;
    definition: string;
    order_index: number;
}

interface LearningSet {
    id: string;
    title: string;
    description: string | null;
    user_id: string;
    created_at: string;
}

export default function ViewLearningSetPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const setId = params.setId as string;

    const [learningSet, setLearningSet] = useState<LearningSet | null>(null);
    const [items, setItems] = useState<LearningSetItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [studyMode, setStudyMode] = useState<'flashcards' | 'practice' | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [shuffled, setShuffled] = useState(false);

    useEffect(() => {
        if (user && setId) {
            fetchData();
        }
    }, [user, setId]);

    const fetchData = async () => {
        setLoading(true);

        const { data: setData } = await supabase
            .from('learning_sets')
            .select('*')
            .eq('id', setId)
            .single();

        if (setData) setLearningSet(setData);

        const { data: itemsData } = await supabase
            .from('learning_set_items')
            .select('*')
            .eq('learning_set_id', setId)
            .order('order_index');

        if (itemsData) setItems(itemsData);

        setLoading(false);
    };

    const handleDelete = async () => {
        if (!confirm('Delete this learning set?')) return;

        await supabase
            .from('learning_sets')
            .delete()
            .eq('id', setId);

        router.back();
    };

    const startFlashcards = () => {
        setStudyMode('flashcards');
        setCurrentIndex(0);
        setShowAnswer(false);
    };

    const startPractice = () => {
        setStudyMode('practice');
        setCurrentIndex(0);
    };

    const handleShuffle = () => {
        const shuffledItems = [...items].sort(() => Math.random() - 0.5);
        setItems(shuffledItems);
        setShuffled(true);
        setCurrentIndex(0);
        setShowAnswer(false);
    };

    const nextCard = () => {
        if (currentIndex < items.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setShowAnswer(false);
        }
    };

    const prevCard = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setShowAnswer(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!learningSet) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Learning Set Not Found</h2>
                    <button onClick={() => router.back()} className="glass-button px-6 py-3 rounded-xl">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Flashcard Study Mode
    if (studyMode === 'flashcards' && items.length > 0) {
        const currentItem = items[currentIndex];

        return (
            <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
                <Sidebar />

                <main className="flex-1 overflow-y-auto relative p-8">
                    <div className="max-w-4xl mx-auto">
                        <button
                            onClick={() => setStudyMode(null)}
                            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Exit Study Mode</span>
                        </button>

                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">{learningSet.title}</h2>
                            <p className="text-slate-400">
                                {currentIndex + 1} / {items.length}
                            </p>
                        </div>

                        {/* Flashcard */}
                        <div
                            className="glass-card p-12 min-h-[400px] flex items-center justify-center cursor-pointer hover:bg-white/5 transition-all mb-6"
                            onClick={() => setShowAnswer(!showAnswer)}
                        >
                            <div className="text-center">
                                {showAnswer ? (
                                    <>
                                        <p className="text-slate-400 text-sm mb-4">Definition</p>
                                        <h3 className="text-3xl font-bold text-white">{currentItem.definition}</h3>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-slate-400 text-sm mb-4">Term</p>
                                        <h3 className="text-3xl font-bold text-white">{currentItem.term}</h3>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={prevCard}
                                disabled={currentIndex === 0}
                                className="glass-button px-6 py-3 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>

                            <button
                                onClick={() => setShowAnswer(!showAnswer)}
                                className="glass-button px-6 py-3 rounded-xl flex items-center gap-2"
                            >
                                {showAnswer ? (
                                    <>
                                        <EyeOff className="w-4 h-4" />
                                        <span>Hide Answer</span>
                                    </>
                                ) : (
                                    <>
                                        <Eye className="w-4 h-4" />
                                        <span>Show Answer</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={nextCard}
                                disabled={currentIndex === items.length - 1}
                                className="glass-button px-6 py-3 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Practice List Mode
    if (studyMode === 'practice') {
        return (
            <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
                <Sidebar />

                <main className="flex-1 overflow-y-auto relative p-8">
                    <div className="max-w-4xl mx-auto">
                        <button
                            onClick={() => setStudyMode(null)}
                            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Exit Practice Mode</span>
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-8">{learningSet.title} - Practice</h2>

                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <div key={item.id} className="glass-card p-6">
                                    <div className="flex items-start gap-4">
                                        <span className="text-blue-400 font-mono text-sm">{index + 1}</span>
                                        <div className="flex-1 grid grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="text-slate-400 text-sm mb-1">Term</h4>
                                                <p className="text-white font-medium">{item.term}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-slate-400 text-sm mb-1">Definition</h4>
                                                <p className="text-slate-300">{item.definition}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Default View
    return (
        <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto relative p-8">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </button>

                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-white mb-2">{learningSet.title}</h1>
                            {learningSet.description && (
                                <p className="text-slate-400">{learningSet.description}</p>
                            )}
                            <p className="text-slate-500 text-sm mt-2">{items.length} terms</p>
                        </div>

                        {user?.id === learningSet.user_id && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => router.push(`${params.setId}/edit`)}
                                    className="p-3 glass-button rounded-xl"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Study Mode Options */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                        <button
                            onClick={startFlashcards}
                            className="glass-card p-6 hover:bg-white/5 transition-all group"
                        >
                            <Play className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                            <h3 className="text-white font-bold mb-1">Flashcards</h3>
                            <p className="text-slate-400 text-sm">Study with flashcards</p>
                        </button>

                        <button
                            onClick={handleShuffle}
                            className="glass-card p-6 hover:bg-white/5 transition-all group"
                        >
                            <Shuffle className="w-8 h-8 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
                            <h3 className="text-white font-bold mb-1">Shuffle</h3>
                            <p className="text-slate-400 text-sm">Randomize order</p>
                        </button>

                        <button
                            onClick={startPractice}
                            className="glass-card p-6 hover:bg-white/5 transition-all group"
                        >
                            <ChevronsRight className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                            <h3 className="text-white font-bold mb-1">Practice</h3>
                            <p className="text-slate-400 text-sm">View all terms</p>
                        </button>
                    </div>

                    {/* All Terms List */}
                    <div>
                        <h2 className="text-xl font-bold text-white mb-4">All Terms</h2>
                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={item.id} className="glass-card p-4">
                                    <div className="flex items-start gap-4">
                                        <span className="text-slate-500 font-mono text-sm">{index + 1}</span>
                                        <div className="flex-1 grid grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="text-slate-400 text-xs mb-1">TERM</h4>
                                                <p className="text-white">{item.term}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-slate-400 text-xs mb-1">DEFINITION</h4>
                                                <p className="text-slate-300">{item.definition}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
