'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Trophy, Gamepad2, Play, Pause, ArrowDown, ArrowLeft, ArrowRight, RotateCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/contexts/AuthContext';

interface TetrisGameProps {
    onExit?: () => void;
    terms?: any[];
    focusMode?: boolean;
}

const COLS = 10;
const ROWS = 20;
const INITIAL_SPEED = 800;

type Piece = {
    pos: { x: number; y: number };
    shape: number[][];
    color: string;
};

const SHAPES = [
    { shape: [[1, 1, 1, 1]], color: 'bg-cyan-400 border-cyan-500' }, // I
    { shape: [[1, 1], [1, 1]], color: 'bg-yellow-400 border-yellow-500' }, // O
    { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-purple-400 border-purple-500' }, // T
    { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-green-400 border-green-500' }, // S
    { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-red-400 border-red-500' }, // Z
    { shape: [[1, 0, 0], [1, 1, 1]], color: 'bg-blue-400 border-blue-500' }, // J
    { shape: [[0, 0, 1], [1, 1, 1]], color: 'bg-orange-400 border-orange-500' } // L
];

export default function BlockDrop({ onExit, terms, focusMode }: TetrisGameProps) {
    const { updateXP } = useAuth();
    const [grid, setGrid] = useState<string[][]>(Array(ROWS).fill(null).map(() => Array(COLS).fill('')));
    const [activePiece, setActivePiece] = useState<Piece | null>(null);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [isPaused, setIsPaused] = useState(true);
    const [gameOver, setGameOver] = useState(false);
    const [speed, setSpeed] = useState(INITIAL_SPEED);

    const gameLoopRef = useRef<NodeJS.Timeout>();

    const spawnPiece = useCallback(() => {
        const rand = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        const piece: Piece = {
            pos: { x: Math.floor(COLS / 2) - Math.floor(rand.shape[0].length / 2), y: 0 },
            shape: rand.shape,
            color: rand.color
        };

        if (checkCollision(piece.pos, piece.shape, grid)) {
            setGameOver(true);
            setIsPaused(true);
            
            // Award XP
            if (score > 0) {
                const xpAmount = Math.min(Math.floor(score / 50), 50);
                updateXP(xpAmount, `Block Drop - Score: ${score}`);
            }

            if (score > highScore) {
                setHighScore(score);
                localStorage.setItem('tetris_highscore', String(score));
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            }
            return null;
        }
        return piece;
    }, [grid, score, highScore]);

    const checkCollision = (pos: { x: number; y: number }, shape: number[][], currentGrid: string[][]) => {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const newX = pos.x + c;
                    const newY = pos.y + r;
                    if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && currentGrid[newY][newX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    };

    const rotatePiece = () => {
        if (!activePiece || isPaused || gameOver) return;
        const newShape = activePiece.shape[0].map((_, i) => activePiece.shape.map(row => row[i]).reverse());
        if (!checkCollision(activePiece.pos, newShape, grid)) {
            setActivePiece({ ...activePiece, shape: newShape });
        }
    };

    const movePiece = (dx: number, dy: number) => {
        if (!activePiece || isPaused || gameOver) return;
        const newPos = { x: activePiece.pos.x + dx, y: activePiece.pos.y + dy };
        if (!checkCollision(newPos, activePiece.shape, grid)) {
            setActivePiece({ ...activePiece, pos: newPos });
            return true;
        }
        if (dy > 0) {
            lockPiece();
        }
        return false;
    };

    const lockPiece = () => {
        if (!activePiece) return;
        const newGrid = grid.map(row => [...row]);
        activePiece.shape.forEach((row, r) => {
            row.forEach((value, c) => {
                if (value) {
                    const y = activePiece.pos.y + r;
                    const x = activePiece.pos.x + c;
                    if (y >= 0) newGrid[y][x] = activePiece.color;
                }
            });
        });

        // Clear lines
        let linesCleared = 0;
        const finalGrid = newGrid.filter(row => {
            const isFull = row.every(cell => cell !== '');
            if (isFull) linesCleared++;
            return !isFull;
        });

        while (finalGrid.length < ROWS) {
            finalGrid.unshift(Array(COLS).fill(''));
        }

        if (linesCleared > 0) {
            const bonus = [0, 100, 300, 500, 800][linesCleared];
            setScore(s => s + bonus);
            setSpeed(s => Math.max(100, s - 10));
        }

        setGrid(finalGrid);
        setActivePiece(spawnPiece());
    };

    const dropPiece = () => {
        while (movePiece(0, 1));
    };

    const resetGame = () => {
        setGrid(Array(ROWS).fill(null).map(() => Array(COLS).fill('')));
        setScore(0);
        setGameOver(false);
        setIsPaused(false);
        setSpeed(INITIAL_SPEED);
        setActivePiece(spawnPiece());
    };

    useEffect(() => {
        if (!isPaused && !gameOver) {
            gameLoopRef.current = setInterval(() => movePiece(0, 1), speed);
        }
        return () => clearInterval(gameLoopRef.current);
    }, [activePiece, isPaused, gameOver, speed, movePiece]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp') rotatePiece();
            if (e.key === 'ArrowDown') movePiece(0, 1);
            if (e.key === 'ArrowLeft') movePiece(-1, 0);
            if (e.key === 'ArrowRight') movePiece(1, 0);
            if (e.key === ' ') dropPiece();
            if (e.key === 'p') setIsPaused(p => !p);
        };
        window.addEventListener('keydown', handleKeyDown);
        const saved = localStorage.getItem('tetris_highscore');
        if (saved) setHighScore(parseInt(saved));
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activePiece, isPaused, gameOver]);

    return (
        <div className="flex flex-col items-center p-6 w-full max-w-lg mx-auto md:flex-row md:items-start md:gap-8">
            <div className="relative bg-slate-900 border-4 border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-1">
                <div
                    className="grid bg-[#0a0f1e]"
                    style={{
                        gridTemplateColumns: `repeat(${COLS}, 1.5rem)`,
                        gridTemplateRows: `repeat(${ROWS}, 1.5rem)`,
                        gap: '1px'
                    }}
                >
                    {grid.map((row, r) =>
                        row.map((cell, c) => {
                            let activeClass = cell;
                            if (activePiece) {
                                const pr = r - activePiece.pos.y;
                                const pc = c - activePiece.pos.x;
                                if (pr >= 0 && pr < activePiece.shape.length && pc >= 0 && pc < activePiece.shape[0].length && activePiece.shape[pr][pc]) {
                                    activeClass = activePiece.color;
                                }
                            }
                            return (
                                <div
                                    key={`${r}-${c}`}
                                    className={`w-6 h-6 rounded-sm border ${activeClass ? activeClass : 'bg-slate-800/20 border-white/5'}`}
                                />
                            );
                        })
                    )}
                </div>

                {gameOver && (
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-20">
                        <h2 className="text-2xl font-black text-white mb-4 tracking-tighter">GAME OVER</h2>
                        <button onClick={resetGame} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-xl transition-all w-full">TRY AGAIN</button>
                    </div>
                )}

                {isPaused && !gameOver && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                        <button onClick={() => setIsPaused(false)} className="bg-blue-600/80 p-4 rounded-full shadow-2xl animate-pulse">
                            <Play className="w-8 h-8 text-white fill-current" />
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-8 md:mt-0 flex flex-col gap-4 w-full max-w-[200px]">
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 flex flex-col gap-1 shadow-lg">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Score</p>
                    <p className="text-2xl font-black text-white">{score}</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 flex flex-col gap-1 shadow-lg">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Best</p>
                    <p className="text-2xl font-black text-yellow-400">{highScore}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                    <button onClick={() => movePiece(-1, 0)} className="p-3 bg-slate-800 rounded-xl border border-white/5 hover:bg-slate-700 transition-colors flex justify-center"><ArrowLeft className="w-5 h-5" /></button>
                    <button onClick={() => movePiece(1, 0)} className="p-3 bg-slate-800 rounded-xl border border-white/5 hover:bg-slate-700 transition-colors flex justify-center"><ArrowRight className="w-5 h-5" /></button>
                    <button onClick={() => rotatePiece()} className="p-3 bg-slate-800 rounded-xl border border-white/5 hover:bg-slate-700 transition-colors flex justify-center"><RotateCw className="w-5 h-5" /></button>
                    <button onClick={() => movePiece(0, 1)} className="p-3 bg-slate-800 rounded-xl border border-white/5 hover:bg-slate-700 transition-colors flex justify-center"><ArrowDown className="w-5 h-5" /></button>
                </div>

                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl mt-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">How to Play</p>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <ArrowLeft className="w-3 h-3" /><ArrowRight className="w-3 h-3" /> Move
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <ArrowDown className="w-3 h-3" /> Soft Drop
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <RotateCw className="w-3 h-3" /> Rotate
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
