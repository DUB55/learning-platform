'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Zap, BookOpen, Brain, Target, Timer, Shuffle } from 'lucide-react';

export default function StudyModesPage() {
    return (
        <div className="h-full overflow-y-auto p-8 relative">


            <div className="max-w-6xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-3xl font-serif font-bold text-white mb-2">Study Modes</h1>
                    <p className="text-slate-400">Choose your learning style and practice effectively</p>
                </header>

                {/* Study Modes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Flashcards Mode */}
                    <Link href="/library">
                        <div className="glass-card p-6 hover:border-blue-500/50 transition-all cursor-pointer group">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Flashcards</h3>
                            <p className="text-slate-400 text-sm">Study with flashcards from your learning sets</p>
                        </div>
                    </Link>

                    {/* Practice Tests */}
                    <Link href="/subjects">
                        <div className="glass-card p-6 hover:border-purple-500/50 transition-all cursor-pointer group">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Target className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Practice Tests</h3>
                            <p className="text-slate-400 text-sm">AI-generated quizzes to test your knowledge</p>
                        </div>
                    </Link>

                    {/* AI Study Plans */}
                    <Link href="/dashboard/study-plans">
                        <div className="glass-card p-6 hover:border-green-500/50 transition-all cursor-pointer group">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Timer className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Study Plans</h3>
                            <p className="text-slate-400 text-sm">AI-generated personalized study schedules</p>
                        </div>
                    </Link>

                    {/* AI Chat Assistant */}
                    <Link href="/ai-chat">
                        <div className="glass-card p-6 hover:border-yellow-500/50 transition-all cursor-pointer group">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Brain className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">AI Chat</h3>
                            <p className="text-slate-400 text-sm">Get help from your AI study assistant</p>
                        </div>
                    </Link>

                    {/* Quick Review */}
                    <div className="glass-card p-6 opacity-50 cursor-not-allowed">
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center mb-4">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Quick Review</h3>
                        <p className="text-slate-400 text-sm">Coming soon - Rapid-fire review mode</p>
                    </div>

                    {/* Shuffle Mode */}
                    <div className="glass-card p-6 opacity-50 cursor-not-allowed">
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center mb-4">
                            <Shuffle className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Shuffle Mode</h3>
                        <p className="text-slate-400 text-sm">Coming soon - Random mixed practice</p>
                    </div>
                </div>

                {/* Tips Section */}
                <div className="mt-12 glass-card p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Study Tips</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-white font-medium mb-2">📚 Flashcards</h3>
                            <p className="text-slate-400 text-sm">Best for memorization and quick recall practice</p>
                        </div>
                        <div>
                            <h3 className="text-white font-medium mb-2">🎯 Practice Tests</h3>
                            <p className="text-slate-400 text-sm">Ideal for exam preparation and knowledge assessment</p>
                        </div>
                        <div>
                            <h3 className="text-white font-medium mb-2">📅 Study Plans</h3>
                            <p className="text-slate-400 text-sm">Great for structured, long-term learning goals</p>
                        </div>
                        <div>
                            <h3 className="text-white font-medium mb-2">🤖 AI Chat</h3>
                            <p className="text-slate-400 text-sm">Perfect for clarifying concepts and asking questions</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
