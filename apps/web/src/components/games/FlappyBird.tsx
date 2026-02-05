'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Trophy, ArrowLeft, Bird, Play, Pause, Zap, Cloud, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/contexts/AuthContext';

interface Term { id: string; term: string; definition: string; }

interface FlappyBirdGameProps {
    onExit: () => void;
    terms?: Term[];
    focusMode?: boolean;
}

const GRAVITY = 0.6;
const JUMP = -8;
const PIPE_WIDTH = 60;
const PIPE_GAP = 160;
const PIPE_SPEED = 3.5;
const GAME_HEIGHT = 500;
const GAME_WIDTH = 400;

export default function FlappyBird({ onExit, terms = [], focusMode }: FlappyBirdGameProps) {
    const { updateXP } = useAuth();
    const [birdPos, setBirdPos] = useState(250);
    const [birdVel, setBirdVel] = useState(0);
    const [birdRot, setBirdRot] = useState(0);
    const [pipes, setPipes] = useState<{ x: number; height: number; id: string }[]>([]);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isShielded, setIsShielded] = useState(false);

    // Quiz state
    const [showQuiz, setShowQuiz] = useState(false);
    const [currentTerm, setCurrentTerm] = useState<Term | null>(null);
    const [options, setOptions] = useState<string[]>([]);

    const requestRef = useRef<number>();
    const lastTimeRef = useRef<number>();

    useEffect(() => {
        const saved = localStorage.getItem('flappy_highscore');
        if (saved) setHighScore(parseInt(saved));
    }, []);

    const spawnPipe = useCallback(() => {
        const height = Math.floor(Math.random() * (GAME_HEIGHT - PIPE_GAP - 100)) + 50;
        return { x: GAME_WIDTH, height, id: Math.random().toString() };
    }, []);

    const handleGameOver = () => {
        if (isShielded) {
            setIsShielded(false);
            return;
        }
        setIsPlaying(false);
        setGameOver(true);

        // Award XP
        if (score > 0) {
            const xpAmount = Math.min(score * 2, 50); // Max 50 XP per run
            updateXP(xpAmount, `Flappy Bird - Score: ${score}`);
        }

        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('flappy_highscore', String(score));
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
    };

    const triggerQuiz = () => {
        if (terms.length < 4) return;
        const randomTerm = terms[Math.floor(Math.random() * terms.length)];
        const wrongOptions = terms
            .filter(t => t.id !== randomTerm.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(t => t.definition);

        setCurrentTerm(randomTerm);
        setOptions([randomTerm.definition, ...wrongOptions].sort(() => Math.random() - 0.5));
        setShowQuiz(true);
    };

    const handleAnswer = (answer: string) => {
        if (answer === currentTerm?.definition) {
            setIsShielded(true);
            confetti({ particleCount: 50, spread: 30 });
        }
        setShowQuiz(false);
    };

    const update = useCallback((time: number) => {
        if (!isPlaying || gameOver || showQuiz) return;

        setBirdVel(v => v + GRAVITY);
        setBirdPos(pos => {
            const newPos = pos + birdVel;
            if (newPos < 0 || newPos > GAME_HEIGHT) {
                handleGameOver();
                return pos;
            }
            return newPos;
        });

        // Rotation logic
        setBirdRot(Math.min(90, Math.max(-25, birdVel * 3)));

        setPipes(prevPipes => {
            const newPipes = prevPipes
                .map(pipe => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
                .filter(pipe => pipe.x > -PIPE_WIDTH);

            if (newPipes.length === 0 || newPipes[newPipes.length - 1].x < GAME_WIDTH - 200) {
                newPipes.push(spawnPipe());
            }

            // Check collision
            for (const pipe of newPipes) {
                if (
                    pipe.x < 100 && pipe.x + PIPE_WIDTH > 50 &&
                    (birdPos < pipe.height || birdPos > pipe.height + PIPE_GAP)
                ) {
                    handleGameOver();
                }

                // Scoring
                if (pipe.x + PIPE_SPEED >= 50 && pipe.x < 50) {
                    setScore(s => s + 1);
                    if (score > 0 && score % 10 === 0 && terms.length >= 4 && !isShielded) triggerQuiz();
                }
            }

            return newPipes;
        });

        requestRef.current = requestAnimationFrame(update);
    }, [isPlaying, gameOver, birdVel, birdPos, spawnPipe, score, terms, isShielded, showQuiz]);

    useEffect(() => {
        if (isPlaying) requestRef.current = requestAnimationFrame(update);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, update]);

    const jump = () => {
        if (gameOver) resetGame();
        else if (!isPlaying) setIsPlaying(true);
        else {
            setBirdVel(JUMP);
        }
    };

    const resetGame = () => {
        setBirdPos(250);
        setBirdVel(0);
        setBirdRot(0);
        setPipes([]);
        setScore(0);
        setGameOver(false);
        setIsPlaying(true);
        setIsShielded(false);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === ' ' || e.key === 'ArrowUp') jump();
            if (e.key === 'p') setIsPlaying(p => !p);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, gameOver]);

    return (
        <div className="flex flex-col items-center p-4 w-full max-w-2xl mx-auto select-none">
            <div className="w-full flex justify-between items-center mb-6 bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-xl">
                <div className="flex gap-8">
                    <div className="text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Score</p>
                        <p className="text-3xl font-black text-white">{score}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Best</p>
                        <p className="text-3xl font-black text-emerald-400">{highScore}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isShielded && (
                        <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/50 animate-pulse">
                            <Zap className="w-5 h-5 text-blue-400" />
                        </div>
                    )}
                    <button onClick={onExit} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5">
                        <ArrowLeft className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
            </div>

            <div
                onClick={jump}
                className="relative bg-gradient-to-b from-blue-400 to-blue-600 border-4 border-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl w-full cursor-pointer touch-none shadow-blue-500/10"
                style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
            >
                {/* Background Decorations */}
                <div className="absolute inset-0 flex items-center justify-around opacity-20">
                    <Cloud className="w-24 h-24 text-white animate-pulse" />
                    <Cloud className="w-16 h-16 text-white animate-bounce" style={{ animationDuration: '4s' }} />
                </div>

                {/* Pipes */}
                {pipes.map(pipe => (
                    <div key={pipe.id}>
                        {/* Top Pipe */}
                        <div
                            className="absolute bg-gradient-to-b from-emerald-600 to-emerald-400 border-x-4 border-b-4 border-slate-900 rounded-b-2xl shadow-xl"
                            style={{ left: pipe.x, top: 0, width: PIPE_WIDTH, height: pipe.height }}
                        >
                            <div className="absolute bottom-4 left-2 right-2 h-4 bg-black/10 rounded-full" />
                        </div>
                        {/* Bottom Pipe */}
                        <div
                            className="absolute bg-gradient-to-t from-emerald-600 to-emerald-400 border-x-4 border-t-4 border-slate-900 rounded-t-2xl shadow-xl"
                            style={{ left: pipe.x, top: pipe.height + PIPE_GAP, width: PIPE_WIDTH, height: GAME_HEIGHT - pipe.height - PIPE_GAP }}
                        >
                            <div className="absolute top-4 left-2 right-2 h-4 bg-black/10 rounded-full" />
                        </div>
                    </div>
                ))}

                {/* Bird */}
                <div
                    className={`absolute rounded-2xl transition-transform duration-75 flex items-center justify-center p-1 ${isShielded ? 'bg-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.6)]' : 'bg-yellow-400 shadow-xl'
                        }`}
                    style={{
                        left: 50, top: birdPos, width: 40, height: 40,
                        transform: `rotate(${birdRot}deg)`,
                        zIndex: 10
                    }}
                >
                    <Bird className={`w-full h-full ${isShielded ? 'text-white' : 'text-slate-900'}`} fill="currentColor" />
                    {isShielded && <div className="absolute -inset-2 border-2 border-blue-400 rounded-full animate-ping opacity-20" />}
                </div>

                {/* Overlays */}
                {!isPlaying && !gameOver && !showQuiz && (
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex flex-col items-center justify-center text-white z-20">
                        <div className="bg-white/10 p-8 rounded-full border border-white/20 animate-bounce">
                            <Play className="w-16 h-16 fill-current" />
                        </div>
                        <p className="mt-6 text-sm font-black uppercase tracking-[0.5em] animate-pulse">Tap to Start</p>
                    </div>
                )}

                {gameOver && (
                    <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300 z-50">
                        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
                            <X className="w-10 h-10 text-rose-500" />
                        </div>
                        <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">CRASHED!</h2>
                        <p className="text-slate-400 mb-8 font-medium">You scored {score} points. Spread your wings again!</p>
                        <button onClick={resetGame} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-12 py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/30 w-full uppercase tracking-widest active:scale-95">
                            RELAUNCH
                        </button>
                    </div>
                )}
            </div>

            {/* Quiz Modal */}
            {showQuiz && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-slate-800 p-8 max-w-sm w-full rounded-[2.5rem] border border-white/10 shadow-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-blue-500/10 rounded-2xl">
                                <Zap className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight uppercase">Air Drop!</h3>
                                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Answer correctly for a shield</p>
                            </div>
                        </div>

                        <p className="text-2xl font-bold text-white mb-8 text-center">{currentTerm?.term}</p>

                        <div className="grid gap-3">
                            {options.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(opt)}
                                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10 text-sm font-bold transition-all text-left"
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-8 flex items-center gap-6 text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">
                <div className="flex items-center gap-2">Space • Jump</div>
                <div className="w-1 h-1 rounded-full bg-slate-700" />
                <div className="flex items-center gap-2">P • Pause</div>
            </div>
        </div>
    );
}
