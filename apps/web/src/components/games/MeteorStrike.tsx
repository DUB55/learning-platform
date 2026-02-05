'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Trophy, ArrowLeft, Target, Shield, Zap, Sparkles, X, Check, Rocket } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/contexts/AuthContext';

interface Term { id: string; term: string; definition: string; }

interface MeteorGameProps {
    onExit: () => void;
    terms?: Term[];
    focusMode?: boolean;
}

const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const METEOR_SPEED_BASE = 1.5;

type Meteor = {
    id: string;
    x: number;
    y: number;
    speed: number;
    term: Term;
    radius: number;
};

export default function MeteorStrike({ onExit, terms = [], focusMode }: MeteorGameProps) {
    const { updateXP } = useAuth();
    const [meteors, setMeteors] = useState<Meteor[]>([]);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [health, setHealth] = useState(3);
    const [gameOver, setGameOver] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const requestRef = useRef<number>();
    const lastSpawnRef = useRef<number>(0);

    useEffect(() => {
        const saved = localStorage.getItem('meteor_highscore');
        if (saved) setHighScore(parseInt(saved));
    }, []);

    const spawnMeteor = useCallback(() => {
        if (terms.length === 0) return;
        const term = terms[Math.floor(Math.random() * terms.length)];
        const newMeteor: Meteor = {
            id: Math.random().toString(),
            x: Math.random() * (GAME_WIDTH - 100) + 50,
            y: -50,
            speed: METEOR_SPEED_BASE + (score / 1000),
            radius: 40,
            term
        };
        setMeteors(prev => [...prev, newMeteor]);
    }, [terms, score]);

    const update = useCallback((time: number) => {
        if (!isPlaying || gameOver) return;

        if (time - lastSpawnRef.current > 3000 - Math.min(1500, score / 10)) {
            spawnMeteor();
            lastSpawnRef.current = time;
        }

        setMeteors(prev => {
            const next = prev.map(m => ({ ...m, y: m.y + m.speed }));

            // Check for ground impact
            const hits = next.filter(m => m.y > GAME_HEIGHT - 30);
            if (hits.length > 0) {
                setHealth(h => {
                    const nextH = h - hits.length;
                    if (nextH <= 0) {
                        setGameOver(true);
                        setIsPlaying(false);
                        
                        // Award XP
                        if (score > 0) {
                            const xpAmount = Math.min(Math.floor(score / 20), 50);
                            updateXP(xpAmount, `Meteor Strike - Score: ${score}`);
                        }

                        if (score > highScore) {
                            setHighScore(score);
                            localStorage.setItem('meteor_highscore', String(score));
                            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                        }
                    }
                    return nextH;
                });
            }

            return next.filter(m => m.y <= GAME_HEIGHT - 30);
        });

        requestRef.current = requestAnimationFrame(update);
    }, [isPlaying, gameOver, spawnMeteor, score, highScore]);

    useEffect(() => {
        if (isPlaying) requestRef.current = requestAnimationFrame(update);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, update]);

    const handleInput = (e: React.FormEvent) => {
        e.preventDefault();
        const input = inputValue.trim().toLowerCase();

        const targetMeteor = meteors.find(m =>
            m.term.term.toLowerCase() === input ||
            m.term.definition.toLowerCase() === input
        );

        if (targetMeteor) {
            setMeteors(prev => prev.filter(m => m.id !== targetMeteor.id));
            setScore(s => s + 100);
            setInputValue('');
            confetti({
                particleCount: 20,
                spread: 30,
                origin: { x: targetMeteor.x / GAME_WIDTH, y: targetMeteor.y / GAME_HEIGHT }
            });
        }
    };

    const resetGame = () => {
        setMeteors([]);
        setScore(0);
        setHealth(3);
        setGameOver(false);
        setIsPlaying(true);
        setInputValue('');
        lastSpawnRef.current = performance.now();
    };

    return (
        <div className="flex flex-col items-center p-4 w-full max-w-4xl mx-auto">
            {/* Stats Header */}
            <div className="w-full flex justify-between items-center mb-8 bg-white/5 p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
                <div className="flex gap-10">
                    <div className="text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Defense Score</p>
                        <p className="text-3xl font-black text-white">{score}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Max Stability</p>
                        <p className="text-3xl font-black text-emerald-400">{highScore}</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex gap-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Shield key={i} className={`w-8 h-8 ${i < health ? 'text-blue-400 fill-blue-400/20' : 'text-slate-800'}`} />
                        ))}
                    </div>
                    <button onClick={onExit} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
            </div>

            {/* Game Screen */}
            <div
                className="relative bg-slate-950 border-4 border-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl w-full max-w-[600px] aspect-[3/2] shadow-blue-500/5 mb-8"
            >
                {/* Space Background */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse" />
                    <div className="absolute top-1/2 left-3/4 w-1 h-1 bg-white rounded-full animate-pulse delay-700" />
                    <div className="absolute top-3/4 left-1/2 w-1 h-1 bg-white rounded-full animate-pulse delay-500" />
                    <div className="absolute top-1/3 left-2/3 w-1 h-1 bg-white rounded-full animate-pulse delay-300" />
                </div>

                {/* Meteors */}
                {meteors.map(m => (
                    <div
                        key={m.id}
                        className="absolute flex flex-col items-center justify-center transition-all duration-100"
                        style={{ left: m.x - m.radius, top: m.y - m.radius, width: m.radius * 2 }}
                    >
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-900 rounded-full border-2 border-slate-500 shadow-[0_0_20px_rgba(100,116,139,0.5)] flex items-center justify-center relative">
                            <Target className="w-6 h-6 text-red-500/40" />
                            {/* Fire Trail */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-4 h-12 bg-gradient-to-t from-orange-500/40 to-transparent blur-sm" />
                        </div>
                        <div className="mt-2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-xs font-bold text-white whitespace-nowrap shadow-xl">
                            {m.term.term}
                        </div>
                    </div>
                ))}

                {/* Defense Base */}
                <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-blue-900/40 to-transparent border-t border-blue-500/20" />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                    <Rocket className={`w-10 h-10 ${health > 1 ? 'text-blue-500' : 'text-red-500'} animate-bounce`} />
                </div>

                {/* Overlays */}
                {!isPlaying && !gameOver && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center z-40">
                        <div className="p-6 bg-blue-500/10 rounded-full mb-6">
                            <Target className="w-16 h-16 text-blue-500" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Planetary Defense</h2>
                        <p className="text-slate-400 mb-8 max-w-xs">Type the translation or definition to destroy incoming meteors before they hit the base.</p>
                        <button onClick={resetGame} className="bg-blue-600 hover:bg-blue-500 text-white font-black px-12 py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/30 w-full active:scale-95">
                            STRIKE BACK
                        </button>
                    </div>
                )}

                {gameOver && (
                    <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-8 text-center z-50 animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
                            <X className="w-10 h-10 text-rose-500" />
                        </div>
                        <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">BASE DESTROYED!</h2>
                        <p className="text-slate-400 mb-8 font-medium">Final score: {score}. The planet falls...</p>
                        <button onClick={resetGame} className="bg-red-600 hover:bg-red-500 text-white font-black px-12 py-4 rounded-2xl transition-all shadow-xl shadow-red-500/30 w-full uppercase tracking-widest active:scale-95">
                            RETRY DEFENSE
                        </button>
                    </div>
                )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleInput} className="w-full max-w-[600px] flex gap-4">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type definition to destroy..."
                    className="flex-1 bg-white/5 border-2 border-white/5 px-6 py-4 rounded-2xl text-white font-bold placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-white/10 outline-none transition-all"
                    autoFocus
                    disabled={!isPlaying || gameOver}
                />
                <button
                    type="submit"
                    className="px-8 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    disabled={!isPlaying || gameOver}
                >
                    FIRE
                </button>
            </form>

            <div className="mt-8 flex items-center gap-2 text-slate-600 font-medium opacity-50">
                <Sparkles className="w-4 h-4" />
                <p className="text-[10px] uppercase tracking-[0.3em]">Quick typing saves civilizations</p>
            </div>
        </div>
    );
}
