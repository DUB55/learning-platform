'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Trophy, ArrowLeft, GhostIcon, Car, TreePine, Waves, Star, Play, Pause, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/contexts/AuthContext';

interface Term { id: string; term: string; definition: string; }

interface CrossyRoadGameProps {
    onExit: () => void;
    terms?: Term[];
    focusMode?: boolean;
}

const GRID_ROWS = 12;
const GRID_COLS = 9;
const TICK_RATE = 100;

type LaneType = 'road' | 'river' | 'grass';
type Lane = {
    type: LaneType;
    speed: number;
    direction: 1 | -1;
    objects: { pos: number; width: number; id: string; type: 'car' | 'log' | 'truck' }[];
};

export default function CrossyRoad({ onExit, terms = [], focusMode }: CrossyRoadGameProps) {
    const { updateXP } = useAuth();
    const [lanes, setLanes] = useState<Lane[]>([]);
    const [player, setPlayer] = useState({ x: 4, y: GRID_ROWS - 1 });
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [isPaused, setIsPaused] = useState(true);
    const [distance, setDistance] = useState(0);

    // Quiz state for "Safe Zones"
    const [showQuiz, setShowQuiz] = useState(false);
    const [currentTerm, setCurrentTerm] = useState<Term | null>(null);
    const [options, setOptions] = useState<string[]>([]);
    const [isShielded, setIsShielded] = useState(false);

    const initLanes = useCallback(() => {
        const newLanes: Lane[] = [];
        for (let i = 0; i < GRID_ROWS; i++) {
            if (i === 0 || i === GRID_ROWS - 1 || i % 4 === 0) {
                newLanes.push({ type: 'grass', speed: 0, direction: 1, objects: [] });
            } else if (i % 2 === 0) {
                const speed = Math.random() * 0.2 + 0.1;
                newLanes.push({
                    type: 'river', speed, direction: Math.random() > 0.5 ? 1 : -1,
                    objects: [
                        { pos: 1, width: 2, id: 'l1', type: 'log' },
                        { pos: 5, width: 3, id: 'l2', type: 'log' }
                    ]
                });
            } else {
                const speed = Math.random() * 0.3 + 0.2;
                newLanes.push({
                    type: 'road', speed, direction: Math.random() > 0.5 ? 1 : -1,
                    objects: [
                        { pos: 1, width: 1, id: 'c1', type: Math.random() > 0.3 ? 'car' : 'truck' },
                        { pos: 6, width: 1, id: 'c2', type: 'car' }
                    ]
                });
            }
        }
        setLanes(newLanes);
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem('crossy_highscore');
        if (saved) setHighScore(parseInt(saved));
        initLanes();
    }, [initLanes]);

    const handleGameOver = () => {
        if (isShielded) {
            setIsShielded(false);
            return;
        }
        setGameOver(true);
        setIsPaused(true);

        // Award XP
        if (distance > 0) {
            const xpAmount = Math.min(distance * 2, 50);
            updateXP(xpAmount, `Crossy Road - Distance: ${distance}`);
        }

        if (distance > highScore) {
            setHighScore(distance);
            localStorage.setItem('crossy_highscore', String(distance));
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
    };

    const updateLanes = useCallback(() => {
        if (isPaused || gameOver || showQuiz) return;

        setLanes(prevLanes => prevLanes.map(lane => {
            if (lane.type === 'grass') return lane;
            const newObjects = lane.objects.map(obj => {
                let newPos = obj.pos + (lane.speed * lane.direction);
                if (newPos > GRID_COLS) newPos = -obj.width;
                if (newPos < -obj.width) newPos = GRID_COLS;
                return { ...obj, pos: newPos };
            });
            return { ...lane, objects: newObjects };
        }));

        // Check platform movement (if player on log)
        const currentLane = lanes[player.y];
        if (currentLane?.type === 'river') {
            const platform = currentLane.objects.find(obj =>
                player.x >= obj.pos && player.x < obj.pos + obj.width
            );
            if (platform) {
                const newX = player.x + (currentLane.speed * currentLane.direction);
                if (newX < 0 || newX >= GRID_COLS) handleGameOver();
                else setPlayer(p => ({ ...p, x: newX }));
            } else {
                handleGameOver();
            }
        }

        // Check collisions (road)
        if (currentLane?.type === 'road') {
            const hit = currentLane.objects.some(obj =>
                player.x >= obj.pos - 0.5 && player.x < obj.pos + obj.width - 0.5
            );
            if (hit) handleGameOver();
        }
    }, [isPaused, gameOver, showQuiz, player, lanes]);

    useEffect(() => {
        const timer = setInterval(updateLanes, TICK_RATE);
        return () => clearInterval(timer);
    }, [updateLanes]);

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
            confetti({ particleCount: 30, spread: 30 });
        }
        setShowQuiz(false);
    };

    const movePlayer = (dx: number, dy: number) => {
        if (isPaused || gameOver || showQuiz) return;

        setPlayer(prev => {
            const newX = Math.max(0, Math.min(GRID_COLS - 1, prev.x + dx));
            const newY = Math.max(0, Math.min(GRID_ROWS - 1, prev.y + dy));

            if (newY < prev.y) {
                setDistance(d => Math.max(d, (GRID_ROWS - 1) - newY));
                if (Math.random() < 0.1 && terms.length >= 4 && !isShielded) triggerQuiz();
            }

            return { x: newX, y: newY };
        });
    };

    const resetGame = () => {
        setPlayer({ x: 4, y: GRID_ROWS - 1 });
        setDistance(0);
        setGameOver(false);
        setIsPaused(false);
        setIsShielded(false);
        initLanes();
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp') movePlayer(0, -1);
            if (e.key === 'ArrowDown') movePlayer(0, 1);
            if (e.key === 'ArrowLeft') movePlayer(-1, 0);
            if (e.key === 'ArrowRight') movePlayer(1, 0);
            if (e.key === ' ') setIsPaused(p => !p);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPaused, gameOver, showQuiz]);

    return (
        <div className="flex flex-col items-center p-4 w-full max-w-2xl mx-auto">
            <div className="w-full flex justify-between items-center mb-6 bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-xl">
                <div className="flex gap-6">
                    <div className="text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Traveled</p>
                        <p className="text-2xl font-black text-white">{distance}m</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Record</p>
                        <p className="text-2xl font-black text-yellow-500">{highScore}m</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isShielded && (
                        <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/50 animate-pulse">
                            <Zap className="w-5 h-5 text-emerald-400" />
                        </div>
                    )}
                    <button onClick={resetGame} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5">
                        <RefreshCw className="w-5 h-5 text-slate-400" />
                    </button>
                    <button onClick={() => setIsPaused(!isPaused)} className="p-3 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-500/20">
                        {isPaused ? <Play className="w-5 h-5 text-white" /> : <Pause className="w-5 h-5 text-white" />}
                    </button>
                </div>
            </div>

            <div className="relative bg-slate-950 border-4 border-slate-900 rounded-3xl overflow-hidden shadow-2xl w-full aspect-[3/4] max-w-[400px]">
                <div className="absolute inset-0 flex flex-col">
                    {lanes.map((lane, i) => (
                        <div
                            key={i}
                            className={`flex-1 relative border-b border-white/5 overflow-hidden ${lane.type === 'river' ? 'bg-blue-900/40' :
                                    lane.type === 'road' ? 'bg-slate-800' : 'bg-emerald-900/20'
                                }`}
                        >
                            {/* Terrain Details */}
                            {lane.type === 'road' && (
                                <div className="absolute top-1/2 left-0 w-full border-t-2 border-dashed border-white/10 -translate-y-1/2" />
                            )}
                            {lane.type === 'river' && (
                                <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse" />
                            )}

                            {/* Lane Objects */}
                            {lane.objects.map(obj => (
                                <div
                                    key={obj.id}
                                    className={`absolute top-1 bottom-1 flex items-center justify-center rounded-lg transition-transform duration-100 ${obj.type === 'car' ? 'bg-rose-500 shadow-lg' :
                                            obj.type === 'truck' ? 'bg-orange-600 shadow-lg' : 'bg-amber-900/60'
                                        }`}
                                    style={{
                                        width: `${(obj.width / GRID_COLS) * 100}%`,
                                        left: `${(obj.pos / GRID_COLS) * 100}%`,
                                        zIndex: 1
                                    }}
                                >
                                    {obj.type === 'car' && <Car className="w-4 h-4 text-white/50" />}
                                    {obj.type === 'log' && <div className="w-full h-2 bg-amber-950/40 rounded-full" />}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Player */}
                <div
                    className={`absolute rounded-xl transition-all duration-100 z-20 flex items-center justify-center ${isShielded ? 'bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)]' : 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                        }`}
                    style={{
                        width: `${(0.8 / GRID_COLS) * 100}%`,
                        height: `${(0.8 / GRID_ROWS) * 100}%`,
                        left: `${(player.x / GRID_COLS) * 100 + 1}%`,
                        top: `${(player.y / GRID_ROWS) * 100 + 0.5}%`,
                    }}
                >
                    <GhostIcon className={`w-4 h-4 ${isShielded ? 'text-emerald-900' : 'text-slate-900'}`} />
                </div>

                {/* Overlays */}
                {gameOver && (
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300 z-50">
                        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
                            <X className="w-10 h-10 text-rose-500" />
                        </div>
                        <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">Wasted!</h2>
                        <p className="text-slate-400 mb-8 font-medium">You traveled {distance} meters across the grid.</p>
                        <button onClick={resetGame} className="bg-blue-600 hover:bg-blue-500 text-white font-black px-12 py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/20 w-full uppercase tracking-widest active:scale-95">
                            TRY AGAIN
                        </button>
                    </div>
                )}

                {isPaused && !gameOver && !showQuiz && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-40 cursor-pointer" onClick={() => setIsPaused(false)}>
                        <div className="bg-blue-600/90 p-8 rounded-full shadow-2xl animate-bounce">
                            <Play className="w-12 h-12 text-white fill-current" />
                        </div>
                    </div>
                )}
            </div>

            {/* Quiz Modal */}
            {showQuiz && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-slate-800 p-8 max-w-sm w-full rounded-[2.5rem] border border-white/10 shadow-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                <Zap className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight uppercase">Safe Zone!</h3>
                                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Correct answer gives a shield</p>
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

            <div className="mt-8 text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-4">
                <div className="flex items-center gap-2"><ArrowLeft className="w-3 h-3" /> Turn</div>
                <div className="w-1 h-1 rounded-full bg-slate-700" />
                <div className="flex items-center gap-2">Space • Pause</div>
            </div>
        </div>
    );
}
