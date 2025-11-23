'use client';

import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { RotateCcw, Check, X, Eye, EyeOff, Brain, TrendingUp } from 'lucide-react';

interface Card {
    id: string;
    term: string;
    definition: string;
    ease_factor: number;
    interval_days: number;
    repetitions: number;
}

export default function StudyPage() {
    const { user } = useAuth();
    const [cards, setCards] = useState<Card[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [loading, setLoading] = useState(true);
    const [reviewing, setReviewing] = useState(false);
    const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });

    useEffect(() => {
        if (user) {
            fetchDueCards();
        }
    }, [user]);

    const fetchDueCards = async () => {
        try {
            const { data, error } = await supabase
                .from('srscards')
                .select(`
          id,
          ease_factor,
          interval_days,
          repetitions,
          leersetitem:leersetitems (
            id,
            term,
            definition
          )
        `)
                .eq('user_id', user!.id)
                .lte('next_review_date', new Date().toISOString())
                .limit(20);

            if (error) throw error;

            const formattedCards = (data || []).map((card: any) => ({
                id: card.id,
                term: card.leersetitem.term,
                definition: card.leersetitem.definition,
                ease_factor: card.ease_factor,
                interval_days: card.interval_days,
                repetitions: card.repetitions,
            }));

            setCards(formattedCards);
        } catch (error) {
            console.error('Error fetching cards:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (quality: number) => {
        if (reviewing) return;
        setReviewing(true);

        try {
            const response = await fetch('/api/srs/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cardId: cards[currentIndex].id,
                    userId: user!.id,
                    quality,
                    timeSpent: 0,
                }),
            });

            if (!response.ok) throw new Error('Review failed');

            // Update stats
            setSessionStats(prev => ({
                correct: prev.correct + (quality >= 3 ? 1 : 0),
                total: prev.total + 1,
            }));

            // Move to next card
            if (currentIndex < cards.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setShowAnswer(false);
            } else {
                // Session complete
                alert(`Sessie voltooid! ${sessionStats.correct + (quality >= 3 ? 1 : 0)}/${sessionStats.total + 1} correct`);
                setCards([]);
                setCurrentIndex(0);
            }
        } catch (error) {
            console.error('Review error:', error);
            alert('Er ging iets mis bij het opslaan. Probeer opnieuw.');
        } finally {
            setReviewing(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
            </Layout>
        );
    }

    if (cards.length === 0) {
        return (
            <Layout>
                <div className="max-w-2xl mx-auto text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <Check className="w-12 h-12 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Alles klaar voor vandaag!
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">
                        Je hebt geen kaarten meer om te reviewen. Kom morgen terug!
                    </p>
                    <button
                        onClick={fetchDueCards}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                        <RotateCcw className="w-5 h-5 inline mr-2" />
                        Ververs
                    </button>
                </div>
            </Layout>
        );
    }

    const currentCard = cards[currentIndex];
    const progress = ((currentIndex + 1) / cards.length) * 100;

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Kaart {currentIndex + 1} van {cards.length}
                        </span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                            {sessionStats.total > 0 && (
                                <>
                                    {sessionStats.correct}/{sessionStats.total} correct (
                                    {Math.round((sessionStats.correct / sessionStats.total) * 100)}%)
                                </>
                            )}
                        </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Flashcard */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 md:p-12 border border-slate-200 dark:border-slate-700 min-h-[400px] flex flex-col justify-between">
                    {/* Card Content */}
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="text-center mb-8">
                            <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-4">
                                {showAnswer ? 'Definitie' : 'Begrip'}
                            </p>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">
                                {showAnswer ? currentCard.definition : currentCard.term}
                            </h2>
                        </div>

                        {!showAnswer ? (
                            <button
                                onClick={() => setShowAnswer(true)}
                                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 text-lg"
                            >
                                <Eye className="w-5 h-5" />
                                Toon Antwoord
                            </button>
                        ) : (
                            <div className="w-full">
                                <p className="text-center text-sm text-slate-600 dark:text-slate-400 mb-4">
                                    Hoe goed kende je dit?
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <button
                                        onClick={() => handleReview(0)}
                                        disabled={reviewing}
                                        className="px-4 py-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 font-medium rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <X className="w-5 h-5 mx-auto mb-1" />
                                        <span className="text-xs">Fout</span>
                                    </button>
                                    <button
                                        onClick={() => handleReview(2)}
                                        disabled={reviewing}
                                        className="px-4 py-3 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 font-medium rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <Brain className="w-5 h-5 mx-auto mb-1" />
                                        <span className="text-xs">Moeilijk</span>
                                    </button>
                                    <button
                                        onClick={() => handleReview(3)}
                                        disabled={reviewing}
                                        className="px-4 py-3 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <Check className="w-5 h-5 mx-auto mb-1" />
                                        <span className="text-xs">Goed</span>
                                    </button>
                                    <button
                                        onClick={() => handleReview(5)}
                                        disabled={reviewing}
                                        className="px-4 py-3 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 font-medium rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <TrendingUp className="w-5 h-5 mx-auto mb-1" />
                                        <span className="text-xs">Makkelijk</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Card Info */}
                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                            <span>Interval: {currentCard.interval_days} dagen</span>
                            <span>Herhalingen: {currentCard.repetitions}</span>
                            <span>Ease: {currentCard.ease_factor.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Help Text */}
                <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                    <p>Tip: Wees eerlijk over je antwoord voor optimale leerresultaten</p>
                </div>
            </div>
        </Layout>
    );
}
