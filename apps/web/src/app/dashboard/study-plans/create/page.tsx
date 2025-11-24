'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Sparkles, Calendar, Clock, CheckCircle2, BookOpen } from 'lucide-react';
import { dub5ai } from '@/lib/dub5ai';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';

export default function CreateStudyPlanPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toasts, showToast, hideToast, error: showError } = useToast();

    const [step, setStep] = useState<'input' | 'generating' | 'preview'>('input');
    const [goal, setGoal] = useState('');
    const [schedule, setSchedule] = useState('');
    const [generatedPlan, setGeneratedPlan] = useState<any>(null);

    const handleGenerate = async () => {
        if (!goal.trim() || !schedule.trim()) {
            showError('Please provide both a goal and your schedule availability.');
            return;
        }

        setStep('generating');
        try {
            const plan = await dub5ai.generateStudyPlan(goal, schedule);
            setGeneratedPlan(plan);
            setStep('preview');
        } catch (err: any) {
            console.error('Generation error:', err);
            showError('Failed to generate study plan. Please try again.');
            setStep('input');
        }
    };

    const handleSave = async () => {
        if (!user || !generatedPlan) return;

        try {
            // 1. Create Plan Record
            const { data: planData, error: planError } = await supabase
                .from('study_plans')
                .insert([{
                    user_id: user.id,
                    title: generatedPlan.title,
                    goal: goal,
                    start_date: new Date().toISOString()
                }])
                .select()
                .single();

            if (planError) throw planError;

            // 2. Create Events
            const events = generatedPlan.events.map((e: any) => ({
                plan_id: planData.id,
                title: e.title,
                start_time: e.start_time,
                end_time: e.end_time,
                description: e.description,
                is_completed: false
            }));

            const { error: eventsError } = await supabase
                .from('study_plan_events')
                .insert(events);

            if (eventsError) throw eventsError;

            showToast('Study plan saved successfully!', 'success');
            setTimeout(() => {
                router.push('/dashboard');
            }, 1000);

        } catch (err: any) {
            console.error('Save error:', err);
            showError('Failed to save study plan.');
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto relative p-8">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Dashboard</span>
                    </button>

                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-3xl font-serif font-bold text-white">AI Study Planner</h1>
                        </div>
                        <p className="text-slate-400">Create a personalized study schedule tailored to your goals and free time.</p>
                    </div>

                    {step === 'input' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="glass-card p-6">
                                <label className="block text-slate-400 text-sm mb-2">What is your main study goal?</label>
                                <input
                                    type="text"
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                    placeholder="e.g., Prepare for Calculus Final, Learn Spanish Basics, Master React Hooks"
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 mb-6"
                                />

                                <label className="block text-slate-400 text-sm mb-2">When are you available to study?</label>
                                <textarea
                                    value={schedule}
                                    onChange={(e) => setSchedule(e.target.value)}
                                    placeholder="e.g., Weekdays 6pm-8pm, Weekends 10am-2pm. I want to finish in 2 weeks."
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white h-32 resize-none focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <button
                                onClick={handleGenerate}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium py-4 rounded-xl transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
                            >
                                <Sparkles className="w-5 h-5" />
                                <span>Generate Study Plan</span>
                            </button>
                        </div>
                    )}

                    {step === 'generating' && (
                        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                            <div className="w-20 h-20 relative mb-8">
                                <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 animate-spin"></div>
                                <Calendar className="absolute inset-0 m-auto w-8 h-8 text-purple-400 animate-pulse" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Designing your schedule...</h2>
                            <p className="text-slate-400">Dub5 AI is organizing your time for maximum efficiency.</p>
                        </div>
                    )}

                    {step === 'preview' && generatedPlan && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="glass-card p-8 text-center">
                                <h2 className="text-2xl font-bold text-white mb-2">{generatedPlan.title}</h2>
                                <p className="text-slate-400 mb-6">Goal: {goal}</p>

                                <div className="flex justify-center gap-8 text-sm text-slate-400 mb-8">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-purple-400" />
                                        <span>{generatedPlan.events.length} Study Sessions</span>
                                    </div>
                                </div>

                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={() => setStep('input')}
                                        className="px-6 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        Discard & Try Again
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl transition-all shadow-lg shadow-green-500/25 flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        <span>Save to Calendar</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-slate-400 ml-2">Proposed Schedule</h3>
                                {generatedPlan.events.map((event: any, i: number) => (
                                    <div key={i} className="glass-card p-6 flex gap-4 items-start">
                                        <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex flex-col items-center justify-center text-purple-400 flex-shrink-0">
                                            <span className="text-xs font-bold uppercase">{new Date(event.start_time).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                            <span className="text-lg font-bold">{new Date(event.start_time).getDate()}</span>
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium text-lg">{event.title}</h4>
                                            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                                                <Clock className="w-3 h-3" />
                                                <span>
                                                    {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                    {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-slate-300 text-sm">{event.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => hideToast(toast.id)}
                    />
                ))}
            </main>
        </div>
    );
}
