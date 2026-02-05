'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import { Zap, Brain, Clock, ChevronRight, Play, BookOpen, Layers, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ErrorLogger from '@/lib/ErrorLogger';
import { useRouter } from 'next/navigation';

export default function StudyPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dueCount, setDueCount] = useState(0);
    const fetchControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (user) {
            const controller = new AbortController();
            fetchControllerRef.current = controller;
            
            fetchDueCount(controller.signal);
            fetchSubjects(controller.signal);

            return () => {
                controller.abort();
                fetchControllerRef.current = null;
            };
        }
    }, [user]);

    const fetchDueCount = async (signal?: AbortSignal) => {
        try {
            const now = new Date().toISOString();
            const { count, error } = await supabase
                .from('srs_items')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user!.id)
                .lte('next_review', now)
                .abortSignal(signal as any);

            if (error) {
                if (error.name === 'AbortError') return;
                console.error('Error fetching due count', error);
                return;
            }
            setDueCount(count || 0);
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            console.error('Error in fetchDueCount:', error);
        }
    };

    const fetchSubjects = async (signal?: AbortSignal) => {
        try {
            const { data, error } = await (supabase.from('subjects') as any)
                .select('*, chapters(count)')
                .order('created_at', { ascending: false })
                .abortSignal(signal as any);

            if (error) {
                if (error.name === 'AbortError') return;
                ErrorLogger.error('Error fetching subjects', error);
                return;
            }

            if (data) setSubjects(data);
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            ErrorLogger.error('Error in fetchSubjects:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full p-8 relative">


            <div className="max-w-7xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-3xl font-serif font-bold text-white mb-2">Study Mode</h1>
                    <p className="text-slate-400">Choose a subject to start your learning session</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Match Game Card */}
                    <div 
                        onClick={() => router.push('/study/match')}
                        className="glass-card p-8 border-none bg-gradient-to-br from-blue-600/20 to-indigo-600/20 relative overflow-hidden group cursor-pointer"
                    >
                        <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Sparkles className="w-24 h-24 text-white" />
                        </div>
                        <div className="relative">
                            <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 w-fit mb-4">
                                <Zap className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Match Game</h3>
                            <p className="text-slate-400 text-sm mb-6">Test je snelheid en kennis door termen met definities te matchen.</p>
                            <div className="flex items-center text-blue-400 font-bold group-hover:translate-x-2 transition-transform">
                                Start Match <ChevronRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>
                    </div>

                    {/* SRS Master Card */}
                    <div 
                        onClick={() => router.push('/study/srs')}
                        className="lg:col-span-2 glass-card p-8 border-none bg-gradient-to-r from-indigo-600/20 to-purple-600/20 relative overflow-hidden group cursor-pointer"
                    >
                        <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Layers className="w-32 h-32 text-white" />
                        </div>
                        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="flex items-start gap-6">
                                <div className="p-4 rounded-2xl bg-indigo-500/20 text-indigo-400">
                                    <Zap className="w-8 h-8" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Daily Review Session</h2>
                                    <p className="text-slate-300 max-w-md">
                                        Use the SM-2 algorithm to master your knowledge. 
                                        DUB5 has prepared your cards for today.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <div className="text-4xl font-black text-white">{dueCount}</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Due Today</div>
                                </div>
                                <button className="px-8 py-4 rounded-2xl bg-white text-indigo-900 font-bold hover:bg-indigo-50 transition-all flex items-center gap-2">
                                    Start Review
                                    <Play className="w-4 h-4 fill-current" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {subjects.map((subject) => (
                        <div key={subject.id} className="glass-card p-6 group hover:bg-white/5 transition-all duration-300">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform duration-300">
                                    <Brain className="w-6 h-6" />
                                </div>
                                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400">
                                    {subject.chapters[0]?.count || 0} chapters
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">{subject.title}</h3>
                            <p className="text-slate-400 text-sm mb-6 line-clamp-2">
                                Master this subject with flashcards and spaced repetition.
                            </p>

                            <button className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center justify-center gap-2 transition-colors group-hover:shadow-lg group-hover:shadow-blue-500/25">
                                <Play className="w-4 h-4 fill-current" />
                                <span>Start Session</span>
                            </button>
                        </div>
                    ))}

                    {/* Quick Start Card */}
                    <div 
                        onClick={() => router.push('/study/quick-review')}
                        className="glass-card p-6 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-center hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all cursor-pointer group"
                    >
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Zap className="w-8 h-8 text-yellow-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Quick Review</h3>
                        <p className="text-slate-400 text-sm">Mix all subjects for a quick test</p>
                    </div>
                </div>
            </div>

        </div>
    );
}
