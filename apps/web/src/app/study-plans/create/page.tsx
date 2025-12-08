'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

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
            const { data: planData, error: planError } = await supabase
                .from('study_plans')
                .insert([{
                    user_id: user.id,
                    title: generatedPlan.title,
                    goal: goal,
                    schedule: schedule
                }])
                .select()
                .single();

            if (planError) throw planError;

            // Save events
            if (generatedPlan.sessions && planData) {
                const events = generatedPlan.sessions.map((session: any) => ({
                    plan_id: planData.id,
                    title: session.title,
                    description: session.description,
                    start_time: session.start_time,
                    duration_minutes: session.duration_minutes || 60
                }));

                await supabase.from('study_plan_events').insert(events);
            }

            showToast('Study plan saved!', 'success');
            router.push('/study-plans');
        } catch (err: any) {
            console.error('Save error:', err);
            showError('Failed to save study plan');
        }
    };

    return (
        <div className="h-full overflow-y-auto p-8">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                </button>

                <h1 className="text-3xl font-serif font-bold text-white mb-2">Create Study Plan</h1>
                <p className="text-slate-400 mb-8">Let DUB5 AI create a personalized study schedule for you</p>

                {step === 'input' && (
                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <label className="block text-white font-medium mb-2">What do you want to learn or achieve?</label>
                            <textarea
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                placeholder="e.g., Master calculus for my upcoming exam, Learn Spanish basics in 2 weeks..."
                                className="w-full h-24 bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                            />
                        </div>

                        <div className="glass-card p-6">
                            <label className="block text-white font-medium mb-2">Your weekly availability</label>
                            <textarea
                                value={schedule}
                                onChange={(e) => setSchedule(e.target.value)}
                                placeholder="e.g., Weekdays 6-8 PM, Saturdays 10 AM - 2 PM, about 10 hours per week..."
                                className="w-full h-24 bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                            />
                        </div>

                        <button
                            onClick={handleGenerate}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                        >
                            <Sparkles className="w-5 h-5" />
                            Generate Study Plan
                        </button>
                    </div>
                )}

                {step === 'generating' && (
                    <div className="glass-card p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
                        <p className="text-white">DUB5 AI is creating your personalized study plan...</p>
                    </div>
                )}

                {step === 'preview' && generatedPlan && (
                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <h2 className="text-xl font-bold text-white mb-4">{generatedPlan.title}</h2>
                            <p className="text-slate-400 mb-4">{generatedPlan.description}</p>

                            <div className="space-y-3">
                                {generatedPlan.sessions?.map((session: any, i: number) => (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                                        <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                                        <div>
                                            <p className="text-white font-medium">{session.title}</p>
                                            <p className="text-slate-400 text-sm">{session.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep('input')}
                                className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-colors"
                            >
                                Start Over
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:opacity-90 transition-opacity"
                            >
                                Save Plan
                            </button>
                        </div>
                    </div>
                )}

                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => hideToast(toast.id)}
                    />
                ))}
            </div>
        </div>
    );
}
