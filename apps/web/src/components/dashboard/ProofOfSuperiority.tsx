'use client';

import { Check, Sparkles, Zap, Brain, Target, Globe, Award, Rocket } from 'lucide-react';
import { useUISettings } from '@/contexts/UISettingsContext';

export default function ProofOfSuperiority() {
    const { settings } = useUISettings();

    const translations = {
        nl: {
            title: "Waarom wij de beste zijn",
            subtitle: "De ultieme leerervaring, wetenschappelijk onderbouwd en AI-gestuurd.",
            features: [
                {
                    title: "Alles-in-één Hub",
                    desc: "Vervangt Quizlet, Anki, Duolingo en Notion. Eén platform voor alles.",
                    icon: Rocket,
                    color: "text-blue-400",
                    bg: "bg-blue-400/10"
                },
                {
                    title: "DUB5 AI Kracht",
                    desc: "Niet zomaar een chat; DUB5 bouwt je planning, toetsen en samenvattingen.",
                    icon: Sparkles,
                    color: "text-purple-400",
                    bg: "bg-purple-400/10"
                },
                {
                    title: "Wetenschappelijk Leren",
                    desc: "Ingebouwde Spaced Repetition (SM2) en Active Recall algoritmes.",
                    icon: Brain,
                    color: "text-emerald-400",
                    bg: "bg-emerald-400/10"
                },
                {
                    title: "Echte Gamificatie",
                    desc: "XP, Streaks, Levels en Competitieve Games die je écht motiveren.",
                    icon: Trophy,
                    color: "text-yellow-400",
                    bg: "bg-yellow-400/10"
                }
            ],
            comparison: [
                "AI-gestuurde document synthese",
                "Directe PowerPoint generatie",
                "Native Meertalige spraakherkenning",
                "Geïntegreerde studieplanner & kalender"
            ]
        },
        en: {
            title: "Why We Are the Best",
            subtitle: "The ultimate learning experience, scientifically backed and AI-driven.",
            features: [
                {
                    title: "All-in-One Hub",
                    desc: "Replaces Quizlet, Anki, Duolingo, and Notion. One platform for everything.",
                    icon: Rocket,
                    color: "text-blue-400",
                    bg: "bg-blue-400/10"
                },
                {
                    title: "DUB5 AI Power",
                    desc: "Not just a chat; DUB5 builds your schedule, tests, and summaries.",
                    icon: Sparkles,
                    color: "text-purple-400",
                    bg: "bg-purple-400/10"
                },
                {
                    title: "Scientific Learning",
                    desc: "Built-in Spaced Repetition (SM2) and Active Recall algorithms.",
                    icon: Brain,
                    color: "text-emerald-400",
                    bg: "bg-emerald-400/10"
                },
                {
                    title: "Deep Gamification",
                    desc: "XP, Streaks, Levels, and Competitive Games that actually motivate you.",
                    icon: Trophy,
                    color: "text-yellow-400",
                    bg: "bg-yellow-400/10"
                }
            ],
            comparison: [
                "AI-driven document synthesis",
                "Instant PowerPoint generation",
                "Native Multi-language speech recognition",
                "Integrated study planner & calendar"
            ]
        },
        de: {
            title: "Warum wir die Besten sind",
            subtitle: "Das ultimative Lernerlebnis, wissenschaftlich fundiert und KI-gesteuert.",
            features: [
                {
                    title: "Alles-in-einem Hub",
                    desc: "Ersetzt Quizlet, Anki, Duolingo und Notion. Eine Plattform für alles.",
                    icon: Rocket,
                    color: "text-blue-400",
                    bg: "bg-blue-400/10"
                },
                {
                    title: "DUB5 KI-Power",
                    desc: "Nicht nur ein Chat; DUB5 erstellt Ihren Zeitplan, Tests und Zusammenfassungen.",
                    icon: Sparkles,
                    color: "text-purple-400",
                    bg: "bg-purple-400/10"
                },
                {
                    title: "Wissenschaftliches Lernen",
                    desc: "Integrierte Spaced Repetition (SM2) und Active Recall Algorithmen.",
                    icon: Brain,
                    color: "text-emerald-400",
                    bg: "bg-emerald-400/10"
                },
                {
                    title: "Echte Gamifizierung",
                    desc: "XP, Streaks, Level und Wettbewerbsspiele, die Sie wirklich motivieren.",
                    icon: Trophy,
                    color: "text-yellow-400",
                    bg: "bg-yellow-400/10"
                }
            ],
            comparison: [
                "KI-gesteuerte Dokumentsynthese",
                "Sofortige PowerPoint-Generierung",
                "Native mehrsprachige Spracherkennung",
                "Integrierter Studienplaner & Kalender"
            ]
        },
        fr: {
            title: "Pourquoi nous sommes les meilleurs",
            subtitle: "L'expérience d'apprentissage ultime, scientifiquement prouvée et pilotée par l'IA.",
            features: [
                {
                    title: "Hub Tout-en-Un",
                    desc: "Remplace Quizlet, Anki, Duolingo et Notion. Une seule plateforme pour tout.",
                    icon: Rocket,
                    color: "text-blue-400",
                    bg: "bg-blue-400/10"
                },
                {
                    title: "Puissance DUB5 IA",
                    desc: "Pas seulement un chat ; DUB5 construit votre planning, vos tests et vos résumés.",
                    icon: Sparkles,
                    color: "text-purple-400",
                    bg: "bg-purple-400/10"
                },
                {
                    title: "Apprentissage Scientifique",
                    desc: "Algorithmes Spaced Repetition (SM2) et Active Recall intégrés.",
                    icon: Brain,
                    color: "text-emerald-400",
                    bg: "bg-emerald-400/10"
                },
                {
                    title: "Gamification Réelle",
                    desc: "XP, Streaks, Niveaux et Jeux Compétitifs qui vous motivent vraiment.",
                    icon: Trophy,
                    color: "text-yellow-400",
                    bg: "bg-yellow-400/10"
                }
            ],
            comparison: [
                "Synthèse de documents pilotée par l'IA",
                "Génération instantanée de PowerPoint",
                "Reconnaissance vocale multilingue native",
                "Planificateur d'études et calendrier intégrés"
            ]
        },
        es: {
            title: "Por qué somos los mejores",
            subtitle: "La experiencia de aprendizaje definitiva, respaldada científicamente e impulsada por IA.",
            features: [
                {
                    title: "Hub Todo en Uno",
                    desc: "Reemplaza a Quizlet, Anki, Duolingo y Notion. Una sola plataforma para todo.",
                    icon: Rocket,
                    color: "text-blue-400",
                    bg: "bg-blue-400/10"
                },
                {
                    title: "Poder de DUB5 IA",
                    desc: "No solo un chat; DUB5 construye tu horario, exámenes y resúmenes.",
                    icon: Sparkles,
                    color: "text-purple-400",
                    bg: "bg-purple-400/10"
                },
                {
                    title: "Aprendizaje Científico",
                    desc: "Algoritmos integrados de Spaced Repetition (SM2) y Active Recall.",
                    icon: Brain,
                    color: "text-emerald-400",
                    bg: "bg-emerald-400/10"
                },
                {
                    title: "Gamificación Real",
                    desc: "XP, Rachas, Niveles y Juegos Competitivos que realmente te motivan.",
                    icon: Trophy,
                    color: "text-yellow-400",
                    bg: "bg-yellow-400/10"
                }
            ],
            comparison: [
                "Síntesis de documentos impulsada por IA",
                "Generación instantánea de PowerPoint",
                "Reconocimiento de voz multilingüe nativo",
                "Planificador de estudios y calendario integrados"
            ]
        }
    };

    const t = translations[settings.language as keyof typeof translations] || translations.en;

    return (
        <div className="glass-card p-8 border-blue-500/20 bg-blue-500/5 relative overflow-hidden group">
            {/* Background Decor */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Award className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black italic tracking-tight">{t.title}</h2>
                        <p className="text-slate-400 text-sm font-medium">{t.subtitle}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    {t.features.map((feature, i) => (
                        <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                            <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center flex-shrink-0`}>
                                <feature.icon className={`w-6 h-6 ${feature.color}`} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm mb-1">{feature.title}</h3>
                                <p className="text-slate-400 text-xs leading-relaxed">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-3">
                    {t.comparison.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-200">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3 text-emerald-400" />
                            </div>
                            {item}
                        </div>
                    ))}
                </div>

                <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 100}`} alt="user" />
                                </div>
                            ))}
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Join 1,000+ Students</span>
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-blue-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">
                        Top Rated 2026
                    </div>
                </div>
            </div>
        </div>
    );
}

import { Trophy } from 'lucide-react';
