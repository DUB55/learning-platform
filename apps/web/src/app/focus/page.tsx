'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
    Play, Pause, RotateCcw, Settings, Volume2, VolumeX,
    Coffee, Brain, Zap, Target, Clock, ArrowLeft
} from 'lucide-react';

const AMBIENT_SOUNDS = [
    { id: 'rain', name: 'Rain', emoji: '🌧️' },
    { id: 'cafe', name: 'Café', emoji: '☕' },
    { id: 'library', name: 'Library', emoji: '📚' },
    { id: 'nature', name: 'Nature', emoji: '🌳' },
    { id: 'white-noise', name: 'White Noise', emoji: '📻' },
];

const TIMER_PRESETS = [
    { name: 'Pomodoro', work: 25, break: 5, longBreak: 15, sessions: 4 },
    { name: 'Deep Work', work: 50, break: 10, longBreak: 30, sessions: 2 },
    { name: 'Quick Focus', work: 15, break: 3, longBreak: 10, sessions: 6 },
    { name: 'Custom', work: 25, break: 5, longBreak: 15, sessions: 4 },
];

type TimerPhase = 'work' | 'break' | 'longBreak';

export default function FocusModePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [preset, setPreset] = useState(TIMER_PRESETS[0]);
    const [phase, setPhase] = useState<TimerPhase>('work');
    const [timeLeft, setTimeLeft] = useState(preset.work * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [sessionsCompleted, setSessionsCompleted] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [selectedSound, setSelectedSound] = useState(AMBIENT_SOUNDS[0]);
    const [totalFocusTime, setTotalFocusTime] = useState(0);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handlePhaseComplete();
                        return 0;
                    }
                    if (phase === 'work') {
                        setTotalFocusTime(t => t + 1);
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning, phase]);

    const handlePhaseComplete = useCallback(() => {
        setIsRunning(false);

        // Play notification sound
        if (typeof window !== 'undefined') {
            const audio = new Audio('/sounds/bell.mp3');
            audio.play().catch(() => { });
        }

        if (phase === 'work') {
            const newSessionsCompleted = sessionsCompleted + 1;
            setSessionsCompleted(newSessionsCompleted);

            if (newSessionsCompleted % preset.sessions === 0) {
                setPhase('longBreak');
                setTimeLeft(preset.longBreak * 60);
            } else {
                setPhase('break');
                setTimeLeft(preset.break * 60);
            }
        } else {
            setPhase('work');
            setTimeLeft(preset.work * 60);
        }
    }, [phase, sessionsCompleted, preset]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const resetTimer = () => {
        setIsRunning(false);
        setPhase('work');
        setTimeLeft(preset.work * 60);
        setSessionsCompleted(0);
    };

    const selectPreset = (newPreset: typeof TIMER_PRESETS[0]) => {
        setPreset(newPreset);
        setPhase('work');
        setTimeLeft(newPreset.work * 60);
        setIsRunning(false);
    };

    const phaseColors = {
        work: 'from-blue-500 to-purple-500',
        break: 'from-emerald-500 to-teal-500',
        longBreak: 'from-orange-500 to-amber-500',
    };

    const phaseLabels = {
        work: 'Focus Time',
        break: 'Short Break',
        longBreak: 'Long Break',
    };

    const progress = phase === 'work'
        ? ((preset.work * 60 - timeLeft) / (preset.work * 60)) * 100
        : phase === 'break'
            ? ((preset.break * 60 - timeLeft) / (preset.break * 60)) * 100
            : ((preset.longBreak * 60 - timeLeft) / (preset.longBreak * 60)) * 100;

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto">
            <div className="p-8 max-w-4xl mx-auto relative">

                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Back</span>
                    </button>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`p-3 rounded-xl transition-all ${soundEnabled ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-400'
                                }`}
                        >
                            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        </button>
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="p-3 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all"
                        >
                            <Settings size={20} />
                        </button>
                    </div>
                </div>

                {/* Timer Display */}
                <div className="text-center mb-12">
                    <div className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${phaseColors[phase]} text-white text-sm font-medium mb-6`}>
                        {phaseLabels[phase]}
                    </div>

                    <div className="relative w-80 h-80 mx-auto mb-8">
                        {/* Progress Ring */}
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="160"
                                cy="160"
                                r="150"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-slate-800"
                            />
                            <circle
                                cx="160"
                                cy="160"
                                r="150"
                                stroke="url(#gradient)"
                                strokeWidth="8"
                                fill="transparent"
                                strokeLinecap="round"
                                strokeDasharray={2 * Math.PI * 150}
                                strokeDashoffset={2 * Math.PI * 150 * (1 - progress / 100)}
                                className="transition-all duration-1000"
                            />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Timer Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-7xl font-bold text-white font-mono tracking-wider">
                                {formatTime(timeLeft)}
                            </span>
                            <span className="text-slate-400 mt-2">
                                Session {sessionsCompleted + 1} of {preset.sessions}
                            </span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-6">
                        <button
                            onClick={resetTimer}
                            className="p-4 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                        >
                            <RotateCcw size={24} />
                        </button>
                        <button
                            onClick={() => setIsRunning(!isRunning)}
                            className={`p-6 rounded-2xl bg-gradient-to-r ${phaseColors[phase]} text-white shadow-lg hover:opacity-90 transition-all transform hover:scale-105`}
                        >
                            {isRunning ? <Pause size={32} /> : <Play size={32} />}
                        </button>
                        <button
                            onClick={() => {
                                if (phase === 'work') {
                                    setPhase('break');
                                    setTimeLeft(preset.break * 60);
                                } else {
                                    setPhase('work');
                                    setTimeLeft(preset.work * 60);
                                }
                                setIsRunning(false);
                            }}
                            className="p-4 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                        >
                            <Coffee size={24} />
                        </button>
                    </div>
                </div>

                {/* Presets */}
                <div className="glass-card p-6 mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Timer Presets</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {TIMER_PRESETS.slice(0, 3).map((p) => (
                            <button
                                key={p.name}
                                onClick={() => selectPreset(p)}
                                className={`p-4 rounded-xl transition-all ${preset.name === p.name
                                    ? 'bg-blue-500/20 border border-blue-500/50 text-white'
                                    : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
                                    }`}
                            >
                                <div className="font-medium">{p.name}</div>
                                <div className="text-sm opacity-75">{p.work}m / {p.break}m</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass-card p-4 text-center">
                        <Brain className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">{sessionsCompleted}</div>
                        <div className="text-xs text-slate-400">Sessions</div>
                    </div>
                    <div className="glass-card p-4 text-center">
                        <Clock className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">{Math.floor(totalFocusTime / 60)}</div>
                        <div className="text-xs text-slate-400">Minutes Focused</div>
                    </div>
                    <div className="glass-card p-4 text-center">
                        <Zap className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">{sessionsCompleted * 25}</div>
                        <div className="text-xs text-slate-400">XP Earned</div>
                    </div>
                    <div className="glass-card p-4 text-center">
                        <Target className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">{Math.round(progress)}%</div>
                        <div className="text-xs text-slate-400">Current Progress</div>
                    </div>
                </div>

                {/* Ambient Sounds (shown when enabled) */}
                {soundEnabled && (
                    <div className="glass-card p-6 mt-8">
                        <h3 className="text-lg font-semibold text-white mb-4">Ambient Sounds</h3>
                        <div className="flex flex-wrap gap-3">
                            {AMBIENT_SOUNDS.map((sound) => (
                                <button
                                    key={sound.id}
                                    onClick={() => setSelectedSound(sound)}
                                    className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${selectedSound.id === sound.id
                                        ? 'bg-blue-500/20 border border-blue-500/50 text-white'
                                        : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
                                        }`}
                                >
                                    <span>{sound.emoji}</span>
                                    <span>{sound.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
