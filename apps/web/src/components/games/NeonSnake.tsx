'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Trophy, Gamepad2, Play, Pause, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/contexts/AuthContext';

interface SnakeGameProps {
    onExit?: () => void;
    terms?: any[];
    focusMode?: boolean;
}

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const MIN_SPEED = 60;

type Point = {
    x: number;
    y: number;
};

export default function NeonSnake({ onExit, terms, focusMode }: SnakeGameProps) {
    const { updateXP } = useAuth();
    const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
    const [food, setFood] = useState<Point>({ x: 5, y: 5 });
    const [direction, setDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('RIGHT');
    const [isPaused, setIsPaused] = useState(true);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [speed, setSpeed] = useState(INITIAL_SPEED);

    const gameLoopRef = useRef<NodeJS.Timeout>();
    const lastDirectionRef = useRef(direction);

    const generateFood = useCallback((currentSnake: Point[]) => {
        let newFood;
        while (true) {
            newFood = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            };
            const onSnake = currentSnake.some(p => p.x === newFood!.x && p.y === newFood!.y);
            if (!onSnake) break;
        }
        return newFood;
    }, []);

    const resetGame = () => {
        setSnake([{ x: 10, y: 10 }]);
        setFood({ x: 5, y: 5 });
        setDirection('RIGHT');
        lastDirectionRef.current = 'RIGHT';
        setScore(0);
        setGameOver(false);
        setIsPaused(true);
        setSpeed(INITIAL_SPEED);
    };

    const handleGameOver = () => {
        setGameOver(true);
        setIsPaused(true);
        
        // Award XP based on score
        if (score > 0) {
            const xpAmount = Math.min(Math.floor(score / 2), 50); // Max 50 XP per run
            updateXP(xpAmount, `Neon Snake - Score: ${score}`);
        }

        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('snake_highscore', String(score));
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
    };

    const moveSnake = useCallback(() => {
        if (isPaused || gameOver) return;

        setSnake(prevSnake => {
            const head = prevSnake[0];
            const newHead = { ...head };

            switch (direction) {
                case 'UP': newHead.y -= 1; break;
                case 'DOWN': newHead.y += 1; break;
                case 'LEFT': newHead.x -= 1; break;
                case 'RIGHT': newHead.x += 1; break;
            }

            // Bound check
            if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
                handleGameOver();
                return prevSnake;
            }

            // Self collision check
            if (prevSnake.some(p => p.x === newHead.x && p.y === newHead.y)) {
                handleGameOver();
                return prevSnake;
            }

            const newSnake = [newHead, ...prevSnake];

            // Food check
            if (newHead.x === food.x && newHead.y === food.y) {
                setScore(s => s + 10);
                setFood(generateFood(newSnake));
                setSpeed(s => Math.max(MIN_SPEED, s - 2));
            } else {
                newSnake.pop();
            }

            lastDirectionRef.current = direction;
            return newSnake;
        });
    }, [direction, food, isPaused, gameOver, generateFood]);

    useEffect(() => {
        gameLoopRef.current = setInterval(moveSnake, speed);
        return () => clearInterval(gameLoopRef.current);
    }, [moveSnake, speed]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp' && lastDirectionRef.current !== 'DOWN') setDirection('UP');
            if (e.key === 'ArrowDown' && lastDirectionRef.current !== 'UP') setDirection('DOWN');
            if (e.key === 'ArrowLeft' && lastDirectionRef.current !== 'RIGHT') setDirection('LEFT');
            if (e.key === 'ArrowRight' && lastDirectionRef.current !== 'LEFT') setDirection('RIGHT');
            if (e.key === ' ') setIsPaused(p => !p);
        };
        window.addEventListener('keydown', handleKeyDown);
        const saved = localStorage.getItem('snake_highscore');
        if (saved) setHighScore(parseInt(saved));
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="flex flex-col items-center p-6 w-full max-w-md mx-auto">
            <div className="w-full flex justify-between items-center mb-6">
                <div className="flex gap-4">
                    <div className="text-center bg-slate-800/50 p-3 rounded-2xl min-w-[70px] border border-white/5">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Score</p>
                        <p className="text-xl font-bold text-white">{score}</p>
                    </div>
                    <div className="text-center bg-slate-800/50 p-3 rounded-2xl min-w-[70px] border border-white/5">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Best</p>
                        <p className="text-xl font-bold text-emerald-400">{highScore}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        disabled={gameOver}
                        className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all border border-white/5 disabled:opacity-50"
                    >
                        {isPaused ? <Play className="w-5 h-5 text-emerald-400 fill-current" /> : <Pause className="w-5 h-5 text-white" />}
                    </button>
                    <button
                        onClick={resetGame}
                        className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all border border-white/5"
                    >
                        <RefreshCw className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>

            <div
                className="relative bg-slate-900 border-4 border-slate-800 rounded-2xl shadow-2xl overflow-hidden shadow-emerald-500/5"
                style={{
                    width: '100%',
                    aspectRatio: '1',
                    display: 'grid',
                    gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                    gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
                }}
            >
                {/* Background Grid Lines */}
                <div className="absolute inset-0 grid pointer-events-none opacity-[0.03]"
                    style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
                    {Array.from({ length: GRID_SIZE }).map((_, i) => (
                        <div key={i} className="border-r border-white" />
                    ))}
                </div>
                <div className="absolute inset-0 grid pointer-events-none opacity-[0.03]"
                    style={{ gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` }}>
                    {Array.from({ length: GRID_SIZE }).map((_, i) => (
                        <div key={i} className="border-b border-white" />
                    ))}
                </div>

                {/* Food */}
                <div
                    className="absolute bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse"
                    style={{
                        width: `${100 / GRID_SIZE}%`,
                        height: `${100 / GRID_SIZE}%`,
                        left: `${(food.x / GRID_SIZE) * 100}%`,
                        top: `${(food.y / GRID_SIZE) * 100}%`,
                        transition: 'all 0.1s ease-out'
                    }}
                />

                {/* Snake */}
                {snake.map((segment, i) => (
                    <div
                        key={i}
                        className={`absolute rounded-sm transition-all duration-100 ${i === 0 ? 'bg-emerald-400 z-10 scale-110 shadow-[0_0_15px_rgba(52,211,153,0.4)]' : 'bg-emerald-600/80 shadow-inner'
                            }`}
                        style={{
                            width: `${100 / GRID_SIZE}%`,
                            height: `${100 / GRID_SIZE}%`,
                            left: `${(segment.x / GRID_SIZE) * 100}%`,
                            top: `${(segment.y / GRID_SIZE) * 100}%`,
                            transform: `scale(${1 - (i / snake.length) * 0.3})`,
                            borderRadius: i === 0 ? '4px' : '2px'
                        }}
                    >
                        {/* Eyes for head */}
                        {i === 0 && (
                            <div className="relative w-full h-full">
                                <div className={`absolute w-1 h-1 bg-slate-900 rounded-full ${direction === 'UP' || direction === 'DOWN' ? 'top-1 left-1' : 'left-3 top-1'
                                    }`} />
                                <div className={`absolute w-1 h-1 bg-slate-900 rounded-full ${direction === 'UP' || direction === 'DOWN' ? 'top-1 right-1' : 'left-3 bottom-1'
                                    }`} />
                            </div>
                        )}
                    </div>
                ))}

                {/* Overlays */}
                {gameOver && (
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300 z-20">
                        <div className="mb-4 p-4 bg-red-500/10 rounded-full">
                            <Gamepad2 className="w-12 h-12 text-red-500" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">GAME OVER</h2>
                        <p className="text-slate-400 mb-6 font-medium">Final Score: <span className="text-white font-bold">{score}</span></p>
                        <button
                            onClick={resetGame}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-2xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20 w-full"
                        >
                            TRY AGAIN
                        </button>
                    </div>
                )}

                {isPaused && !gameOver && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center cursor-pointer z-20" onClick={() => setIsPaused(false)}>
                        <div className="bg-slate-800/80 p-6 rounded-3xl border border-white/10 shadow-2xl animate-bounce">
                            <Play className="w-12 h-12 text-white fill-current" />
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Controls</p>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                        Use <span className="text-emerald-400">Arrow Keys</span> to turn. <span className="text-emerald-400">Space</span> to pause.
                    </p>
                </div>
                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Speed</p>
                    <p className="text-xs text-slate-300 font-medium">
                        Snake gets faster as you eat!
                    </p>
                </div>
            </div>
        </div>
    );
}
