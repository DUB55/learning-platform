'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Trophy, Gamepad2, Home } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/contexts/AuthContext';

interface Puzzle2048Props {
    onExit: () => void;
    terms?: any[];
    focusMode?: boolean;
}

type Grid = number[][];

export default function Puzzle2048({ onExit, terms, focusMode }: Puzzle2048Props) {
    const { updateXP } = useAuth();
    const [grid, setGrid] = useState<Grid>(Array(4).fill(0).map(() => Array(4).fill(0)));
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    const initGrid = useCallback(() => {
        let newGrid = Array(4).fill(0).map(() => Array(4).fill(0));
        addRandom(newGrid);
        addRandom(newGrid);
        setGrid(newGrid);
        setScore(0);
        setGameOver(false);
    }, []);

    const addRandom = (g: Grid) => {
        let empty = [];
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (g[r][c] === 0) empty.push({ r, c });
            }
        }
        if (empty.length > 0) {
            const { r, c } = empty[Math.floor(Math.random() * empty.length)];
            g[r][c] = Math.random() > 0.1 ? 2 : 4;
        }
    };

    useEffect(() => {
        const saved = localStorage.getItem('2048_highscore');
        if (saved) setHighScore(parseInt(saved));
        initGrid();
    }, [initGrid]);

    const move = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
        if (gameOver) return;

        let newGrid = grid.map(row => [...row]);
        let moved = false;
        let points = 0;

        const rotate = (g: Grid) => {
            const result = Array(4).fill(0).map(() => Array(4).fill(0));
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 4; c++) {
                    result[c][3 - r] = g[r][c];
                }
            }
            return result;
        };

        let tempGrid = newGrid;
        const rotations = direction === 'left' ? 0 : direction === 'up' ? 3 : direction === 'right' ? 2 : 1;

        for (let i = 0; i < rotations; i++) tempGrid = rotate(tempGrid);

        for (let r = 0; r < 4; r++) {
            let row = tempGrid[r].filter(v => v !== 0);
            for (let i = 0; i < row.length - 1; i++) {
                if (row[i] === row[i + 1]) {
                    row[i] *= 2;
                    points += row[i];
                    row.splice(i + 1, 1);
                    moved = true;
                    if (row[i] === 2048) confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
                }
            }
            while (row.length < 4) row.push(0);
            if (JSON.stringify(tempGrid[r]) !== JSON.stringify(row)) moved = true;
            tempGrid[r] = row;
        }

        for (let i = 0; i < (4 - rotations) % 4; i++) tempGrid = rotate(tempGrid);

        if (moved) {
            addRandom(tempGrid);
            setGrid(tempGrid);
            setScore(s => s + points);
            if (score + points > highScore) {
                setHighScore(score + points);
                localStorage.setItem('2048_highscore', String(score + points));
            }

            // Check game over
            let canMove = false;
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 4; c++) {
                    if (tempGrid[r][c] === 0) canMove = true;
                    if (r < 3 && tempGrid[r][c] === tempGrid[r + 1][c]) canMove = true;
                    if (c < 3 && tempGrid[r][c] === tempGrid[r][c + 1]) canMove = true;
                }
            }
            if (!canMove) {
                setGameOver(true);
                // Award XP
                if (score + points > 100) {
                    const xpAmount = Math.min(Math.floor((score + points) / 100), 60);
                    updateXP(xpAmount, `2048 - Score: ${score + points}`);
                }
            }
        }
    }, [grid, gameOver, score, highScore]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp') move('up');
            if (e.key === 'ArrowDown') move('down');
            if (e.key === 'ArrowLeft') move('left');
            if (e.key === 'ArrowRight') move('right');
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [move]);

    const getCellColor = (value: number) => {
        const colors: Record<number, string> = {
            2: 'bg-slate-200 text-slate-800',
            4: 'bg-slate-300 text-slate-800',
            8: 'bg-orange-200 text-slate-800',
            16: 'bg-orange-300 text-white',
            32: 'bg-orange-400 text-white',
            64: 'bg-orange-500 text-white',
            128: 'bg-yellow-200 text-slate-800 text-xl',
            256: 'bg-yellow-300 text-slate-800 text-xl',
            512: 'bg-yellow-400 text-white text-xl',
            1024: 'bg-yellow-500 text-white text-lg',
            2048: 'bg-yellow-600 text-white text-lg',
        };
        return colors[value] || 'bg-slate-700/50 text-white';
    };

    return (
        <div className="flex flex-col items-center p-6 w-full max-w-md mx-auto">
            <div className="w-full flex justify-between items-center mb-8">
                <div className="text-center bg-slate-800/50 p-3 rounded-2xl min-w-[80px]">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Score</p>
                    <p className="text-xl font-bold text-white">{score}</p>
                </div>
                <div className="text-center bg-slate-800/50 p-3 rounded-2xl min-w-[80px]">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Best</p>
                    <p className="text-xl font-bold text-yellow-400">{highScore}</p>
                </div>
                <button onClick={initGrid} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-colors">
                    <RefreshCw className="w-6 h-6 text-white" />
                </button>
            </div>

            <div className="bg-slate-800 p-3 rounded-2xl shadow-2xl relative w-full aspect-square max-w-[400px]">
                <div className="grid grid-cols-4 grid-rows-4 gap-3 h-full">
                    {grid.map((row, r) =>
                        row.map((cell, c) => (
                            <div
                                key={`${r}-${c}`}
                                className={`flex items-center justify-center rounded-xl text-2xl font-black transition-all duration-100 ${getCellColor(cell)} ${cell === 0 ? 'opacity-20' : 'scale-100'}`}
                            >
                                {cell !== 0 ? cell : ''}
                            </div>
                        ))
                    )}
                </div>

                {gameOver && (
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl p-8 text-center animate-in fade-in zoom-in duration-300">
                        <Trophy className="w-16 h-16 text-yellow-500 mb-4" />
                        <h2 className="text-3xl font-black text-white mb-2">GAME OVER</h2>
                        <p className="text-slate-400 mb-6 font-medium">Final Score: {score}</p>
                        <button
                            onClick={initGrid}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-2xl transition-all active:scale-95 w-full"
                        >
                            TRY AGAIN
                        </button>
                    </div>
                )}
            </div>

            <p className="mt-8 text-slate-500 text-xs font-medium text-center bg-white/5 border border-white/5 px-4 py-2 rounded-full uppercase tracking-widest">
                Use Arrow Keys to slide tiles
            </p>
        </div>
    );
}
