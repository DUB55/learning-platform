'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Trophy, ArrowLeft, Timer, Zap, Check, X, Sparkles, Flame, Plus, Minus, X as CloseIcon, Divide } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/contexts/AuthContext';

interface MathSprintProps {
    onExit: () => void;
    terms?: any[];
    focusMode?: boolean;
}

type Question = {
    text: string;
    answer: number;
    options: number[];
};

type MathOptions = {
    addition: boolean;
    subtraction: boolean;
    multiplication: boolean;
    division: boolean;
    tables: number[];
};

export default function MathSprint({ onExit, terms, focusMode }: MathSprintProps) {
    const { updateXP } = useAuth();
    const [question, setQuestion] = useState<Question | null>(null);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isActive, setIsActive] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [combo, setCombo] = useState(0);
    const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null);
    const [mathOptions, setMathOptions] = useState<MathOptions>({
        addition: true,
        subtraction: true,
        multiplication: true,
        division: false,
        tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    });
    const [showOptions, setShowOptions] = useState(true);

    const timerRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        const saved = localStorage.getItem('math_sprint_highscore');
        if (saved) setHighScore(parseInt(saved));
    }, []);

    const generateQuestion = useCallback(() => {
        const enabledOps = [];
        if (mathOptions.addition) enabledOps.push('+');
        if (mathOptions.subtraction) enabledOps.push('-');
        if (mathOptions.multiplication) enabledOps.push('*');
        if (mathOptions.division) enabledOps.push('/');

        if (enabledOps.length === 0) enabledOps.push('+');

        const op = enabledOps[Math.floor(Math.random() * enabledOps.length)];
        let a, b, answer;

        if (op === '*') {
            const table = mathOptions.tables[Math.floor(Math.random() * mathOptions.tables.length)] || 2;
            a = table;
            b = Math.floor(Math.random() * 12) + 1;
            answer = a * b;
        } else if (op === '/') {
            const table = mathOptions.tables[Math.floor(Math.random() * mathOptions.tables.length)] || 2;
            b = table;
            answer = Math.floor(Math.random() * 12) + 1;
            a = b * answer;
        } else {
            a = Math.floor(Math.random() * 90) + 10;
            b = Math.floor(Math.random() * 90) + 10;
            answer = op === '+' ? a + b : a - b;
        }

        const options = [answer];
        while (options.length < 4) {
            const offset = Math.floor(Math.random() * 10) - 5;
            const alt = answer + (offset === 0 ? 7 : offset);
            if (!options.includes(alt)) options.push(alt);
        }

        setQuestion({
            text: `${a} ${op === '*' ? '×' : op === '/' ? '÷' : op} ${b}`,
            answer,
            options: options.sort(() => Math.random() - 0.5)
        });
    }, [mathOptions]);

    const startGame = () => {
        setScore(0);
        setTimeLeft(30);
        setIsActive(true);
        setIsGameOver(false);
        setCombo(0);
        setLastResult(null);
        setShowOptions(false);
        generateQuestion();
    };

    const handleAnswer = (selected: number) => {
        if (!isActive || isGameOver) return;

        if (selected === question?.answer) {
            setScore(s => s + 10 * (1 + Math.floor(combo / 5)));
            setCombo(c => c + 1);
            setLastResult('correct');
            setTimeLeft(t => Math.min(30, t + 1));
            generateQuestion();
        } else {
            setCombo(0);
            setLastResult('wrong');
            setTimeLeft(t => Math.max(0, t - 3));
            setTimeout(() => setLastResult(null), 500);
        }
    };

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(t => {
                    if (t <= 0.1) {
                        setIsActive(false);
                        setIsGameOver(true);
                        
                        // Award XP based on score
                        if (score > 0) {
                            const xpAmount = Math.min(Math.floor(score / 5), 100); // Max 100 XP per run for math
                            updateXP(xpAmount, `Math Sprint - Score: ${score}`);
                        }

                        if (score > highScore) {
                            setHighScore(score);
                            localStorage.setItem('math_sprint_highscore', String(score));
                            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                        }
                        return 0;
                    }
                    return t - 0.1;
                });
            }, 100);
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft, score, highScore]);

    return (
        <div className="flex flex-col items-center p-6 w-full max-w-2xl mx-auto">
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-10 bg-white/5 p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
                <div className="flex gap-10">
                    <div className="text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Score</p>
                        <p className="text-3xl font-black text-white">{score}</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="relative w-32 h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                        <div
                            className={`absolute inset-y-0 left-0 transition-all duration-100 rounded-full ${timeLeft > 10 ? 'bg-blue-500' : timeLeft > 5 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                            style={{ width: `${(timeLeft / 30) * 100}%` }}
                        />
                    </div>
                    <div className="flex flex-col items-end">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Time</p>
                        <p className="text-xl font-black text-white font-mono">{timeLeft.toFixed(1)}s</p>
                    </div>
                </div>
            </div>

            {/* Game Arena */}
            <div className="relative w-full max-w-md bg-slate-900 border-4 border-slate-800 rounded-[3rem] p-10 shadow-2xl overflow-hidden mb-8">
                {/* Background Glow */}
                <div className={`absolute inset-0 transition-opacity duration-500 ${lastResult === 'correct' ? 'bg-emerald-500/5 opacity-100' : lastResult === 'wrong' ? 'bg-rose-500/5 opacity-100' : 'bg-transparent opacity-0'}`} />

                <div className="relative z-10 flex flex-col items-center">
                    {combo > 2 && (
                        <div className="flex items-center gap-2 mb-6 animate-bounce">
                            <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                            <span className="text-xs font-black text-orange-500 uppercase tracking-widest">{combo}x COMBO!</span>
                        </div>
                    )}

                    {!isActive && !isGameOver ? (
                        <div className="py-12 text-center">
                            <div className="p-6 bg-blue-500/10 rounded-full mb-8 inline-flex">
                                <Zap className="w-16 h-16 text-blue-500" />
                            </div>
                            <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">MATH SPRINT</h2>
                            <p className="text-slate-400 mb-10 max-w-xs mx-auto">Solve as many problems as you can before the timer runs out. Each correct answer adds time!</p>
                            <button onClick={startGame} className="bg-blue-600 hover:bg-blue-500 text-white font-black px-12 py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/30 active:scale-95 w-full text-lg uppercase tracking-widest">
                                START SPRINT
                            </button>
                        </div>
                    ) : isGameOver ? (
                        <div className="py-8 text-center animate-in zoom-in duration-500">
                            <Trophy className="w-20 h-20 text-yellow-500 mb-6 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)] mx-auto" />
                            <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">TIME'S UP!</h2>
                            <p className="text-slate-400 mb-8 font-medium">Final score: <span className="text-white font-black">{score}</span>. Your best is {highScore}.</p>
                            <button onClick={startGame} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-12 py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/30 w-full uppercase tracking-widest active:scale-95">
                                RUN AGAIN
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-4">Calculate Fast</p>
                            <h2 className="text-7xl font-black text-white mb-16 tracking-tight bg-gradient-to-br from-white to-slate-500 bg-clip-text text-transparent">
                                {question?.text}
                            </h2>

                            <div className="grid grid-cols-2 gap-4 w-full">
                                {question?.options.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleAnswer(opt)}
                                        className="py-6 rounded-3xl bg-white/5 border-2 border-white/5 hover:border-blue-500/50 hover:bg-white/10 text-2xl font-black text-white transition-all active:scale-95 shadow-lg group relative overflow-hidden"
                                    >
                                        <div className="relative z-10">{opt}</div>
                                        <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 text-slate-700 font-bold opacity-30 animate-pulse">
                <Sparkles className="w-4 h-4" />
                <p className="text-[10px] uppercase tracking-[0.5em]">Mental calculus under extreme pressure</p>
            </div>
        </div>
    );
}
