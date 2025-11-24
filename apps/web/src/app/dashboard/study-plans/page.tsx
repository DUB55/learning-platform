'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Plus, Calendar, Trash2, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';

export default function StudyPlansPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toasts, showToast, hideToast } = useToast();
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchPlans();
        }
    }, [user]);

    const fetchPlans = async () => {
        const { data, error } = await supabase
            .from('study_plans')
            .select('*, study_plan_events(count)')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching plans:', error);
        } else {
            setPlans(data || []);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this study plan?')) return;

        const { error } = await supabase
            .from('study_plans')
            .delete()
            .eq('id', id);

        if (error) {
            showToast('Failed to delete plan', 'error');
        } else {
            showToast('Plan deleted successfully', 'success');
            fetchPlans();
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto relative p-8">
                <div className="max-w-5xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-white mb-2">Study Plans</h1>
                            <p className="text-slate-400">Manage your AI-generated study schedules.</p>
                        </div>
                        <button
                            onClick={() => router.push('/dashboard/study-plans/create')}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-purple-500/25 transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Create New Plan</span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                        </div>
                    ) : plans.length === 0 ? (
                        <div className="glass-card p-12 text-center border-dashed border-2 border-white/10">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Calendar className="w-8 h-8 text-slate-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">No study plans yet</h2>
                            <p className="text-slate-400 mb-8">Generate your first AI study plan to get organized.</p>
                            <button
                                onClick={() => router.push('/dashboard/study-plans/create')}
                                className="text-purple-400 hover:text-purple-300 font-medium"
                            >
                                Create Plan Now
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {plans.map((plan) => (
                                <div
                                    key={plan.id}
                                    onClick={() => router.push(`/dashboard/study-plans/${plan.id}`)}
                                    className="glass-card p-6 hover:bg-white/5 transition-colors cursor-pointer group relative"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(plan.id, e)}
                                            className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <h3 className="text-lg font-bold text-white mb-2">{plan.title}</h3>
                                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">{plan.goal}</p>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(plan.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" />
                                                {plan.study_plan_events[0]?.count || 0} Sessions
                                            </span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                                    </div>
                                </div>
                            ))}
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
