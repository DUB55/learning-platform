'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Trophy, Heart, Zap } from 'lucide-react';

interface Term {
    id: string;
    term: string;
    definition: string;
}

interface MeteorGameProps {
    onExit: () => void;
    terms: Term[];
    answerMode: 'term' | 'definition' | 'mixed';
}

interface Meteor {
    id: string;
    termId: string;
    text: string;
    x: number;
    y: number;
    speed: number;
    color: string;
    scale: number;
}

export default function MeteorGame({ onExit, terms, answerMode }: MeteorGameProps) {
    const [meteors, setMeteors] = useState<Meteor[]>([]);
    const [input, setInput] = useState('');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(5);
    const [gameOver, setGameOver] = useState(false);
    const [level, setLevel] = useState(1);
    const [streak, setStreak] = useState(0);

    const gameLoopRef = useRef<number>();
    const containerRef = useRef<HTMLDivElement>(null);
    const lastSpawnTime = useRef(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter valid terms (non-empty)
    const validTerms = terms.filter(t => t.term && t.definition);

    const spawnMeteor = useCallback(() => {
        if (validTerms.length === 0) return;
        const term = validTerms[Math.floor(Math.random() * validTerms.length)];

        // Determine Question/Answer based on mode
        let question = term.definition; // Default: Show def, type term
        if (answerMode === 'term') question = term.definition; // Show Def, Answer Term
        else if (answerMode === 'definition') question = term.term; // Show Term, Answer Def
        else if (answerMode === 'mixed') {
            question = Math.random() > 0.5 ? term.term : term.definition;
        }

        // Color based on difficulty (length)
        const difficulty = question.length > 10 ? 'red' : question.length > 5 ? 'orange' : 'yellow';
        const colorClass = difficulty === 'red' ? 'from-red-500 to-orange-600' :
            difficulty === 'orange' ? 'from-orange-400 to-yellow-500' :
                'from-blue-400 to-purple-500';

        const newMeteor: Meteor = {
            id: Math.random().toString(),
            termId: term.id,
            text: question,
            x: Math.random() * 80 + 10, // 10% to 90% width
            y: -10,
            speed: 0.2 + (level * 0.05),
            color: colorClass,
            scale: 1
        };

        setMeteors(prev => [...prev, newMeteor]);
    }, [validTerms, answerMode, level]);

    const updateGame = useCallback(() => {
        if (gameOver) return;

        setMeteors(prev => {
            const nextMeteors = prev.map(m => ({
                ...m,
                y: m.y + m.speed
            }));

            // Check collisions with bottom
            const missed = nextMeteors.filter(m => m.y > 90);
            if (missed.length > 0) {
                setLives(l => Math.max(0, l - missed.length));
                setStreak(0);
                // Shake screen?
            }

            // Remove off-screen
            return nextMeteors.filter(m => m.y <= 90);
        });

        // Spawn logic
        const now = Date.now();
        const spawnRate = Math.max(1000, 4000 - (level * 200));
        if (now - lastSpawnTime.current > spawnRate) {
            spawnMeteor();
            lastSpawnTime.current = now;
        }

        gameLoopRef.current = requestAnimationFrame(updateGame);
    }, [gameOver, level, spawnMeteor]);

    useEffect(() => {
        if (lives <= 0) {
            setGameOver(true);
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        }
    }, [lives]);

    useEffect(() => {
        lastSpawnTime.current = Date.now();
        gameLoopRef.current = requestAnimationFrame(updateGame);
        inputRef.current?.focus();
        return () => {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        };
    }, [updateGame]);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInput(val);

        // Check matching
        const match = meteors.find(m => {
            // Find the original term
            const termObj = validTerms.find(t => t.id === m.termId);
            if (!termObj) return false;

            // Determine correct answer based on what's displayed
            // If displayed is term.term, answer is term.definition
            // If displayed is term.definition, answer is term.term
            let correctAnswer = '';
            if (m.text === termObj.term) correctAnswer = termObj.definition;
            else correctAnswer = termObj.term;

            return correctAnswer.toLowerCase().trim() === val.toLowerCase().trim();
        });

        if (match) {
            // Destruction!
            setMeteors(prev => prev.filter(p => p.id !== match.id));
            setScore(s => s + 100 + (streak * 10));
            setStreak(s => s + 1);
            setInput('');
            if (score > 0 && score % 500 === 0) setLevel(l => l + 1);

            // Visual feedback could go here
        }
    };

    const restart = () => {
        setMeteors([]);
        setScore(0);
        setLives(5);
        setLevel(1);
        setStreak(0);
        setGameOver(false);
        setInput('');
        lastSpawnTime.current = Date.now();
        gameLoopRef.current = requestAnimationFrame(updateGame);
        inputRef.current?.focus();
    };

    return (
        <div className="fixed inset-0 bg-[#0f172a] z-50 flex flex-col overflow-hidden">
            {/* HUD */}
            <div className="p-4 flex justify-between items-center bg-slate-900/50 backdrop-blur border-b border-white/10 z-10">
                <button onClick={onExit} className="flex items-center gap-2 text-slate-400 hover:text-white">
                    <ArrowLeft className="w-5 h-5" /> Exit
                </button>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        <span className="font-bold text-white text-xl">{score}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                        <span className="font-bold text-white text-xl">{lives}</span>
                    </div>
                </div>
            </div>

            {/* Game Area */}
            <div ref={containerRef} className="flex-1 relative bg-[url('/space-bg.jpg')] bg-cover">
                {/* Meteors */}
                {meteors.map(meteor => (
                    <div
                        key={meteor.id}
                        className="absolute transform -translate-x-1/2 transition-transform duration-100 will-change-transform"
                        style={{
                            left: `${meteor.x}%`,
                            top: `${meteor.y}%`,
                        }}
                    >
                        <div className={`
                            relative px-4 py-2 rounded-full border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.2)]
                            bg-gradient-to-r ${meteor.color} text-white font-bold whitespace-nowrap
                        `}>
                            {meteor.text}
                            {/* Tail effect */}
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gradient-to-t from-white/50 to-transparent" />
                        </div>
                    </div>
                ))}

                {/* Input Zone */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-xl px-4">
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={handleInput}
                            placeholder="Type the answer..."
                            className="w-full bg-slate-900/80 backdrop-blur border-2 border-blue-500/50 rounded-full py-4 px-8 text-center text-xl text-white focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 shadow-xl"
                            autoFocus
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            {streak > 1 && <span className="text-yellow-400 font-bold animate-bounce block">{streak}x Streak!</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Game Over Modal */}
            {gameOver && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-slate-900 p-8 rounded-2xl border border-white/10 text-center max-w-sm w-full mx-4">
                        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>
                        <p className="text-slate-400 mb-6">Final Score: {score}</p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={restart}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-5 h-5" /> Play Again
                            </button>
                            <button
                                onClick={onExit}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-medium"
                            >
                                Exit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
