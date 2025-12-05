'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Trophy, Check, X } from 'lucide-react';

interface Term { id: string; term: string; definition: string; }

interface FlappyBirdGameProps {
    onExit: () => void;
    terms?: Term[];
}

const GRAVITY = 0.5;
const JUMP_FORCE = -8;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const PIPE_SPEED = 3;
const BIRD_SIZE = 30;

interface Pipe {
    x: number;
    topHeight: number;
    passed: boolean;
    hasQuestion: boolean;
}

export default function FlappyBirdGame({ onExit, terms = [] }: FlappyBirdGameProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover' | 'quiz'>('ready');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);

    // Quiz state
    const [currentQuizTerm, setCurrentQuizTerm] = useState<Term | null>(null);
    const [quizOptions, setQuizOptions] = useState<string[]>([]);
    const [quizResult, setQuizResult] = useState<'correct' | 'wrong' | null>(null);

    // Game state refs (to avoid stale closures)
    const birdY = useRef(200);
    const birdVelocity = useRef(0);
    const pipes = useRef<Pipe[]>([]);
    const frameCount = useRef(0);
    const animationId = useRef<number>();

    useEffect(() => {
        const saved = localStorage.getItem('flappy_bird_highscore');
        if (saved) setHighScore(parseInt(saved));
    }, []);

    const resetGame = useCallback(() => {
        birdY.current = 200;
        birdVelocity.current = 0;
        pipes.current = [];
        frameCount.current = 0;
        setScore(0);
        setGameState('ready');
        setQuizResult(null);
        setCurrentQuizTerm(null);
    }, []);

    const jump = useCallback(() => {
        if (gameState === 'ready') {
            setGameState('playing');
        }
        if (gameState === 'playing' || gameState === 'ready') {
            birdVelocity.current = JUMP_FORCE;
        }
    }, [gameState]);

    const triggerQuiz = useCallback(() => {
        if (terms.length < 4) return false;
        const randomTerm = terms[Math.floor(Math.random() * terms.length)];
        const wrongOptions = terms
            .filter(t => t.id !== randomTerm.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(t => t.definition);
        setCurrentQuizTerm(randomTerm);
        setQuizOptions([randomTerm.definition, ...wrongOptions].sort(() => Math.random() - 0.5));
        setQuizResult(null);
        setGameState('quiz');
        return true;
    }, [terms]);

    const handleQuizAnswer = (answer: string) => {
        if (!currentQuizTerm) return;
        const isCorrect = answer === currentQuizTerm.definition;
        setQuizResult(isCorrect ? 'correct' : 'wrong');

        setTimeout(() => {
            if (isCorrect) {
                setScore(s => s + 5); // Bonus points
                setGameState('playing');
            } else {
                // Wrong answer = game over
                const newScore = score;
                if (newScore > highScore) {
                    setHighScore(newScore);
                    localStorage.setItem('flappy_bird_highscore', String(newScore));
                }
                setGameState('gameover');
            }
            setCurrentQuizTerm(null);
        }, 1000);
    };

    // Game loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const gameLoop = () => {
            if (gameState !== 'playing') {
                // Draw static frame
                drawGame(ctx, canvas);
                return;
            }

            frameCount.current++;

            // Update bird
            birdVelocity.current += GRAVITY;
            birdY.current += birdVelocity.current;

            // Generate pipes
            if (frameCount.current % 100 === 0) {
                const topHeight = Math.random() * (canvas.height - PIPE_GAP - 100) + 50;
                pipes.current.push({
                    x: canvas.width,
                    topHeight,
                    passed: false,
                    hasQuestion: terms.length >= 4 && Math.random() < 0.3
                });
            }

            // Update pipes
            pipes.current = pipes.current.filter(pipe => pipe.x > -PIPE_WIDTH);
            pipes.current.forEach(pipe => {
                pipe.x -= PIPE_SPEED;

                // Check passing
                if (!pipe.passed && pipe.x + PIPE_WIDTH < 50) {
                    pipe.passed = true;
                    setScore(s => s + 1);

                    // Trigger quiz on question pipes
                    if (pipe.hasQuestion && terms.length >= 4) {
                        triggerQuiz();
                    }
                }
            });

            // Collision detection
            const birdLeft = 50;
            const birdRight = 50 + BIRD_SIZE;
            const birdTop = birdY.current;
            const birdBottom = birdY.current + BIRD_SIZE;

            // Ground/ceiling collision
            if (birdTop < 0 || birdBottom > canvas.height) {
                const newScore = score;
                if (newScore > highScore) {
                    setHighScore(newScore);
                    localStorage.setItem('flappy_bird_highscore', String(newScore));
                }
                setGameState('gameover');
                return;
            }

            // Pipe collision
            for (const pipe of pipes.current) {
                const pipeLeft = pipe.x;
                const pipeRight = pipe.x + PIPE_WIDTH;

                if (birdRight > pipeLeft && birdLeft < pipeRight) {
                    if (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + PIPE_GAP) {
                        const newScore = score;
                        if (newScore > highScore) {
                            setHighScore(newScore);
                            localStorage.setItem('flappy_bird_highscore', String(newScore));
                        }
                        setGameState('gameover');
                        return;
                    }
                }
            }

            drawGame(ctx, canvas);
            animationId.current = requestAnimationFrame(gameLoop);
        };

        const drawGame = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
            // Background
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Pipes
            ctx.fillStyle = '#22c55e';
            pipes.current.forEach(pipe => {
                // Top pipe
                ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
                // Bottom pipe
                ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, canvas.height);

                // Question indicator
                if (pipe.hasQuestion && !pipe.passed) {
                    ctx.fillStyle = '#fbbf24';
                    ctx.font = 'bold 20px sans-serif';
                    ctx.fillText('?', pipe.x + PIPE_WIDTH / 2 - 6, pipe.topHeight + PIPE_GAP / 2 + 7);
                    ctx.fillStyle = '#22c55e';
                }
            });

            // Bird
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(50 + BIRD_SIZE / 2, birdY.current + BIRD_SIZE / 2, BIRD_SIZE / 2, 0, Math.PI * 2);
            ctx.fill();

            // Eye
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(50 + BIRD_SIZE / 2 + 5, birdY.current + BIRD_SIZE / 2 - 3, 4, 0, Math.PI * 2);
            ctx.fill();

            // Score
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 24px sans-serif';
            ctx.fillText(String(score), canvas.width / 2 - 10, 40);
        };

        if (gameState === 'playing') {
            animationId.current = requestAnimationFrame(gameLoop);
        } else {
            drawGame(ctx, canvas);
        }

        return () => {
            if (animationId.current) cancelAnimationFrame(animationId.current);
        };
    }, [gameState, score, highScore, terms, triggerQuiz]);

    // Keyboard/touch controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (gameState === 'gameover') resetGame();
                else jump();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, jump, resetGame]);

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center p-4 md:p-8">
            {/* Header */}
            <div className="w-full max-w-md flex justify-between items-center mb-4">
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

            {/* Game Canvas */}
            <div className="relative">
                <canvas
                    ref={canvasRef}
                    width={350}
                    height={500}
                    onClick={() => gameState === 'gameover' ? resetGame() : jump()}
                    onTouchStart={(e) => { e.preventDefault(); gameState === 'gameover' ? resetGame() : jump(); }}
                    className="rounded-xl border border-white/10 cursor-pointer touch-none"
                />

                {/* Overlays */}
                {gameState === 'ready' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-xl">
                        <h2 className="text-2xl font-bold text-white mb-4">Flappy Bird</h2>
                        <p className="text-slate-300 mb-6">Tap or Press Space to Start</p>
                    </div>
                )}

                {gameState === 'gameover' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl">
                        <Trophy className="w-16 h-16 text-yellow-400 mb-4" />
                        <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>
                        <p className="text-slate-300 mb-6">Score: {score}</p>
                        <button onClick={resetGame} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold">
                            Play Again
                        </button>
                    </div>
                )}
            </div>

            {/* Quiz Modal */}
            {gameState === 'quiz' && currentQuizTerm && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 max-w-md w-full rounded-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">🎯 Quick Quiz!</h3>
                        <p className="text-slate-400 text-sm mb-2">What is the definition of:</p>
                        <p className="text-xl font-bold text-white mb-6">{currentQuizTerm.term}</p>
                        <div className="space-y-2">
                            {quizOptions.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => !quizResult && handleQuizAnswer(opt)}
                                    disabled={quizResult !== null}
                                    className={`w-full p-3 rounded-xl text-left transition-all ${quizResult && opt === currentQuizTerm.definition
                                            ? 'bg-green-500/20 border-2 border-green-500'
                                            : quizResult === 'wrong' && opt !== currentQuizTerm.definition
                                                ? 'glass-card'
                                                : 'glass-card hover:bg-white/5'
                                        }`}
                                >
                                    <span className="text-white text-sm">{opt}</span>
                                    {quizResult && opt === currentQuizTerm.definition && <Check className="inline w-4 h-4 ml-2 text-green-400" />}
                                </button>
                            ))}
                        </div>
                        <p className="text-center text-slate-500 text-sm mt-4">
                            {quizResult === 'correct' ? '✓ Correct! +5 points' : quizResult === 'wrong' ? '✗ Wrong! Game Over' : 'Answer correctly to continue!'}
                        </p>
                    </div>
                </div>
            )}

            <p className="mt-4 text-slate-500 text-sm">Tap/Space to flap. Pass through ? pipes to answer questions!</p>
        </div>
    );
}
