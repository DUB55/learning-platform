'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Zap, Brain, Clock, ChevronRight, Play } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function StudyPage() {
    const { user } = useAuth();
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchSubjects();
        }
    }, [user]);

    const fetchSubjects = async () => {
        try {
            const { data } = await (supabase.from('subjects') as any)
                .select('*, chapters(count)')
                .order('created_at', { ascending: false });

            if (data) setSubjects(data);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto relative p-8">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-10">
                        <h1 className="text-3xl font-serif font-bold text-white mb-2">Study Mode</h1>
                        <p className="text-slate-400">Choose a subject to start your learning session</p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        <div className="glass-card p-6 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-center hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group">
                            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Zap className="w-8 h-8 text-yellow-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">Quick Review</h3>
                            <p className="text-slate-400 text-sm">Mix all subjects for a quick test</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
