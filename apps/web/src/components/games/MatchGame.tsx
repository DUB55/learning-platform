'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Trophy, Timer, CheckCircle2, XCircle } from 'lucide-react';

interface Term {
    id: string;
    term: string;
    definition: string;
}

interface MatchGameProps {
    onExit: () => void;
    terms: Term[];
}

interface Card {
    id: string;
    text: string;
    type: 'term' | 'definition';
    termId: string;
    matched: boolean;
    state: 'default' | 'selected' | 'correct' | 'wrong';
}

export default function MatchGame({ onExit, terms }: MatchGameProps) {
    const [cards, setCards] = useState<Card[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [matchedCount, setMatchedCount] = useState(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [bestTime, setBestTime] = useState<number | null>(null);

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (startTime && !isComplete) {
            interval = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [startTime, isComplete]);

    const initializeGame = useCallback(() => {
        // Take up to 8 pairs to avoid overcrowding
        const gameTerms = terms.sort(() => Math.random() - 0.5).slice(0, 8);

        const newCards: Card[] = [];
        gameTerms.forEach(term => {
            newCards.push({
                id: `term-${term.id}`,
                text: term.term,
                type: 'term',
                termId: term.id,
                matched: false,
                state: 'default'
            });
            newCards.push({
                id: `def-${term.id}`,
                text: term.definition,
                type: 'definition',
                termId: term.id,
                matched: false,
                state: 'default'
            });
        });

        setCards(newCards.sort(() => Math.random() - 0.5));
        setSelectedIds([]);
        setMatchedCount(0);
        setStartTime(Date.now());
        setElapsedTime(0);
        setIsComplete(false);
    }, [terms]);

    useEffect(() => {
        initializeGame();
        const savedBest = localStorage.getItem('match_best_time');
        if (savedBest) setBestTime(parseInt(savedBest));
    }, [initializeGame]);

    const handleCardClick = (id: string) => {
        if (selectedIds.length >= 2 || selectedIds.includes(id)) return;

        const clickedCard = cards.find(c => c.id === id);
        if (!clickedCard || clickedCard.matched) return;

        const newSelected = [...selectedIds, id];
        setSelectedIds(newSelected);

        // Update visual state to selected
        setCards(prev => prev.map(c => c.id === id ? { ...c, state: 'selected' } : c));

        if (newSelected.length === 2) {
            checkMatch(newSelected[0], newSelected[1]);
        }
    };

    const checkMatch = (id1: string, id2: string) => {
        const card1 = cards.find(c => c.id === id1);
        const card2 = cards.find(c => c.id === id2);

        if (!card1 || !card2) return;

        const isMatch = card1.termId === card2.termId && card1.type !== card2.type;

        if (isMatch) {
            // Correct match
            setCards(prev => prev.map(c => {
                if (c.id === id1 || c.id === id2) return { ...c, state: 'correct', matched: true };
                return c;
            }));

            const newMatchedCount = matchedCount + 1;
            setMatchedCount(newMatchedCount);
            setSelectedIds([]);

            if (newMatchedCount === cards.length / 2) {
                handleWin();
            }
        } else {
            // Wrong match
            setCards(prev => prev.map(c => {
                if (c.id === id1 || c.id === id2) return { ...c, state: 'wrong' };
                return c;
            }));

            setTimeout(() => {
                setCards(prev => prev.map(c => {
                    if (c.id === id1 || c.id === id2) return { ...c, state: 'default' };
                    return c;
                }));
                setSelectedIds([]);
            }, 800);
        }
    };

    const handleWin = () => {
        setIsComplete(true);
        const finalTime = Math.floor((Date.now() - (startTime || 0)) / 1000);
        if (!bestTime || finalTime < bestTime) {
            setBestTime(finalTime);
            localStorage.setItem('match_best_time', String(finalTime));
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-[#0f172a] p-4 md:p-8 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 bg-slate-900/50 p-4 rounded-2xl border border-white/10 backdrop-blur">
                <button onClick={onExit} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" /> Exit
                </button>

                <div className="flex gap-8">
                    <div className="flex items-center gap-2">
                        <Timer className="w-5 h-5 text-blue-400" />
                        <span className="text-xl font-bold text-white font-mono">{formatTime(elapsedTime)}</span>
                    </div>
                    {bestTime && (
                        <div className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-400" />
                            <span className="text-sm text-yellow-100">Best: {formatTime(bestTime)}</span>
                        </div>
                    )}
                </div>

                <button onClick={initializeGame} className="p-2 glass-button rounded-xl hover:bg-white/10">
                    <RefreshCw className="w-5 h-5 text-white" />
                </button>
            </div>

            {/* Game Grid */}
            <div className="flex-1 flex justify-center items-center">
                {!isComplete ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-6xl">
                        {cards.map(card => {
                            if (card.matched) return <div key={card.id} className="w-full aspect-[4/3]" />; // Placeholder to keep grid layout

                            return (
                                <button
                                    key={card.id}
                                    onClick={() => handleCardClick(card.id)}
                                    className={`
                                        w-full aspect-[4/3] rounded-xl p-4 flex items-center justify-center text-center transition-all duration-300 transform hover:scale-[1.02]
                                        ${card.state === 'default' ? 'glass-card hover:bg-white/10' : ''}
                                        ${card.state === 'selected' ? 'bg-blue-600/20 border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : ''}
                                        ${card.state === 'correct' ? 'bg-green-600/20 border-2 border-green-500 scale-0 opacity-0' : ''}
                                        ${card.state === 'wrong' ? 'bg-red-600/20 border-2 border-red-500 animate-shake' : ''}
                                    `}
                                >
                                    <span className={`font-medium ${card.text.length > 50 ? 'text-xs' : card.text.length > 20 ? 'text-sm' : 'text-base'} text-white`}>
                                        {card.text}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center animate-fade-in">
                        <div className="mb-6 inline-flex p-6 rounded-full bg-green-500/20 border-2 border-green-500">
                            <CheckCircle2 className="w-16 h-16 text-green-400" />
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-2">Matched All!</h2>
                        <p className="text-slate-400 text-xl mb-8">Time: {formatTime(elapsedTime)}</p>

                        <div className="flex gap-4 justify-center">
                            <button onClick={initializeGame} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2">
                                <RefreshCw className="w-5 h-5" /> Play Again
                            </button>
                            <button onClick={onExit} className="glass-button px-8 py-4 rounded-xl font-bold">
                                Back to Menu
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
