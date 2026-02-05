'use client';

import { useState, useEffect, useCallback } from 'react';
import { Flag, Bomb, RefreshCw, Trophy, ArrowLeft, Timer } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import confetti from 'canvas-confetti';

interface MinesweeperProps {
    onExit?: () => void;
    terms?: any[];
    focusMode?: boolean;
}

interface Cell {
    row: number;
    col: number;
    isMine: boolean;
    isRevealed: boolean;
    isFlagged: boolean;
    neighborMines: number;
}

export default function Minesweeper({ onExit, terms, focusMode }: MinesweeperProps) {
    const { updateXP } = useAuth();
    const [grid, setGrid] = useState<Cell[][]>([]);
    const [gameOver, setGameOver] = useState(false);
    const [win, setWin] = useState(false);
    const [score, setScore] = useState(0);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

    // Config
    const CONFIG = {
        easy: { rows: 8, cols: 8, mines: 10 },
        medium: { rows: 12, cols: 12, mines: 25 },
        hard: { rows: 16, cols: 16, mines: 40 },
    };

    useEffect(() => {
        startNewGame();
    }, [difficulty]);

    const startNewGame = () => {
        const { rows, cols, mines } = CONFIG[difficulty];

        // 1. Create Empty Grid
        let newGrid: Cell[][] = [];
        for (let r = 0; r < rows; r++) {
            newGrid[r] = [];
            for (let c = 0; c < cols; c++) {
                newGrid[r][c] = {
                    row: r,
                    col: c,
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0
                };
            }
        }

        // 2. Place Mines Randomly
        let minesPlaced = 0;
        while (minesPlaced < mines) {
            const r = Math.floor(Math.random() * rows);
            const c = Math.floor(Math.random() * cols);
            if (!newGrid[r][c].isMine) {
                newGrid[r][c].isMine = true;
                minesPlaced++;
            }
        }

        // 3. Calculate Neighbors
        const getNeighbors = (r: number, c: number) => {
            const neighbors = [];
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    const nr = r + i;
                    const nc = c + j;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                        neighbors.push(newGrid[nr][nc]);
                    }
                }
            }
            return neighbors;
        };

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!newGrid[r][c].isMine) {
                    const neighbors = getNeighbors(r, c);
                    newGrid[r][c].neighborMines = neighbors.filter(n => n.isMine).length;
                }
            }
        }

        setGrid(newGrid);
        setGameOver(false);
        setWin(false);
        setScore(0);
    };

    const handleCellClick = (r: number, c: number) => {
        if (gameOver || win || grid[r][c].isFlagged || grid[r][c].isRevealed) return;

        const newGrid = [...grid];
        const cell = newGrid[r][c];

        if (cell.isMine) {
            // Game Over
            revealAllMines(newGrid);
            setGameOver(true);
            
            // Award partial XP for effort
            if (score > 100) {
                const xpAmount = Math.min(Math.floor(score / 50), 20);
                updateXP(xpAmount, `Minesweeper - Game Over (Effort reward)`);
            }
            return;
        }

        revealCell(newGrid, r, c);
        setGrid(newGrid);
        checkWin(newGrid);
    };

    const handleRightClick = (e: React.MouseEvent, r: number, c: number) => {
        e.preventDefault();
        if (gameOver || win || grid[r][c].isRevealed) return;

        const newGrid = [...grid];
        newGrid[r][c].isFlagged = !newGrid[r][c].isFlagged;
        setGrid(newGrid);
    };

    const revealCell = (currentGrid: Cell[][], r: number, c: number) => {
        if (r < 0 || r >= CONFIG[difficulty].rows || c < 0 || c >= CONFIG[difficulty].cols || currentGrid[r][c].isRevealed || currentGrid[r][c].isFlagged) return;

        currentGrid[r][c].isRevealed = true;
        setScore(prev => prev + 10); // Points for revealing

        if (currentGrid[r][c].neighborMines === 0) {
            // Flood Fill
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    revealCell(currentGrid, r + i, c + j);
                }
            }
        }
    };

    const revealAllMines = (currentGrid: Cell[][]) => {
        currentGrid.forEach(row => {
            row.forEach(cell => {
                if (cell.isMine) cell.isRevealed = true;
            });
        });
        setGrid(currentGrid);
    };

    const checkWin = (currentGrid: Cell[][]) => {
        const { rows, cols, mines } = CONFIG[difficulty];
        let unrevealedCount = 0;
        currentGrid.forEach(row => {
            row.forEach(cell => {
                if (!cell.isRevealed) unrevealedCount++;
            });
        });

        if (unrevealedCount === mines) {
            setWin(true);
            
            // Award XP for winning
            const difficultyMultiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
            const xpAmount = 20 * difficultyMultiplier;
            updateXP(xpAmount, `Minesweeper - Win (${difficulty})`);
        }
    };

    const getCellColor = (mines: number) => {
        const colors = [
            'text-slate-400', 'text-blue-400', 'text-green-400', 'text-red-400',
            'text-purple-400', 'text-yellow-400', 'text-cyan-400', 'text-black'
        ];
        return colors[mines] || 'text-slate-400';
    };

    return (
        <div className="flex flex-col items-center justify-center p-8">
            {/* Header */}
            <div className="mb-8 flex items-center gap-8 bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/5">
                <div className="flex items-center gap-2">
                    <Flag className="w-5 h-5 text-red-400" />
                    <span className="text-xl font-bold font-mono text-white">
                        {CONFIG[difficulty].mines - grid.flat().filter(c => c.isFlagged).length}
                    </span>
                </div>

                <button
                    onClick={startNewGame}
                    className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors"
                >
                    <RefreshCw className="w-6 h-6 text-white" />
                </button>

                <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <span className="text-xl font-bold font-mono text-white">{score}</span>
                </div>
            </div>

            {/* Difficulty Toggle */}
            <div className="flex gap-2 mb-8 bg-black/20 p-1 rounded-lg">
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                    <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`px-4 py-2 rounded-md text-sm font-bold capitalize transition-all ${difficulty === d
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {d}
                    </button>
                ))}
            </div>

            {/* Game Grid */}
            <div
                className="grid gap-1 bg-black/40 p-2 rounded-lg border border-white/10 shadow-2xl relative overflow-hidden"
                style={{ gridTemplateColumns: `repeat(${CONFIG[difficulty].cols}, minmax(0, 1fr))` }}
            >
                {/* Win/Loss Overlay */}
                {(gameOver || win) && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="text-4xl font-black mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            {win ? 'VICTORY!' : 'GAME OVER'}
                        </div>
                        <button
                            onClick={startNewGame}
                            className="px-6 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform"
                        >
                            Play Again
                        </button>
                    </div>
                )}

                {grid.map((row, r) => (
                    row.map((cell, c) => (
                        <button
                            key={`${r}-${c}`}
                            className={`w-10 h-10 flex items-center justify-center rounded-sm text-lg font-bold transition-all duration-200 
                                ${cell.isRevealed
                                    ? 'bg-white/5 border border-white/5 ' + (cell.isMine ? 'bg-red-500/20' : '')
                                    : 'bg-white/10 hover:bg-white/20 border-t border-l border-white/20 border-b-black/30 border-r-black/30 shadow-sm'
                                }
                            `}
                            onClick={() => handleCellClick(r, c)}
                            onContextMenu={(e) => handleRightClick(e, r, c)}
                        >
                            {cell.isRevealed ? (
                                cell.isMine ? (
                                    <Bomb className="w-6 h-6 text-red-500 animate-pulse" />
                                ) : (
                                    cell.neighborMines > 0 && <span className={getCellColor(cell.neighborMines)}>{cell.neighborMines}</span>
                                )
                            ) : (
                                cell.isFlagged && <Flag className="w-5 h-5 text-red-400" />
                            )}
                        </button>
                    ))
                ))}
            </div>
        </div>
    );
}
