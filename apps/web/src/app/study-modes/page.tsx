'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

import { Zap, BookOpen, Brain, Target, Timer, Shuffle, ChevronDown } from 'lucide-react';

export default function StudyModesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [selectedMode, setSelectedMode] = useState<string | null>(null);
    const [studySets, setStudySets] = useState<any[]>([]);
    const [selectedSetId, setSelectedSetId] = useState<string>('');

    useEffect(() => {
        const fetchSets = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('leersets')
                .select('id, title')
                .eq('created_by', user.id);
            if (data) setStudySets(data);
        };
        fetchSets();
    }, [user]);
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
                    <div
                        className="glass-card p-6 hover:border-yellow-500/50 transition-all cursor-pointer group relative overflow-hidden"
                        onClick={() => {
                            setSelectedMode('Quick Review');
                            setConfirmOpen(true);
                        }}
                    >
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-600/50 to-orange-600/50 rounded-xl flex items-center justify-center mb-4">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Quick Review</h3>
                        <p className="text-slate-400 text-sm">Rapid-fire review mode to test your speed</p>
                    </div>

                    {/* Shuffle Mode */}
                    <div
                        className="glass-card p-6 hover:border-purple-500/50 transition-all cursor-pointer group relative overflow-hidden"
                        onClick={() => {
                            setSelectedMode('Shuffle Mode');
                            setConfirmOpen(true);
                        }}
                    >
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600/50 to-pink-600/50 rounded-xl flex items-center justify-center mb-4">
                            <Shuffle className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Shuffle Mode</h3>
                        <p className="text-slate-400 text-sm">Randomly mixed practice from all your subjects</p>
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
            {confirmOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-8 w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                            selectedMode === 'Quick Review' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-purple-500/20 text-purple-500'
                        }`}>
                            {selectedMode === 'Quick Review' ? <Zap className="w-8 h-8" /> : <Shuffle className="w-8 h-8" />}
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Start {selectedMode}</h3>
                        <p className="text-slate-400 mb-6 leading-relaxed">
                            {selectedMode === 'Quick Review' 
                                ? 'Test your speed with cards from all your subjects mixed together.' 
                                : 'Practice with a randomized selection of cards to truly test your knowledge.'}
                        </p>

                        <div className="mb-8">
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Select Learning Set (Optional)
                            </label>
                            <div className="relative group">
                                <select 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer group-hover:border-white/20"
                                    value={selectedSetId}
                                    onChange={(e) => setSelectedSetId(e.target.value)}
                                >
                                    <option value="" className="bg-slate-900">All Learning Sets</option>
                                    {studySets.map(set => (
                                        <option key={set.id} value={set.id} className="bg-slate-900">{set.title}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-white transition-colors" />
                            </div>
                            <p className="mt-2 text-[11px] text-slate-500 italic">
                                Leave as "All Learning Sets" to include everything.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => {
                                    setConfirmOpen(false);
                                    setSelectedSetId('');
                                }}
                                className="px-6 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    const path = selectedMode === 'Quick Review' ? '/study/quick-review' : '/study/shuffle';
                                    const query = selectedSetId ? `?setId=${selectedSetId}` : '';
                                    router.push(`${path}${query}`);
                                }}
                                className={`px-8 py-3 rounded-xl text-white font-bold transition-all shadow-lg ${
                                    selectedMode === 'Quick Review' 
                                        ? 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-600/20' 
                                        : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20'
                                }`}
                            >
                                Start Session
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
