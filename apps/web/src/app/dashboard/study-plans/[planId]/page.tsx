'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
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
        // Fetch plan
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

        // Fetch events
        const { data: eventsData, error: eventsError } = await supabase
            .from('study_plan_events')
            .select('*')
            .eq('plan_id', params.planId)
            .order('start_time');

        if (eventsError) {
            console.error('Error fetching events:', eventsError);
        } else {
            setEvents(eventsData || []);
        }

        setLoading(false);
    };

    const handleToggleComplete = async (eventId: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('study_plan_events')
            .update({ is_completed: !currentStatus })
            .eq('id', eventId);

        if (error) {
            showToast('Failed to update event', 'error');
        } else {
            setEvents(events.map(e => e.id === eventId ? { ...e, is_completed: !currentStatus } : e));
            showToast('Event updated successfully', 'success');
        }
    };

    const handleDeletePlan = async () => {
        if (!confirm('Are you sure you want to delete this study plan?')) return;

        const { error } = await supabase
            .from('study_plans')
            .delete()
            .eq('id', params.planId);

        if (error) {
            showToast('Failed to delete plan', 'error');
        } else {
            showToast('Plan deleted successfully', 'success');
            router.push('/dashboard/study-plans');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl text-white mb-4">Plan not found</h2>
                    <button
                        onClick={() => router.back()}
                        className="text-purple-400 hover:text-purple-300"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const completedCount = events.filter(e => e.is_completed).length;
    const progressPercentage = events.length > 0 ? Math.round((completedCount / events.length) * 100) : 0;

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
                        <span>Back to Study Plans</span>
                    </button>

                    {/* Plan Header */}
                    <div className="glass-card p-8 mb-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-3xl font-serif font-bold text-white mb-2">{plan.title}</h1>
                                <p className="text-slate-400">{plan.goal}</p>
                            </div>
                            <button
                                onClick={handleDeletePlan}
                                className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-400">Progress</span>
                                <span className="text-sm font-medium text-white">{completedCount} / {events.length} completed</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500"
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-slate-400">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>Created {new Date(plan.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                <span>{progressPercentage}% Complete</span>
                            </div>
                        </div>
                    </div>

                    {/* Events List */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white mb-4">Study Sessions</h2>

                        {events.length === 0 ? (
                            <div className="glass-card p-8 text-center">
                                <p className="text-slate-400">No study sessions scheduled.</p>
                            </div>
                        ) : (
                            events.map((event) => {
                                const isPast = new Date(event.end_time) < new Date();
                                const isToday = new Date(event.start_time).toDateString() === new Date().toDateString();

                                return (
                                    <div
                                        key={event.id}
                                        className={`glass-card p-6 transition-all ${event.is_completed ? 'opacity-60' : ''
                                            } ${isToday ? 'border-2 border-purple-500/50' : ''}`}
                                    >
                                        <div className="flex gap-4">
                                            {/* Date Badge */}
                                            <div className="flex-shrink-0">
                                                <div className={`w-16 h-16 rounded-lg ${event.is_completed
                                                        ? 'bg-green-500/10'
                                                        : isToday
                                                            ? 'bg-purple-500/10'
                                                            : 'bg-slate-800'
                                                    } flex flex-col items-center justify-center`}>
                                                    <span className={`text-xs font-bold uppercase ${event.is_completed ? 'text-green-400' : isToday ? 'text-purple-400' : 'text-slate-400'
                                                        }`}>
                                                        {new Date(event.start_time).toLocaleDateString('en-US', { weekday: 'short' })}
                                                    </span>
                                                    <span className={`text-xl font-bold ${event.is_completed ? 'text-green-400' : isToday ? 'text-purple-400' : 'text-white'
                                                        }`}>
                                                        {new Date(event.start_time).getDate()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Event Details */}
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className={`text-lg font-medium ${event.is_completed ? 'line-through text-slate-500' : 'text-white'
                                                        }`}>
                                                        {event.title}
                                                    </h3>
                                                    <button
                                                        onClick={() => handleToggleComplete(event.id, event.is_completed)}
                                                        className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors hover:bg-white/5"
                                                    >
                                                        {event.is_completed ? (
                                                            <>
                                                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                                                <span className="text-green-400">Completed</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Circle className="w-4 h-4 text-slate-400" />
                                                                <span className="text-slate-400">Mark Complete</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                                                    <Clock className="w-3 h-3" />
                                                    <span>
                                                        {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {' - '}
                                                        {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {isToday && !event.is_completed && (
                                                        <span className="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs font-medium">
                                                            Today
                                                        </span>
                                                    )}
                                                    {isPast && !event.is_completed && (
                                                        <span className="ml-2 px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                                                            Overdue
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-slate-300 text-sm">{event.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
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
