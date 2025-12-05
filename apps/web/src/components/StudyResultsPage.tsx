'use client';

import { useState } from 'react';
import { Trophy, RotateCcw, ChevronDown, ArrowLeft, Target, Clock, Zap } from 'lucide-react';

type StudyMode = 'flashcards' | 'multiple-choice' | 'writing' | 'learning' | 'test' | 'match' | 'play';

interface StudyResults {
    mode: StudyMode;
    totalItems: number;
    correctAnswers: number;
    timeSpent: number; // in seconds
    date: Date;
}

interface StudyResultsPageProps {
    results: StudyResults;
    onStudyAgain: () => void;
    onSelectMode: (mode: StudyMode) => void;
    onExit: () => void;
}

const MODE_LABELS: Record<StudyMode, string> = {
    'flashcards': 'Flashcards',
    'multiple-choice': 'Multiple Choice',
    'writing': 'Writing',
    'learning': 'Learning',
    'test': 'Test',
    'match': 'Match',
    'play': 'Play'
};

export default function StudyResultsPage({ results, onStudyAgain, onSelectMode, onExit }: StudyResultsPageProps) {
    const [showModeDropdown, setShowModeDropdown] = useState(false);

    const percentage = Math.round((results.correctAnswers / results.totalItems) * 100);
    const grade = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F';
    const gradeColor = percentage >= 90 ? 'text-green-400' : percentage >= 70 ? 'text-yellow-400' : 'text-red-400';

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-8">
            <div className="max-w-lg w-full">
                {/* Header */}
                <button onClick={onExit} className="flex items-center gap-2 text-slate-400 hover:text-white mb-8">
                    <ArrowLeft className="w-4 h-4" /> Back to Learning Set
                </button>

                {/* Trophy/Results Card */}
                <div className="glass-card p-8 text-center mb-6">
                    <div className="mb-6">
                        <Trophy className={`w-20 h-20 mx-auto mb-4 ${gradeColor}`} />
                        <h1 className="text-4xl font-bold text-white mb-2">
                            {percentage}%
                        </h1>
                        <p className="text-slate-400">
                            {results.correctAnswers} of {results.totalItems} correct
                        </p>
                    </div>

                    {/* Grade Badge */}
                    <div className={`inline-block px-6 py-2 rounded-full text-2xl font-bold ${percentage >= 90 ? 'bg-green-500/20 text-green-400' :
                            percentage >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                        }`}>
                        Grade: {grade}
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="glass-card p-4 text-center">
                        <Target className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                        <p className="text-lg font-bold text-white">{results.correctAnswers}</p>
                        <p className="text-xs text-slate-400">Correct</p>
                    </div>
                    <div className="glass-card p-4 text-center">
                        <Zap className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                        <p className="text-lg font-bold text-white">{results.totalItems - results.correctAnswers}</p>
                        <p className="text-xs text-slate-400">Missed</p>
                    </div>
                    <div className="glass-card p-4 text-center">
                        <Clock className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                        <p className="text-lg font-bold text-white">{formatTime(results.timeSpent)}</p>
                        <p className="text-xs text-slate-400">Time</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    {/* Study Again Button */}
                    <button
                        onClick={onStudyAgain}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-medium text-lg flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-5 h-5" />
                        Study Again ({MODE_LABELS[results.mode]})
                    </button>

                    {/* Mode Selection Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowModeDropdown(!showModeDropdown)}
                            className="w-full glass-button py-4 rounded-xl font-medium text-lg flex items-center justify-center gap-2"
                        >
                            Choose Different Mode
                            <ChevronDown className={`w-5 h-5 transition-transform ${showModeDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showModeDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-2 glass-card rounded-xl overflow-hidden z-10">
                                {(Object.keys(MODE_LABELS) as StudyMode[]).filter(m => m !== 'play').map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => {
                                            onSelectMode(mode);
                                            setShowModeDropdown(false);
                                        }}
                                        className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors ${mode === results.mode ? 'text-blue-400' : 'text-white'
                                            }`}
                                    >
                                        {MODE_LABELS[mode]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Encouragement Message */}
                <p className="text-center text-slate-500 mt-6 text-sm">
                    {percentage >= 90 ? '🎉 Outstanding! Keep up the great work!' :
                        percentage >= 70 ? '👍 Good job! A little more practice will make perfect.' :
                            '💪 Keep practicing! You\'ll get better with each session.'}
                </p>
            </div>
        </div>
    );
}
