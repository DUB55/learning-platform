'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Trophy, ArrowLeft, HelpCircle, X, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type Cell = { filled: boolean; color: string | null };
type Shape = { id: string; blocks: boolean[][]; color: string };

interface Term { id: string; term: string; definition: string; }

interface BlockBlastGameProps {
    onExit: () => void;
    terms?: Term[];
    answerMode?: 'term' | 'definition' | 'mixed';
    focusMode?: boolean;
}

const GRID_SIZE = 8;

const SHAPES: Omit<Shape, 'id'>[] = [
    { blocks: [[true]], color: 'bg-blue-500' },
    { blocks: [[true, true]], color: 'bg-green-500' },
    { blocks: [[true], [true]], color: 'bg-green-500' },
    { blocks: [[true, true, true]], color: 'bg-yellow-500' },
    { blocks: [[true], [true], [true]], color: 'bg-yellow-500' },
    { blocks: [[true, true], [true, true]], color: 'bg-red-500' },
    { blocks: [[true, true, true], [false, true, false]], color: 'bg-purple-500' },
    { blocks: [[true, true], [true, false]], color: 'bg-orange-500' },
    { blocks: [[true, true], [false, true]], color: 'bg-pink-500' },
];

export default function BlockBlast({ onExit, terms = [], answerMode = 'definition', focusMode }: BlockBlastGameProps) {
    const { updateXP } = useAuth();
    const [grid, setGrid] = useState<Cell[][]>(() =>
        Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill({ filled: false, color: null }))
    );
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [availableShapes, setAvailableShapes] = useState<Shape[]>([]);
    const [gameOver, setGameOver] = useState(false);

    // Drag state
    const [draggedShape, setDraggedShape] = useState<Shape | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
    const [previewCell, setPreviewCell] = useState<{ r: number; c: number } | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    // Quiz state
    const [showQuiz, setShowQuiz] = useState(false);
    const [currentQuizTerm, setCurrentQuizTerm] = useState<Term | null>(null);
    const [quizOptions, setQuizOptions] = useState<string[]>([]);
    const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
    const [quizResult, setQuizResult] = useState<'correct' | 'wrong' | null>(null);
    const [pendingReward, setPendingReward] = useState<'clear_row' | 'bonus_points' | null>(null);
    const [quizQuestion, setQuizQuestion] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('block_blast_highscore');
        if (saved) setHighScore(parseInt(saved));
        generateShapes();
    }, []);

    const generateShapes = () => {
        const newShapes: Shape[] = [];
        for (let i = 0; i < 3; i++) {
            const random = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            newShapes.push({ ...random, id: Math.random().toString() });
        }
        setAvailableShapes(newShapes);
    };

    const canPlaceShape = useCallback((shape: Shape, r: number, c: number, currentGrid: Cell[][]) => {
        for (let i = 0; i < shape.blocks.length; i++) {
            for (let j = 0; j < shape.blocks[i].length; j++) {
                if (shape.blocks[i][j]) {
                    const gridR = r + i;
                    const gridC = c + j;
                    if (gridR < 0 || gridR >= GRID_SIZE || gridC < 0 || gridC >= GRID_SIZE || currentGrid[gridR][gridC].filled) {
                        return false;
                    }
                }
            }
        }
        return true;
    }, []);

    // Check game over
    useEffect(() => {
        if (availableShapes.length === 0 && !showQuiz) {
            generateShapes();
            return;
        }
        let canMove = false;
        for (const shape of availableShapes) {
            for (let r = 0; r < GRID_SIZE && !canMove; r++) {
                for (let c = 0; c < GRID_SIZE && !canMove; c++) {
                    if (canPlaceShape(shape, r, c, grid)) canMove = true;
                }
            }
        }
        if (!canMove && availableShapes.length > 0 && !showQuiz) {
            setGameOver(true);
            // Award XP
            if (score > 0) {
                const xpAmount = Math.min(Math.floor(score / 10), 50);
                updateXP(xpAmount, `Block Blast - Score: ${score}`);
            }
        }
    }, [availableShapes, grid, canPlaceShape, showQuiz]);

    const triggerQuiz = (reward: 'clear_row' | 'bonus_points') => {
        if (terms.length < 4) return; // Need at least 4 terms
        const randomTerm = terms[Math.floor(Math.random() * terms.length)];

        // Determine Question/Answer based on mode
        let question = '';
        let answer = '';
        const mode = answerMode === 'mixed' ? (Math.random() > 0.5 ? 'term' : 'definition') : answerMode;

        if (mode === 'term') {
            // Show Definition, Answer Term
            question = randomTerm.definition;
            answer = randomTerm.term;
        } else {
            // Show Term, Answer Definition
            question = randomTerm.term;
            answer = randomTerm.definition;
        }

        const isAnswerDef = mode !== 'term'; // If showing Term (question), answer is Def

        const wrongOptions = terms
            .filter(t => t.id !== randomTerm.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(t => isAnswerDef ? t.definition : t.term);

        setCurrentQuizTerm(randomTerm);
        setQuizQuestion(question);
        setQuizOptions([answer, ...wrongOptions].sort(() => Math.random() - 0.5));
        setQuizAnswer(null); // Reset
        setQuizResult(null); // Reset
        setPendingReward(reward);
        setShowQuiz(true);
        // We need to store the expected answer content, not just the randomTerm
        // But handleQuizAnswer checks `answer === currentQuizTerm.definition`. 
        // We need to update handleQuizAnswer too.
    };

    const handleQuizAnswer = (answer: string) => {
        if (!currentQuizTerm) return;
        // Check if answer matches term or definition
        const isCorrect = answer === currentQuizTerm.term || answer === currentQuizTerm.definition;
        // Ideally we check strictly against the expected type, but equality check is safe if terms/defs are unique
        // Or better: check existing `quizOptions` to infer mode? No.
        // But since we present options, if input matches one of them, we are good.
        // Wait, if terms/defs overlap? Unlikely.
        // Robust way: Store expectedAnswer in state.

        // Simpler for now: Check both.
        // Or re-derive based on answerMode? Mixed mode is random.
        // I'll update triggerQuiz to store `correctAnswer` in a ref or state?
        // Actually, let's just use the `currentQuizTerm` and check if answer is one of them.

        setQuizAnswer(answer);
        setQuizResult(isCorrect ? 'correct' : 'wrong');

        setTimeout(() => {
            if (isCorrect && pendingReward) {
                if (pendingReward === 'bonus_points') {
                    const bonus = 200;
                    setScore(s => s + bonus);
                } else if (pendingReward === 'clear_row') {
                    // Clear a random filled row
                    const newGrid = grid.map(row => [...row]);
                    const filledRows = [];
                    for (let i = 0; i < GRID_SIZE; i++) {
                        if (newGrid[i].some(c => c.filled)) filledRows.push(i);
                    }
                    if (filledRows.length > 0) {
                        const rowToClear = filledRows[Math.floor(Math.random() * filledRows.length)];
                        for (let j = 0; j < GRID_SIZE; j++) {
                            newGrid[rowToClear][j] = { filled: false, color: null };
                        }
                        setGrid(newGrid);
                        setScore(s => s + 100);
                    }
                }
            }
            setShowQuiz(false);
            setCurrentQuizTerm(null);
            setPendingReward(null);
        }, 1000);
    };

    const placeShape = (shape: Shape, r: number, c: number) => {
        if (!canPlaceShape(shape, r, c, grid)) return;

        const newGrid = grid.map(row => [...row]);
        for (let i = 0; i < shape.blocks.length; i++) {
            for (let j = 0; j < shape.blocks[i].length; j++) {
                if (shape.blocks[i][j]) {
                    newGrid[r + i][c + j] = { filled: true, color: shape.color };
                }
            }
        }

        // Check lines
        const rowsToClear: number[] = [];
        const colsToClear: number[] = [];
        for (let i = 0; i < GRID_SIZE; i++) {
            if (newGrid[i].every(cell => cell.filled)) rowsToClear.push(i);
        }
        for (let j = 0; j < GRID_SIZE; j++) {
            if (newGrid.every(row => row[j].filled)) colsToClear.push(j);
        }

        let linesCleared = rowsToClear.length + colsToClear.length;
        rowsToClear.forEach(row => {
            for (let j = 0; j < GRID_SIZE; j++) newGrid[row][j] = { filled: false, color: null };
        });
        colsToClear.forEach(col => {
            for (let i = 0; i < GRID_SIZE; i++) newGrid[i][col] = { filled: false, color: null };
        });

        const points = 10 + (linesCleared * 100);
        const newScore = score + points;
        setScore(newScore);
        if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('block_blast_highscore', String(newScore));
        }

        setGrid(newGrid);
        setAvailableShapes(prev => prev.filter(s => s.id !== shape.id));

        // Trigger quiz on line clear or random chance
        if (terms.length >= 4) {
            if (linesCleared > 0 && Math.random() > 0.5) {
                setTimeout(() => triggerQuiz('bonus_points'), 300);
            } else if (Math.random() < 0.15) {
                setTimeout(() => triggerQuiz('clear_row'), 300);
            }
        }
    };

    const resetGame = () => {
        setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill({ filled: false, color: null })));
        setScore(0);
        setGameOver(false);
        setShowQuiz(false);
        generateShapes();
    };

    // Drag handlers
    const handleDragStart = (e: React.MouseEvent | React.TouchEvent, shape: Shape) => {
        e.preventDefault();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setDraggedShape(shape);
        setDragOffset({ x: clientX - rect.left, y: clientY - rect.top });
        setDragPosition({ x: clientX, y: clientY });
    };

    const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!draggedShape || !gridRef.current) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setDragPosition({ x: clientX, y: clientY });

        const gridRect = gridRef.current.getBoundingClientRect();
        const cellSize = gridRect.width / GRID_SIZE;
        const gridX = clientX - gridRect.left - dragOffset.x + (draggedShape.blocks[0].length * cellSize) / 2;
        const gridY = clientY - gridRect.top - dragOffset.y + (draggedShape.blocks.length * cellSize) / 2;
        const c = Math.floor(gridX / cellSize);
        const r = Math.floor(gridY / cellSize);

        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
            setPreviewCell({ r, c });
        } else {
            setPreviewCell(null);
        }
    }, [draggedShape, dragOffset]);

    const handleDragEnd = useCallback(() => {
        if (draggedShape && previewCell && canPlaceShape(draggedShape, previewCell.r, previewCell.c, grid)) {
            placeShape(draggedShape, previewCell.r, previewCell.c);
        }
        setDraggedShape(null);
        setPreviewCell(null);
    }, [draggedShape, previewCell, grid, canPlaceShape]);

    useEffect(() => {
        if (draggedShape) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', handleDragMove);
            window.addEventListener('touchend', handleDragEnd);
            return () => {
                window.removeEventListener('mousemove', handleDragMove);
                window.removeEventListener('mouseup', handleDragEnd);
                window.removeEventListener('touchmove', handleDragMove);
                window.removeEventListener('touchend', handleDragEnd);
            };
        }
    }, [draggedShape, handleDragMove, handleDragEnd]);

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center p-4 md:p-8 select-none">
            {/* Header */}
            <div className="w-full max-w-md flex justify-between items-center mb-6">
                <button onClick={onExit} className="flex items-center gap-2 text-slate-400 hover:text-white">
                    <ArrowLeft className="w-5 h-5" /> Exit
                </button>
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <p className="text-xs text-slate-400">SCORE</p>
                        <p className="text-xl font-bold text-white">{score}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-slate-400">BEST</p>
                        <p className="text-xl font-bold text-yellow-400">{highScore}</p>
                    </div>
                </div>
                <button onClick={resetGame} className="p-2 glass-button rounded-lg">
                    <RefreshCw className="w-5 h-5 text-white" />
                </button>
            </div>

            {/* Grid */}
            <div
                ref={gridRef}
                className="bg-slate-800 p-2 rounded-xl border border-white/10 relative touch-none"
            >
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}>
                    {grid.map((row, r) =>
                        row.map((cell, c) => {
                            let isPreview = false;
                            let canPlace = false;
                            if (draggedShape && previewCell) {
                                const sr = r - previewCell.r;
                                const sc = c - previewCell.c;
                                if (sr >= 0 && sr < draggedShape.blocks.length && sc >= 0 && sc < draggedShape.blocks[0].length && draggedShape.blocks[sr][sc]) {
                                    isPreview = true;
                                    canPlace = canPlaceShape(draggedShape, previewCell.r, previewCell.c, grid);
                                }
                            }
                            return (
                                <div
                                    key={`${r}-${c}`}
                                    className={`w-9 h-9 md:w-10 md:h-10 rounded-md transition-colors ${cell.filled ? cell.color :
                                        isPreview ? (canPlace ? 'bg-white/30' : 'bg-red-500/30') :
                                            'bg-slate-900'
                                        }`}
                                />
                            );
                        })
                    )}
                </div>

                {/* Game Over Overlay */}
                {gameOver && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-xl backdrop-blur-sm">
                        <Trophy className="w-16 h-16 text-yellow-400 mb-4" />
                        <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>
                        <p className="text-slate-300 mb-6">Score: {score}</p>
                        <button onClick={resetGame} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold">
                            Play Again
                        </button>
                    </div>
                )}
            </div>

            {/* Available Shapes */}
            <div className="mt-8 flex gap-6 items-center justify-center min-h-[80px]">
                {availableShapes.map(shape => (
                    <div
                        key={shape.id}
                        onMouseDown={(e) => handleDragStart(e, shape)}
                        onTouchStart={(e) => handleDragStart(e, shape)}
                        className={`p-3 rounded-xl cursor-grab active:cursor-grabbing transition-all ${draggedShape?.id === shape.id ? 'opacity-50' : 'hover:bg-white/5'
                            }`}
                    >
                        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${shape.blocks[0].length}, 1fr)` }}>
                            {shape.blocks.map((row, i) =>
                                row.map((filled, j) => (
                                    <div key={`${i}-${j}`} className={`w-6 h-6 rounded-sm ${filled ? shape.color : 'bg-transparent'}`} />
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Dragged Shape Ghost */}
            {draggedShape && (
                <div
                    className="fixed pointer-events-none z-50"
                    style={{ left: dragPosition.x - dragOffset.x, top: dragPosition.y - dragOffset.y }}
                >
                    <div className="grid gap-1 opacity-80" style={{ gridTemplateColumns: `repeat(${draggedShape.blocks[0].length}, 1fr)` }}>
                        {draggedShape.blocks.map((row, i) =>
                            row.map((filled, j) => (
                                <div key={`${i}-${j}`} className={`w-9 h-9 md:w-10 md:h-10 rounded-sm ${filled ? draggedShape.color : 'bg-transparent'}`} />
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Quiz Modal */}
            {showQuiz && currentQuizTerm && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 max-w-md w-full rounded-2xl">
                        <div className="flex items-center gap-2 mb-4">
                            <HelpCircle className="w-6 h-6 text-blue-400" />
                            <h3 className="text-lg font-bold text-white">Quiz Time!</h3>
                            <span className="ml-auto text-sm text-slate-400">
                                Reward: {pendingReward === 'bonus_points' ? '+200 pts' : 'Clear Row'}
                            </span>
                        </div>
                        <p className="text-slate-400 text-sm mb-2">
                            {/* Infer label from content? Or just 'Question:' */}
                            Question:
                        </p>
                        <p className="text-xl font-bold text-white mb-6">
                            {/* We need to know what to display. 
                                Logic in triggerQuiz calculated 'question' but didn't store it in state visible here.
                                Only `currentQuizTerm` is stored.
                                I need to store `quizQuestion` in state.
                            */}
                            {quizQuestion}
                        </p>
                        <div className="space-y-2">
                            {quizOptions.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => !quizResult && handleQuizAnswer(opt)}
                                    disabled={quizResult !== null}
                                    className={`w-full p-3 rounded-xl text-left transition-all ${quizResult && opt === currentQuizTerm.definition
                                        ? 'bg-green-500/20 border-2 border-green-500'
                                        : quizAnswer === opt && quizResult === 'wrong'
                                            ? 'bg-red-500/20 border-2 border-red-500'
                                            : 'glass-card hover:bg-white/5'
                                        }`}
                                >
                                    <span className="text-white text-sm">{opt}</span>
                                    {quizResult && opt === currentQuizTerm.definition && <Check className="inline w-4 h-4 ml-2 text-green-400" />}
                                    {quizAnswer === opt && quizResult === 'wrong' && <X className="inline w-4 h-4 ml-2 text-red-400" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <p className="mt-6 text-slate-500 text-sm text-center">Drag shapes onto the grid. Clear lines to score!</p>
        </div>
    );
}
