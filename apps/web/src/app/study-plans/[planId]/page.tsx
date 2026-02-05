'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
    ChevronLeft,
    Calendar,
    Clock,
    CheckCircle2,
    Circle,
    Play,
    RefreshCw,
    Sparkles,
    Award,
    Brain,
    Loader2,
    ArrowUp
} from 'lucide-react';
import { adjustLearningPath, checkForSpacedRepetition } from '@/app/actions/aiPaths';
import PracticeQuestionPlayer from '@/components/PracticeQuestions/PracticeQuestionPlayer';
import QuizPlayer from '@/components/quizzes/QuizPlayer';
import ErrorLogger from '@/lib/ErrorLogger';

export default function StudyPlanDetailsPage() {
    const { planId } = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [plan, setPlan] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [adjusting, setAdjusting] = useState(false);
    const [readinessScore, setReadinessScore] = useState<number | null>(null);

    // Player State
    const [activeEvent, setActiveEvent] = useState<any | null>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [playerMode, setPlayerMode] = useState<'practice' | 'quiz' | null>(null);

    useEffect(() => {
        if (user && planId) {
            fetchPlanDetails();
            checkForSpacedRepetition(planId as string, user.id);
        }
    }, [user, planId]);

    const fetchPlanDetails = async () => {
        setLoading(true);
        try {
            const { data: planData } = await supabase
                .from('study_plans')
                .select('*')
                .eq('id', planId as string)
                .single();

            if (planData) setPlan(planData);

            const { data: eventsData } = await supabase
                .from('study_plan_events')
                .select('*')
                .eq('plan_id', planId as string)
                .order('start_time', { ascending: true });

            if (eventsData) {
                setEvents(eventsData);
                
                // Calculate Readiness Score
                const completed = eventsData.filter((e: any) => e.is_completed).length;
                const total = eventsData.length;
                const completionRate = total > 0 ? (completed / total) * 100 : 0;
                
                // For study plans, we factor in completion (60%) and a base mastery (40%)
                // In a real app, we'd fetch quiz scores linked to these events
                const calculatedScore = Math.round((completionRate * 0.6) + 35); // 35 is base "potential"
                setReadinessScore(Math.min(calculatedScore, 100));

                try {
                    localStorage.setItem(`local_plan_events_${planId as string}`, JSON.stringify(eventsData));
                } catch {}
            } else {
                try {
                    const local = JSON.parse(localStorage.getItem(`local_plan_events_${planId as string}`) || '[]');
                    if (Array.isArray(local) && local.length > 0) {
                        setEvents(local);
                    }
                } catch {}
            }
        } catch (error) {
            ErrorLogger.error('Error fetching plan details', error);
            try {
                const local = JSON.parse(localStorage.getItem(`local_plan_events_${planId as string}`) || '[]');
                if (Array.isArray(local) && local.length > 0) {
                    setEvents(local);
                }
            } catch {}
        } finally {
            setLoading(false);
        }
    };

    const handleToggleComplete = async (eventId: string, currentStatus: boolean) => {
        const { error } = await (supabase
            .from('study_plan_events') as any)
            .update({ is_completed: !currentStatus })
            .eq('id', eventId);

        if (!error) {
            setEvents(prev => prev.map(e => e.id === eventId ? { ...e, is_completed: !currentStatus } : e));

            // If completed, trigger adjustment
            if (!currentStatus) {
                triggerAdjustment();
            }
        }
    };

    const triggerAdjustment = async () => {
        if (!user || !planId) return;
        setAdjusting(true);
        try {
            await adjustLearningPath(planId as string, user.id);
            // Refresh events to show potential new remedial steps
            const { data: newEvents } = await (supabase
                .from('study_plan_events') as any)
                .select('*')
                .eq('plan_id', planId as string)
                .order('start_time', { ascending: true });
            if (newEvents) setEvents(newEvents);
        } catch (error) {
            ErrorLogger.error('Error adjusting path', error);
        } finally {
            setAdjusting(false);
        }
    };

    const handleStartEvent = async (event: any) => {
        // Simple logic for now: if description mentions practice or quiz, fetch questions
        const isPractice = event.description?.toLowerCase().includes('practice');
        const isQuiz = event.description?.toLowerCase().includes('quiz');

        if (isPractice || isQuiz) {
            // For now, fetch random practice questions or specific ones if we had a link
            // In a real scenario, the event might have a learning_set_id
            const { data: qData } = await supabase
                .from('practice_questions')
                .select('*')
                .limit(5); // Example limit

            if (qData && qData.length > 0) {
                setQuestions(qData.map((q: any) => ({
                    id: q.id,
                    question_text: q.question_text,
                    question_type: q.question_type,
                    options: q.options,
                    correct_answer: q.correct_answer
                })));
                setActiveEvent(event);
                setPlayerMode(isQuiz ? 'quiz' : 'practice');
            } else {
                alert('No questions found for this step yet.');
            }
        } else {
            // Regular check for reading/video
            handleToggleComplete(event.id, event.is_completed);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    if (!plan) return <div className="p-8 text-white">Plan not found</div>;

    if (activeEvent && playerMode === 'practice') {
        return (
            <div className="p-8">
                <button onClick={() => {
                    setActiveEvent(null);
                    fetchPlanDetails();
                    triggerAdjustment();
                }} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white">
                    <ChevronLeft size={20} /> Back to Plan
                </button>
                <PracticeQuestionPlayer
                    questions={questions}
                    userId={user?.id}
                    learningSetId={activeEvent.id} // Re-using event ID as set ID for tracking if none exists
                    onExit={() => {
                        handleToggleComplete(activeEvent.id, false);
                        setActiveEvent(null);
                        triggerAdjustment();
                    }}
                />
            </div>
        );
    }

    useEffect(() => {
        if (plan) {
            try {
                const local = JSON.parse(localStorage.getItem('local_study_plans') || '[]');
                const entry = {
                    id: plan.id,
                    title: plan.title,
                    createdAt: plan.created_at
                };
                const filtered = local.filter((p: any) => p.id !== plan.id);
                filtered.unshift(entry);
                localStorage.setItem('local_study_plans', JSON.stringify(filtered.slice(0, 20)));
            } catch {}
        }
    }, [plan]);

    return (
        <div className="h-full p-8">
        <div className="h-full p-8">
                <button
                    onClick={() => router.push('/study-plans')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 group transition-colors"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Plans</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="lg:col-span-2 glass-card p-10 relative overflow-hidden">
                        {/* Background Glow */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/20 blur-[100px] rounded-full" />
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full" />

                        <div className="relative">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                    <Calendar className="w-6 h-6 text-white" />
                                </div>
                                <h1 className="text-4xl font-serif font-bold text-white tracking-tight">{plan.title}</h1>
                            </div>
                            <p className="text-xl text-slate-400 font-light mb-8 max-w-2xl">{plan.goal}</p>

                            <div className="flex flex-wrap gap-6 text-sm text-slate-400 border-t border-white/5 pt-8">
                                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                                    <Clock className="w-4 h-4 text-blue-400" />
                                    <span>{new Date(plan.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                    <span>{events.filter(e => e.is_completed).length} / {events.length} Completed</span>
                                </div>
                                {adjusting && (
                                    <div className="flex items-center gap-2 text-purple-400 animate-pulse">
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>AI adjusting path...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Predictive Readiness Card */}
                    <div className="glass-card p-8 border border-white/5 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Brain className="w-20 h-20 text-purple-500" />
                        </div>
                        
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-purple-400" />
                            Predictive Readiness
                        </h3>
                        
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-5xl font-black text-white leading-none">
                                {readinessScore || '--'}
                            </span>
                            <span className="text-slate-400 font-bold text-xl mb-1">%</span>
                        </div>
                        
                        <p className="text-xs text-slate-500 mb-6 uppercase tracking-widest font-bold">Estimated Exam Success</p>
                        
                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px] mb-6">
                            <div 
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                                style={{ width: `${readinessScore || 0}%` }}
                            />
                        </div>
                        
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                <ArrowUp className="w-4 h-4 text-emerald-400" />
                            </div>
                            <p className="text-[10px] text-slate-400 leading-tight">
                                {readinessScore && readinessScore > 70 
                                    ? "Your trajectory looks excellent. Focus on maintaining consistency."
                                    : "Complete more sessions to increase your predictive readiness score."}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-2xl font-serif font-bold text-white mb-6 flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-purple-400" />
                        Learning Journey
                    </h2>

                    {events.map((event, idx) => (
                        <div
                            key={event.id}
                            className={`glass-card p-6 flex items-center justify-between transition-all duration-300 group hover:border-white/20 ${event.is_completed ? 'opacity-60 grayscale-[0.5]' : ''}`}
                        >
                            <div className="flex items-center gap-6">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black ${event.is_completed ? 'bg-green-500/10 text-green-500 ring-2 ring-green-500/20' : 'bg-slate-800 text-slate-500 group-hover:bg-purple-500/10 group-hover:text-purple-400 transition-colors'
                                    }`}>
                                    {event.is_completed ? <CheckCircle2 size={24} /> : idx + 1}
                                </div>

                                <div>
                                    <h3 className={`text-xl font-bold transition-colors ${event.is_completed ? 'text-slate-400 line-through decoration-slate-600' : 'text-white'}`}>
                                        {event.title}
                                    </h3>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                        <div className="text-xs text-slate-400 font-medium bg-slate-800/50 px-2 py-0.5 rounded border border-white/5">
                                            {event.description?.split('\n')[0] || 'Learning Step'}
                                        </div>
                                    </div>
                                    {event.description?.includes('\n') && (
                                        <p className="text-sm text-slate-500 mt-3 font-light leading-relaxed max-w-lg">
                                            {event.description.split('\n').slice(1).join('\n')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {!event.is_completed && (
                                    <button
                                        onClick={() => handleStartEvent(event)}
                                        className="bg-white/5 hover:bg-white/10 text-white p-3 rounded-xl border border-white/10 transition-all active:scale-95 group-hover:border-purple-500/30"
                                        title="Start step"
                                    >
                                        <Play className="w-5 h-5 fill-current" />
                                    </button>
                                )}
                                <button
                                    onClick={() => handleToggleComplete(event.id, event.is_completed)}
                                    className={`p-3 rounded-xl transition-all border ${event.is_completed
                                        ? 'bg-green-500/20 border-green-500/30 text-green-400'
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30 hover:text-white'
                                        }`}
                                >
                                    {event.is_completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                </button>
                            </div>
                        </div>
                    ))}

                    {events.length === 0 && (
                        <div className="text-center py-20 glass-card">
                            <Circle className="w-10 h-10 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">No events found for this plan.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
