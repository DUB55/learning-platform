'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

import { ArrowLeft, Calendar, Clock, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';

export default function StudyPlanDetailPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { toasts, showToast, hideToast } = useToast();

    const [plan, setPlan] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && params.planId) {
            fetchPlanDetails();
        }
    }, [user, params.planId]);

    const fetchPlanDetails = async () => {
        const { data: planData, error: planError } = await supabase
            .from('study_plans')
            .select('*')
            .eq('id', params.planId)
            .single();

        if (planError) {
            console.error('Error fetching plan:', planError);
            setLoading(false);
            return;
        }

        setPlan(planData);

        const { data: eventsData } = await supabase
            .from('study_plan_events')
            .select('*')
            .eq('plan_id', params.planId)
            .order('start_time');

        if (eventsData) setEvents(eventsData);
        setLoading(false);
    };

    const toggleEventComplete = async (eventId: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('study_plan_events')
            .update({ is_completed: !currentStatus })
            .eq('id', eventId);

        if (!error) {
            setEvents(events.map(e =>
                e.id === eventId ? { ...e, is_completed: !currentStatus } : e
            ));
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this study plan?')) return;

        const { error } = await supabase
            .from('study_plans')
            .delete()
            .eq('id', params.planId);

        if (!error) {
            showToast('Plan deleted', 'success');
            router.push('/study-plans');
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-slate-400">Study plan not found</p>
            </div>
        );
    }

    const completedCount = events.filter(e => e.is_completed).length;
    const progress = events.length > 0 ? (completedCount / events.length) * 100 : 0;

    return (
        <div className="h-full overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => router.push('/study-plans')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Plans</span>
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>

                <div className="glass-card p-6 mb-6">
                    <h1 className="text-2xl font-bold text-white mb-2">{plan.title}</h1>
                    <p className="text-slate-400 mb-4">{plan.goal}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(plan.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            {completedCount}/{events.length} completed
                        </span>
                    </div>

                    <div className="mt-4">
                        <div className="w-full bg-slate-700/50 rounded-full h-2">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            onClick={() => toggleEventComplete(event.id, event.is_completed)}
                            className={`glass-card p-4 cursor-pointer transition-all ${
                                event.is_completed ? 'opacity-60' : ''
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                {event.is_completed ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                                ) : (
                                    <Circle className="w-5 h-5 text-slate-500 mt-0.5" />
                                )}
                                <div className="flex-1">
                                    <p className={`font-medium ${event.is_completed ? 'text-slate-400 line-through' : 'text-white'}`}>
                                        {event.title}
                                    </p>
                                    {event.description && (
                                        <p className="text-slate-400 text-sm mt-1">{event.description}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                        {event.start_time && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(event.start_time).toLocaleString()}
                                            </span>
                                        )}
                                        {event.duration_minutes && (
                                            <span>{event.duration_minutes} min</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {events.length === 0 && (
                    <div className="glass-card p-8 text-center">
                        <p className="text-slate-400">No sessions in this study plan yet.</p>
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
