'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Clock, 
    Shield, 
    AlertTriangle, 
    CheckCircle2, 
    ChevronRight, 
    ChevronLeft,
    Flag,
    HelpCircle,
    Monitor,
    Lock
} from 'lucide-react';

export default function ExamSimulationPage() {
    const [started, setStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [flagged, setFlagged] = useState<number[]>([]);

    const questions = [
        {
            id: 1,
            text: "Which of the following best describes the 'Hyper-Personalized AI Engine' in the context of the 2026 Learning Platform?",
            options: [
                "A system that provides static video content based on user preference.",
                "An advanced AI that identifies individual skill gaps and continuously adapts learning journeys.",
                "A tool for automating administrative tasks like grading only.",
                "A social mentorship matching algorithm."
            ]
        },
        {
            id: 2,
            text: "What are the three pillars of the platform's vision?",
            options: [
                "Accessibility, Flexibility, and Social Mentorship.",
                "Video Learning, Quizzes, and Certificates.",
                "Hyper-Personalization, Immersive Integration, and Skill-Based Analytics.",
                "Blockchain, VR, and Mobile-First Design."
            ]
        }
    ];

    useEffect(() => {
        if (started && timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [started, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!started) {
        return (
            <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden"
                >
                    <div className="bg-slate-900 p-8 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="w-8 h-8 text-blue-400" />
                            <h1 className="text-2xl font-bold">Secure Exam Environment</h1>
                        </div>
                        <p className="text-slate-400">
                            This is a simulated exam environment designed to mirror professional certification standards.
                        </p>
                    </div>

                    <div className="p-8">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Instructions & Requirements</h2>
                        <div className="space-y-4 mb-8">
                            <div className="flex gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <Clock className="w-6 h-6 text-blue-600 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-blue-900">Time Limit: 60 Minutes</p>
                                    <p className="text-sm text-blue-700">The timer will start as soon as you begin. Ensure you have a stable connection.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                <Monitor className="w-6 h-6 text-amber-600 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-amber-900">Proctored Session</p>
                                    <p className="text-sm text-amber-700">Leaving the window or switching tabs may lead to immediate disqualification.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                                <Lock className="w-6 h-6 text-purple-600 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-purple-900">Closed Book</p>
                                    <p className="text-sm text-purple-700">No external resources are permitted during this assessment.</p>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setStarted(true)}
                            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                        >
                            START ASSESSMENT <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Exam Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-900 text-white px-3 py-1 rounded-lg font-bold text-sm">
                        EXAM SIM
                    </div>
                    <div className="h-6 w-px bg-slate-200" />
                    <h1 className="text-slate-600 font-medium">Digital Learning Standards 2026</h1>
                </div>

                <div className="flex items-center gap-8">
                    <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-slate-900'}`}>
                        <Clock className="w-5 h-5" />
                        {formatTime(timeLeft)}
                    </div>
                    <button className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all text-sm">
                        FINISH ATTEMPT
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-12">
                    <div className="max-w-3xl mx-auto">
                        <div className="mb-8 flex items-center justify-between">
                            <span className="text-sm font-bold text-blue-600 uppercase tracking-wider">Question {currentQuestion + 1} of {questions.length}</span>
                            <button 
                                onClick={() => {
                                    if (flagged.includes(currentQuestion)) {
                                        setFlagged(flagged.filter(i => i !== currentQuestion));
                                    } else {
                                        setFlagged([...flagged, currentQuestion]);
                                    }
                                }}
                                className={`flex items-center gap-2 text-sm font-medium ${flagged.includes(currentQuestion) ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Flag className={`w-4 h-4 ${flagged.includes(currentQuestion) ? 'fill-current' : ''}`} />
                                {flagged.includes(currentQuestion) ? 'FLAGGED' : 'FLAG FOR REVIEW'}
                            </button>
                        </div>

                        <h2 className="text-2xl font-bold text-slate-900 mb-8 leading-tight">
                            {questions[currentQuestion].text}
                        </h2>

                        <div className="space-y-4">
                            {questions[currentQuestion].options.map((option, i) => (
                                <button 
                                    key={i}
                                    className="w-full p-6 text-left bg-white border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/50 rounded-2xl transition-all group flex items-start gap-4"
                                >
                                    <div className="w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-blue-500 flex-shrink-0 mt-1 flex items-center justify-center">
                                        <div className="w-3 h-3 rounded-full bg-blue-500 opacity-0 group-focus:opacity-100" />
                                    </div>
                                    <span className="text-slate-700 font-medium">{option}</span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-12 flex items-center justify-between">
                            <button 
                                disabled={currentQuestion === 0}
                                onClick={() => setCurrentQuestion(prev => prev - 1)}
                                className="flex items-center gap-2 px-6 py-3 text-slate-600 font-bold disabled:opacity-30"
                            >
                                <ChevronLeft className="w-5 h-5" /> PREVIOUS
                            </button>
                            <button 
                                onClick={() => currentQuestion < questions.length - 1 && setCurrentQuestion(prev => prev + 1)}
                                className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                            >
                                NEXT QUESTION <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </main>

                {/* Sidebar Navigation */}
                <aside className="w-80 bg-white border-l border-slate-200 p-8 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Exam Navigation</h3>
                    <div className="grid grid-cols-4 gap-3 mb-8">
                        {questions.map((_, i) => (
                            <button 
                                key={i}
                                onClick={() => setCurrentQuestion(i)}
                                className={`h-12 rounded-xl font-bold flex items-center justify-center border-2 transition-all relative
                                    ${currentQuestion === i ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}
                                `}
                            >
                                {i + 1}
                                {flagged.includes(i) && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="mt-auto space-y-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-600 text-sm mb-2">
                                <HelpCircle className="w-4 h-4" /> Need Help?
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                If you experience technical difficulties, please click the "Support" button below.
                            </p>
                        </div>
                        <button className="w-full py-3 border-2 border-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">
                            SUPPORT
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
}
