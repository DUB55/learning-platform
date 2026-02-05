'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

import { Plus, Calendar, Trash2, ChevronRight, CheckCircle2, Clock, Globe } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/ui/Toast';
import ErrorLogger from '@/lib/ErrorLogger';
import { useUISettings } from '@/contexts/UISettingsContext';

export default function StudyPlansPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { settings } = useUISettings();
    const { toasts, showToast, hideToast } = useToast();
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [recentLocalPlans, setRecentLocalPlans] = useState<any[]>([]);

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
            ErrorLogger.error('Error fetching plans', error);
        } else {
            setPlans(data || []);
        }
        setLoading(false);
        try {
            const local = JSON.parse(localStorage.getItem('local_study_plans') || '[]');
            setRecentLocalPlans(local);
        } catch {
            setRecentLocalPlans([]);
        }
    };

    const translations = {
        nl: {
            title: "Studieplannen",
            subtitle: "Beheer je AI-gegenereerde studieschema's.",
            createNew: "Nieuw Plan Maken",
            recentLocal: "Recente Lokale Plannen",
            clearList: "Lijst Wissen",
            noPlans: "Nog geen studieplannen",
            noPlansDesc: "Genereer je eerste AI studieplan om georganiseerd te blijven.",
            createNow: "Nu Plan Maken",
            deleteConfirm: "Weet je zeker dat je dit studieplan wilt verwijderen?",
            deleteSuccess: "Plan succesvol verwijderd",
            deleteFailed: "Verwijderen van plan mislukt",
            eventsCount: "evenementen",
            localPlansDesc: "Plannen die lokaal zijn opgeslagen"
        },
        en: {
            title: "Study Plans",
            subtitle: "Manage your AI-generated study schedules.",
            createNew: "Create New Plan",
            recentLocal: "Recent Local Plans",
            clearList: "Clear List",
            noPlans: "No study plans yet",
            noPlansDesc: "Generate your first AI study plan to get organized.",
            createNow: "Create Plan Now",
            deleteConfirm: "Are you sure you want to delete this study plan?",
            deleteSuccess: "Plan deleted successfully",
            deleteFailed: "Failed to delete plan",
            eventsCount: "events",
            localPlansDesc: "Plans stored locally"
        },
        de: {
            title: "Lernpläne",
            subtitle: "Verwalten Sie Ihre KI-generierten Lernpläne.",
            createNew: "Neuen Plan erstellen",
            recentLocal: "Aktuelle lokale Pläne",
            clearList: "Liste löschen",
            noPlans: "Noch keine Lernpläne",
            noPlansDesc: "Erstellen Sie Ihren ersten KI-Lernplan, um organisiert zu bleiben.",
            createNow: "Plan jetzt erstellen",
            deleteConfirm: "Sind Sie sicher, dass Sie diesen Lernplan löschen möchten?",
            deleteSuccess: "Plan erfolgreich gelöscht",
            deleteFailed: "Fehler beim Löschen des Plans",
            eventsCount: "Termine",
            localPlansDesc: "Lokal gespeicherte Pläne"
        },
        fr: {
            title: "Plans d'Étude",
            subtitle: "Gérez vos calendriers d'étude générés par l'IA.",
            createNew: "Créer un Nouveau Plan",
            recentLocal: "Plans Locaux Récents",
            clearList: "Effacer la Liste",
            noPlans: "Pas encore de plans d'étude",
            noPlansDesc: "Générez votre premier plan d'étude IA pour rester organisé.",
            createNow: "Créer un Plan Maintenant",
            deleteConfirm: "Êtes-vous sûr de vouloir supprimer ce plan d'étude ?",
            deleteSuccess: "Plan supprimé avec succès",
            deleteFailed: "Échec de la suppression du plan",
            eventsCount: "événements",
            localPlansDesc: "Plans stockés localement"
        },
        es: {
            title: "Planes de Estudio",
            subtitle: "Gestiona tus horarios de estudio generados por IA.",
            createNew: "Crear Nuevo Plan",
            recentLocal: "Planes Locales Recientes",
            clearList: "Limpiar Lista",
            noPlans: "Aún no hay planes de estudio",
            noPlansDesc: "Genera tu primer plan de estudio con IA para organizarte.",
            createNow: "Crear Plan Ahora",
            deleteConfirm: "¿Estás seguro de que quieres eliminar este plan de estudio?",
            deleteSuccess: "Plan eliminado con éxito",
            deleteFailed: "Error al eliminar el plan",
            eventsCount: "eventos",
            localPlansDesc: "Planes almacenados localmente"
        }
    };

    const t = translations[settings.language as keyof typeof translations] || translations.en;

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(t.deleteConfirm)) return;

        const { error } = await supabase
            .from('study_plans')
            .delete()
            .eq('id', id);

        if (error) {
            showToast(t.deleteFailed, 'error');
        } else {
            showToast(t.deleteSuccess, 'success');
            fetchPlans();
        }
    };

    return (
        <div className="h-full p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-white mb-2">{t.title}</h1>
                        <p className="text-slate-400">{t.subtitle}</p>
                    </div>
                    <button
                        onClick={() => router.push('/study-modes')}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-purple-500/25 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span>{t.createNew}</span>
                    </button>
                </div>
                
                {recentLocalPlans.length > 0 && (
                    <div className="glass-card p-6 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-white font-bold">{t.recentLocal}</h3>
                            <button
                                className="text-slate-400 text-sm hover:text-white"
                                onClick={() => {
                                    localStorage.removeItem('local_study_plans');
                                    setRecentLocalPlans([]);
                                }}
                            >
                                {t.clearList}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {recentLocalPlans.slice(0, 6).map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => router.push(`/study-plans/${p.id}`)}
                                    className="p-3 rounded-lg bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-colors flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            <Globe className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white">{p.title || 'Untitled Local Plan'}</div>
                                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{t.localPlansDesc}</div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>
                ) }

                {plans.length === 0 && !loading ? (
                    <div className="glass-card p-12 text-center border-dashed border-2 border-white/10">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar className="w-8 h-8 text-slate-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">{t.noPlans}</h2>
                        <p className="text-slate-400 mb-8">{t.noPlansDesc}</p>
                        <button
                            onClick={() => router.push('/study-modes')}
                            className="text-purple-400 hover:text-purple-300 font-medium"
                        >
                            {t.createNow}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                onClick={() => router.push(`/study-plans/${plan.id}`)}
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
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                                    {plan.title}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{plan.study_plan_events?.[0]?.count || 0} {t.eventsCount}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        <span>AI Generated</span>
                                    </div>
                                </div>
                            </div>
                        ))}
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
