'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Trophy, Gamepad2, Check, HelpCircle, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/contexts/AuthContext';

interface SudokuGameProps {
    onExit?: () => void;
    terms?: any[];
    focusMode?: boolean;
}

const EMPTY = 0;

export default function LogicGrid({ onExit, terms, focusMode }: SudokuGameProps) {
    const { updateXP } = useAuth();
    const [grid, setGrid] = useState<number[][]>(Array(9).fill(0).map(() => Array(9).fill(0)));
    const [initialGrid, setInitialGrid] = useState<number[][]>(Array(9).fill(0).map(() => Array(9).fill(0)));
    const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
    const [isComplete, setIsComplete] = useState(false);
    const [mistakes, setMistakes] = useState(0);

    const isValid = (g: number[][], r: number, c: number, v: number) => {
        for (let i = 0; i < 9; i++) if (g[r][i] === v) return false;
        for (let i = 0; i < 9; i++) if (g[i][c] === v) return false;
        const startR = Math.floor(r / 3) * 3;
        const startC = Math.floor(c / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (g[startR + i][startC + j] === v) return false;
            }
        }
        return true;
    };

    const solve = (g: number[][]) => {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (g[r][c] === EMPTY) {
                    for (let v = 1; v <= 9; v++) {
                        if (isValid(g, r, c, v)) {
                            g[r][c] = v;
                            if (solve(g)) return true;
                            g[r][c] = EMPTY;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    };

    const generateBoard = useCallback((diff: 'easy' | 'medium' | 'hard') => {
        const full = Array(9).fill(0).map(() => Array(9).fill(0));
        // Fill diagonals first for randomization
        for (let i = 0; i < 9; i += 3) {
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    let v;
                    do { v = Math.floor(Math.random() * 9) + 1; } while (!isValid(full, i + r, i + c, v));
                    full[i + r][i + c] = v;
                }
            }
        }
        solve(full);

        const puzzle = full.map(row => [...row]);
        const holes = diff === 'easy' ? 30 : diff === 'medium' ? 45 : 55;
        let count = 0;
        while (count < holes) {
            const r = Math.floor(Math.random() * 9);
            const c = Math.floor(Math.random() * 9);
            if (puzzle[r][c] !== EMPTY) {
                puzzle[r][c] = EMPTY;
                count++;
            }
        }
        setGrid(puzzle);
        setInitialGrid(puzzle.map(row => [...row]));
        setIsComplete(false);
        setMistakes(0);
        setScore(0);
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem('sudoku_highscore');
        if (saved) setHighScore(parseInt(saved));
        generateBoard(difficulty);
    }, [generateBoard]);

    const handleNumberInput = (num: number) => {
        if (!selected || isComplete || initialGrid[selected.r][selected.c] !== EMPTY) return;

        const newGrid = grid.map(row => [...row]);
        // Check if correct (ideally we should have the full solution stored)
        // For simplicity, let's just check if it's valid in current partial grid
        if (isValid(grid, selected.r, selected.c, num)) {
            newGrid[selected.r][selected.c] = num;
            setGrid(newGrid);
            setScore(s => s + 10);
            
            // Award minor XP for correct input
            updateXP(2, 'Logic Grid - Correct number');

            // Check completion
            if (newGrid.every(row => row.every(cell => cell !== EMPTY))) {
                setIsComplete(true);
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 }
                });
                
                if (score + 10 > highScore) {
                    setHighScore(score + 10);
                    localStorage.setItem('sudoku_highscore', String(score + 10));
                }

                // Award major XP for completion
                const diffBonus = difficulty === 'easy' ? 50 : difficulty === 'medium' ? 100 : 200;
                updateXP(diffBonus, `Logic Grid - Completed (${difficulty})`);
            }
        } else {
            setMistakes(m => m + 1);
            if (mistakes + 1 >= 3) {
                // Game Over logic
            }
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key >= '1' && e.key <= '9') handleNumberInput(parseInt(e.key));
            if (e.key === 'Backspace' || e.key === 'Delete') {
                if (selected && initialGrid[selected.r][selected.c] === EMPTY) {
                    const newGrid = grid.map(row => [...row]);
                    newGrid[selected.r][selected.c] = EMPTY;
                    setGrid(newGrid);
                }
            }
            if (e.key.startsWith('Arrow')) {
                setSelected(prev => {
                    if (!prev) return { r: 4, c: 4 };
                    let { r, c } = prev;
                    if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
                    if (e.key === 'ArrowDown') r = Math.min(8, r + 1);
                    if (e.key === 'ArrowLeft') c = Math.max(0, c - 1);
                    if (e.key === 'ArrowRight') c = Math.min(8, c + 1);
                    return { r, c };
                });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selected, grid, initialGrid]);

    return (
        <div className="flex flex-col items-center p-6 w-full max-w-2xl mx-auto md:flex-row md:items-start md:gap-12">
            <div className="flex-1">
                <div className="grid grid-cols-9 bg-slate-800 border-2 border-slate-700 rounded-lg overflow-hidden shadow-2xl aspect-square">
                    {grid.map((row, r) =>
                        row.map((cell, c) => {
                            const isInitial = initialGrid[r][c] !== EMPTY;
                            const isSelected = selected?.r === r && selected?.c === c;
                            const borderR = (c + 1) % 3 === 0 && c < 8 ? 'border-r-2 border-slate-600' : 'border-r border-slate-700/50';
                            const borderB = (r + 1) % 3 === 0 && r < 8 ? 'border-b-2 border-slate-600' : 'border-b border-slate-700/50';

                            return (
                                <button
                                    key={`${r}-${c}`}
                                    onClick={() => setSelected({ r, c })}
                                    className={`
                                        relative flex items-center justify-center text-lg font-bold transition-all
                                        ${isSelected ? 'bg-blue-500/30 ring-2 ring-blue-500/50 z-10' : isInitial ? 'bg-slate-800/50' : 'bg-slate-900/40'}
                                        ${isInitial ? 'text-slate-200' : 'text-blue-400'}
                                        ${borderR} ${borderB}
                                        hover:bg-blue-500/10
                                    `}
                                >
                                    {cell !== EMPTY ? cell : ''}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="mt-8 md:mt-0 flex flex-col gap-6 w-full max-w-[240px]">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 shadow-lg">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Mistakes</p>
                        <p className={`text-xl font-black ${mistakes >= 3 ? 'text-red-400' : 'text-white'}`}>{mistakes}/5</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 shadow-lg">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Best</p>
                        <p className="text-xl font-black text-yellow-400">{highScore}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase ml-1">Number Pad</p>
                    <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button
                                key={num}
                                onClick={() => handleNumberInput(num)}
                                className="h-12 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-xl border border-white/5 font-black text-white transition-all shadow-md"
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center ml-1">
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Difficulty</p>
                        <button onClick={() => generateBoard(difficulty)} className="text-blue-400 text-[10px] font-bold hover:underline">RESET</button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {(['easy', 'medium', 'hard'] as const).map(d => (
                            <button
                                key={d}
                                onClick={() => { setDifficulty(d); generateBoard(d); }}
                                className={`
                                    py-2 text-[10px] font-bold uppercase rounded-lg border transition-all
                                    ${difficulty === d ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-white/5 text-slate-400 hover:text-white'}
                                `}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2 text-blue-400">
                        <HelpCircle className="w-4 h-4" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Tips</p>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                        Fill all 9x9 squares. Each row, column, and 3x3 box must contain numbers 1-9 without repetition.
                    </p>
                </div>
            </div>

            {isComplete && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center z-50 animate-in fade-in zoom-in duration-300">
                    <Trophy className="w-16 h-16 text-yellow-500 mb-4" />
                    <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">SUDOKU MASTER!</h2>
                    <p className="text-slate-400 mb-8 max-w-xs">Congratulations! You solved the puzzle with {mistakes} mistakes.</p>
                    <button
                        onClick={() => generateBoard(difficulty)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-12 py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                    >
                        NEW PUZZLE
                    </button>
                </div>
            )}
        </div>
    );
}
