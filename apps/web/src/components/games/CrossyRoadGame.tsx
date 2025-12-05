'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RefreshCw, Trophy, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

interface Term { id: string; term: string; definition: string; }

interface CrossyRoadGameProps {
    onExit: () => void;
    terms?: Term[];
}

const GRID_WIDTH = 9;
const GRID_HEIGHT = 15;
const CELL_SIZE = 36;

type LaneType = 'grass' | 'road' | 'water' | 'safe';

interface Lane {
    type: LaneType;
    speed: number;
    direction: 1 | -1;
    obstacles: number[]; // x positions
    logs?: number[]; // for water lanes
}

interface Position { x: number; y: number; }

export default function CrossyRoadGame({ onExit, terms = [] }: CrossyRoadGameProps) {
    const [playerPos, setPlayerPos] = useState<Position>({ x: 4, y: GRID_HEIGHT - 1 });
    const [lanes, setLanes] = useState<Lane[]>([]);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [maxY, setMaxY] = useState(GRID_HEIGHT - 1);

    // Quiz state
    const [showQuiz, setShowQuiz] = useState(false);
    const [currentQuizTerm, setCurrentQuizTerm] = useState<Term | null>(null);
    const [quizOptions, setQuizOptions] = useState<string[]>([]);
    const [quizResult, setQuizResult] = useState<'correct' | 'wrong' | null>(null);

    const animationRef = useRef<number>();
    const lastUpdate = useRef(0);

    useEffect(() => {
        const saved = localStorage.getItem('crossy_road_highscore');
        if (saved) setHighScore(parseInt(saved));
        generateLanes();
    }, []);

    const generateLanes = () => {
        const newLanes: Lane[] = [];
        for (let i = 0; i < 50; i++) {
            if (i === 0 || i % 7 === 0) {
                // Safe grass zones
                newLanes.push({ type: 'safe', speed: 0, direction: 1, obstacles: [] });
            } else if (Math.random() < 0.4) {
                // Road lane
                const numCars = Math.floor(Math.random() * 3) + 1;
                const obstacles: number[] = [];
                for (let j = 0; j < numCars; j++) {
                    obstacles.push(Math.floor(Math.random() * GRID_WIDTH));
                }
                newLanes.push({
                    type: 'road',
                    speed: (Math.random() * 0.03) + 0.02,
                    direction: Math.random() < 0.5 ? 1 : -1,
                    obstacles
                });
            } else if (Math.random() < 0.5) {
                // Water lane
                const numLogs = Math.floor(Math.random() * 2) + 1;
                const logs: number[] = [];
                for (let j = 0; j < numLogs; j++) {
                    logs.push(Math.floor(Math.random() * GRID_WIDTH));
                }
                newLanes.push({
                    type: 'water',
                    speed: (Math.random() * 0.02) + 0.01,
                    direction: Math.random() < 0.5 ? 1 : -1,
                    obstacles: [],
                    logs
                });
            } else {
                // Grass
                newLanes.push({ type: 'grass', speed: 0, direction: 1, obstacles: [] });
            }
        }
        setLanes(newLanes);
    };

    const triggerQuiz = useCallback(() => {
        if (terms.length < 4) return;
        const randomTerm = terms[Math.floor(Math.random() * terms.length)];
        const wrongOptions = terms
            .filter(t => t.id !== randomTerm.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(t => t.definition);
        setCurrentQuizTerm(randomTerm);
        setQuizOptions([randomTerm.definition, ...wrongOptions].sort(() => Math.random() - 0.5));
        setQuizResult(null);
        setShowQuiz(true);
    }, [terms]);

    const handleQuizAnswer = (answer: string) => {
        if (!currentQuizTerm) return;
        const isCorrect = answer === currentQuizTerm.definition;
        setQuizResult(isCorrect ? 'correct' : 'wrong');

        setTimeout(() => {
            if (isCorrect) {
                setScore(s => s + 10);
            }
            setShowQuiz(false);
            setCurrentQuizTerm(null);
        }, 800);
    };

    const move = useCallback((dx: number, dy: number) => {
        if (gameOver || showQuiz) return;

        setPlayerPos(prev => {
            const newX = Math.max(0, Math.min(GRID_WIDTH - 1, prev.x + dx));
            const newY = Math.max(0, prev.y + dy);

            // Score for moving forward
            if (newY < maxY) {
                setMaxY(newY);
                const newScore = score + 1;
                setScore(newScore);
                if (newScore > highScore) {
                    setHighScore(newScore);
                    localStorage.setItem('crossy_road_highscore', String(newScore));
                }
                // Random quiz trigger
                if (terms.length >= 4 && Math.random() < 0.15) {
                    setTimeout(() => triggerQuiz(), 100);
                }
            }

            return { x: newX, y: newY };
        });
    }, [gameOver, showQuiz, maxY, score, highScore, terms, triggerQuiz]);

    // Game loop for moving obstacles
    useEffect(() => {
        const update = (time: number) => {
            if (gameOver || showQuiz) {
                animationRef.current = requestAnimationFrame(update);
                return;
            }

            const delta = time - lastUpdate.current;
            if (delta > 16) { // ~60fps
                lastUpdate.current = time;

                setLanes(prevLanes => prevLanes.map(lane => {
                    if (lane.speed === 0) return lane;

                    const moveAmount = lane.speed * lane.direction;

                    return {
                        ...lane,
                        obstacles: lane.obstacles.map(x => {
                            let newX = x + moveAmount;
                            if (newX > GRID_WIDTH) newX = -1;
                            if (newX < -1) newX = GRID_WIDTH;
                            return newX;
                        }),
                        logs: lane.logs?.map(x => {
                            let newX = x + moveAmount;
                            if (newX > GRID_WIDTH) newX = -1;
                            if (newX < -1) newX = GRID_WIDTH;
                            return newX;
                        })
                    };
                }));
            }

            animationRef.current = requestAnimationFrame(update);
        };

        animationRef.current = requestAnimationFrame(update);
        return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
    }, [gameOver, showQuiz]);

    // Collision detection
    useEffect(() => {
        if (gameOver || showQuiz) return;

        const laneIndex = GRID_HEIGHT - 1 - playerPos.y;
        if (laneIndex < 0 || laneIndex >= lanes.length) return;

        const lane = lanes[laneIndex];

        if (lane.type === 'road') {
            // Check car collision
            for (const carX of lane.obstacles) {
                if (Math.abs(carX - playerPos.x) < 0.8) {
                    setGameOver(true);
                    return;
                }
            }
        } else if (lane.type === 'water') {
            // Check if on log
            let onLog = false;
            for (const logX of (lane.logs || [])) {
                if (Math.abs(logX - playerPos.x) < 1.2) {
                    onLog = true;
                    break;
                }
            }
            if (!onLog) {
                setGameOver(true);
            }
        }
    }, [playerPos, lanes, gameOver, showQuiz]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameOver) {
                if (e.code === 'Space') resetGame();
                return;
            }
            switch (e.code) {
                case 'ArrowUp': case 'KeyW': move(0, -1); break;
                case 'ArrowDown': case 'KeyS': move(0, 1); break;
                case 'ArrowLeft': case 'KeyA': move(-1, 0); break;
                case 'ArrowRight': case 'KeyD': move(1, 0); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [move, gameOver]);

    const resetGame = () => {
        setPlayerPos({ x: 4, y: GRID_HEIGHT - 1 });
        setScore(0);
        setMaxY(GRID_HEIGHT - 1);
        setGameOver(false);
        setShowQuiz(false);
        generateLanes();
    };

    const getLaneColor = (type: LaneType) => {
        switch (type) {
            case 'grass': return 'bg-green-700';
            case 'safe': return 'bg-green-600';
            case 'road': return 'bg-slate-700';
            case 'water': return 'bg-blue-600';
        }
    };

    // Calculate visible lanes (centered on player)
    const visibleStart = Math.max(0, GRID_HEIGHT - 1 - playerPos.y - 7);
    const visibleEnd = visibleStart + GRID_HEIGHT;

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center p-4">
            {/* Header */}
            <div className="w-full max-w-sm flex justify-between items-center mb-4">
                <button onClick={onExit} className="text-slate-400 hover:text-white">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-4">
                    <div className="text-center">
                        <p className="text-xs text-slate-400">SCORE</p>
                        <p className="text-lg font-bold text-white">{score}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-slate-400">BEST</p>
                        <p className="text-lg font-bold text-yellow-400">{highScore}</p>
                    </div>
                </div>
                <button onClick={resetGame} className="p-2 glass-button rounded-lg">
                    <RefreshCw className="w-4 h-4 text-white" />
                </button>
            </div>

            {/* Game Grid */}
            <div className="relative overflow-hidden rounded-xl border border-white/10"
                style={{ width: GRID_WIDTH * CELL_SIZE, height: GRID_HEIGHT * CELL_SIZE }}>
                {lanes.slice(visibleStart, visibleEnd).map((lane, i) => {
                    const laneY = GRID_HEIGHT - 1 - (visibleStart + i);
                    return (
                        <div
                            key={i}
                            className={`absolute w-full ${getLaneColor(lane.type)}`}
                            style={{ top: i * CELL_SIZE, height: CELL_SIZE }}
                        >
                            {/* Obstacles */}
                            {lane.obstacles.map((x, j) => (
                                <div
                                    key={`car-${j}`}
                                    className="absolute bg-red-500 rounded"
                                    style={{
                                        left: x * CELL_SIZE,
                                        top: 4,
                                        width: CELL_SIZE - 4,
                                        height: CELL_SIZE - 8
                                    }}
                                />
                            ))}
                            {/* Logs */}
                            {lane.logs?.map((x, j) => (
                                <div
                                    key={`log-${j}`}
                                    className="absolute bg-amber-700 rounded"
                                    style={{
                                        left: x * CELL_SIZE - 10,
                                        top: 6,
                                        width: CELL_SIZE + 20,
                                        height: CELL_SIZE - 12
                                    }}
                                />
                            ))}
                        </div>
                    );
                })}

                {/* Player */}
                <div
                    className="absolute bg-yellow-400 rounded-full z-10 transition-all duration-100"
                    style={{
                        left: playerPos.x * CELL_SIZE + 4,
                        top: (GRID_HEIGHT - 1 - (playerPos.y - visibleStart)) * CELL_SIZE + 4,
                        width: CELL_SIZE - 8,
                        height: CELL_SIZE - 8
                    }}
                />

                {/* Game Over */}
                {gameOver && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20">
                        <Trophy className="w-12 h-12 text-yellow-400 mb-3" />
                        <h2 className="text-2xl font-bold text-white mb-2">Game Over!</h2>
                        <p className="text-slate-300 mb-4">Score: {score}</p>
                        <button onClick={resetGame} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold">
                            Play Again
                        </button>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="mt-6 grid grid-cols-3 gap-2 w-40">
                <div />
                <button onClick={() => move(0, -1)} className="glass-button p-3 rounded-xl"><ChevronUp /></button>
                <div />
                <button onClick={() => move(-1, 0)} className="glass-button p-3 rounded-xl"><ChevronLeft /></button>
                <button onClick={() => move(0, 1)} className="glass-button p-3 rounded-xl"><ChevronDown /></button>
                <button onClick={() => move(1, 0)} className="glass-button p-3 rounded-xl"><ChevronRight /></button>
            </div>

            {/* Quiz Modal */}
            {showQuiz && currentQuizTerm && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-5 max-w-sm w-full rounded-2xl">
                        <h3 className="text-lg font-bold text-white mb-3">🎯 Bonus Quiz!</h3>
                        <p className="text-slate-400 text-sm mb-1">Define:</p>
                        <p className="text-lg font-bold text-white mb-4">{currentQuizTerm.term}</p>
                        <div className="space-y-2">
                            {quizOptions.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => !quizResult && handleQuizAnswer(opt)}
                                    disabled={quizResult !== null}
                                    className={`w-full p-3 rounded-xl text-left text-sm ${quizResult && opt === currentQuizTerm.definition
                                            ? 'bg-green-500/20 border border-green-500'
                                            : 'glass-card hover:bg-white/5'
                                        }`}
                                >
                                    {opt}
                                    {quizResult && opt === currentQuizTerm.definition && <Check className="inline w-4 h-4 ml-1 text-green-400" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <p className="mt-4 text-slate-500 text-xs">Arrow keys or WASD to move. Avoid cars, stay on logs!</p>
        </div>
    );
}
