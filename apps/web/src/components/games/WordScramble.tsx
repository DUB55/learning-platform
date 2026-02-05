'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Trophy, ArrowLeft, Lightbulb, Check, X, Sparkles, Send, Play, FolderOpen, Brain } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import ResourceExplorerModal from '@/components/modals/ResourceExplorerModal';
import ErrorLogger from '@/lib/ErrorLogger';

interface Term { id: string; term: string; definition: string; }

interface WordScrambleProps {
    onExit: () => void;
    terms?: Term[];
    focusMode?: boolean;
}

export default function WordScramble({ onExit, terms: initialTerms = [], focusMode }: WordScrambleProps) {
    const { updateXP } = useAuth();
    const [gameState, setGameState] = useState<'setup' | 'playing' | 'gameOver'>('setup');
    const [terms, setTerms] = useState<Term[]>(initialTerms);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [scrambled, setScrambled] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [showResult, setShowResult] = useState<'correct' | 'wrong' | null>(null);
    const [hintUsed, setHintUsed] = useState(false);
    const [isExplorerOpen, setIsExplorerOpen] = useState(false);
    const [selectedSetId, setSelectedSetId] = useState<string>('');
    const [selectedSetName, setSelectedSetName] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialTerms.length > 0) {
            setTerms(initialTerms);
            setGameState('playing');
        }
    }, [initialTerms]);

    const handleSelectResource = (resource: any) => {
        setSelectedSetId(resource.id);
        setSelectedSetName(resource.title);
    };

    const handleStart = async () => {
        if (!selectedSetId) return;

        setLoading(true);
        try {
            const { data: items, error } = await supabase
                .from('leerset_items')
                .select('id, term, definition')
                .eq('leerset_id', selectedSetId);

            if (error) throw error;

            if (items && items.length > 0) {
                setTerms(items);
                setGameState('playing');
                setCurrentIndex(0);
                setScore(0);
            } else {
                alert('This learning set has no terms. Please choose another one.');
            }
        } catch (err) {
            ErrorLogger.error('Error starting Word Scramble', err);
            alert('Failed to load learning set.');
        } finally {
            setLoading(false);
        }
    };

    const scramble = (word: string) => {
        const arr = word.split('');
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        if (arr.join('') === word) return scramble(word);
        return arr.join('').toUpperCase();
    };

    const nextWord = useCallback(() => {
        if (terms.length === 0) return;
        if (currentIndex < terms.length - 1) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            setScrambled(scramble(terms[nextIdx].term));
            setInputValue('');
            setShowResult(null);
            setHintUsed(false);
        } else {
            setGameState('gameOver');
            updateXP(Math.min(Math.floor(score / 10), 50), `Word Scramble - Set Completed: ${selectedSetName}`);
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
    }, [currentIndex, terms]);

    useEffect(() => {
        const saved = localStorage.getItem('scramble_highscore');
        if (saved) setHighScore(parseInt(saved));
        if (terms.length > 0) {
            setScrambled(scramble(terms[0].term));
        }
    }, [terms]);

    const handleGuess = (e: React.FormEvent) => {
        e.preventDefault();
        const correct = terms[currentIndex].term.toLowerCase() === inputValue.trim().toLowerCase();

        if (correct) {
            setShowResult('correct');
            const points = hintUsed ? 50 : 100;
            setScore(s => s + points);
            if (score + points > highScore) {
                setHighScore(score + points);
                localStorage.setItem('scramble_highscore', String(score + points));
            }
            confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 } });
            setTimeout(nextWord, 1000);
        } else {
            setShowResult('wrong');
            setTimeout(() => setShowResult(null), 1000);
        }
    };

    const handleHint = () => {
        setHintUsed(true);
        const term = terms[currentIndex].term;
        setInputValue(term.substring(0, Math.ceil(term.length / 2)));
    };

    if (gameState === 'setup') {
        return (
            <div className="w-full max-w-2xl p-8 space-y-8 animate-in fade-in zoom-in duration-500 glass-card">
                <div className="text-center space-y-2">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                        <Brain className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white uppercase tracking-tight italic">Word Scramble</h2>
                    <p className="text-slate-400">Unscramble terms from your learning set to earn XP.</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Select Learning Set</label>
                        <div 
                            onClick={() => setIsExplorerOpen(true)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white hover:bg-white/10 transition-all cursor-pointer flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <FolderOpen className="w-5 h-5 text-emerald-400" />
                                <span className={selectedSetName ? "text-white font-medium" : "text-slate-500"}>
                                    {selectedSetName || "Browse your library..."}
                                </span>
                            </div>
                            <Search className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                        </div>
                    </div>

                    <button 
                        onClick={handleStart}
                        disabled={!selectedSetId || loading}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-lg"
                    >
                        {loading ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                            <Play className="w-5 h-5" />
                        )}
                        Start Game
                    </button>
                </div>

                <ResourceExplorerModal 
                    isOpen={isExplorerOpen}
                    onClose={() => setIsExplorerOpen(false)}
                    onSelect={handleSelectResource}
                    title="Select Learning Set"
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center p-6 w-full max-w-2xl mx-auto">
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-12 bg-white/5 p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
                <div className="flex gap-10">
                    <div className="text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">XP Points</p>
                        <p className="text-3xl font-black text-white">{score}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-slate-800/50 px-4 py-2 rounded-xl border border-white/5">
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Progress</p>
                        <p className="text-sm font-black text-emerald-400">{currentIndex + 1} / {terms.length}</p>
                    </div>
                    <button onClick={onExit} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 group">
                        <X className="w-5 h-5 text-slate-400 group-hover:text-white" />
                    </button>
                </div>
            </div>

            {/* Game Card */}
            <div className="relative w-full bg-slate-900 border-4 border-slate-800 rounded-[3rem] p-10 shadow-2xl overflow-hidden mb-8">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] -ml-32 -mb-32" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">Unscramble This</span>
                    </div>

                    <h2 className="text-6xl font-black text-white mb-10 tracking-widest bg-gradient-to-br from-white to-slate-500 bg-clip-text text-transparent break-all text-center">
                        {scrambled}
                    </h2>

                    <div className="w-full max-w-md bg-white/5 p-6 rounded-[2rem] border border-white/5 backdrop-blur-md mb-8">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Definition Hint:</p>
                        <p className="text-sm font-medium text-slate-300 leading-relaxed italic">"{terms[currentIndex].definition}"</p>
                    </div>

                    <form onSubmit={handleGuess} className="w-full max-w-md flex flex-col gap-4">
                        <div className="relative group">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Type your answer..."
                                className={`
                                    w-full bg-slate-950 border-2 px-8 py-5 rounded-[1.5rem] text-white font-bold text-lg outline-none transition-all text-center
                                    ${showResult === 'correct' ? 'border-emerald-500 bg-emerald-500/10' :
                                        showResult === 'wrong' ? 'border-rose-500 bg-rose-500/10 shake' :
                                            'border-white/5 focus:border-blue-500/50 group-hover:bg-white/5'}
                                `}
                                autoFocus
                            />
                            {showResult === 'correct' && <Check className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500 animate-in zoom-in" />}
                            {showResult === 'wrong' && <X className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-rose-500 animate-in zoom-in" />}
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={handleHint}
                                disabled={hintUsed || showResult === 'correct'}
                                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all border border-white/5 active:scale-95 disabled:opacity-30"
                            >
                                <Lightbulb className="w-4 h-4" />
                                HINT
                            </button>
                            <button
                                type="submit"
                                disabled={showResult === 'correct'}
                                className="flex-[2] flex items-center justify-center gap-2 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                                SOLVE
                            </button>
                        </div>
                    </form>
                </div>

                {gameState === 'gameOver' && (
                    <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-8 text-center z-30 animate-in fade-in zoom-in duration-500">
                        <Trophy className="w-16 h-16 text-yellow-500 mb-6" />
                        <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">SET COMPLETE!</h2>
                        <p className="text-slate-400 mb-8 max-w-xs font-medium">You reached a total score of <span className="text-white font-black">{score}</span> XP. Amazing work!</p>
                        <button
                            onClick={onExit}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-12 py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 w-full active:scale-95 uppercase tracking-widest"
                        >
                            FINISH SESSION
                        </button>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 text-slate-600 font-medium opacity-50">
                <Sparkles className="w-4 h-4" />
                <p className="text-[10px] uppercase tracking-[0.3em]">Master your vocabulary through scramble</p>
            </div>
        </div>
    );
}
