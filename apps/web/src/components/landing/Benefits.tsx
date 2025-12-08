'use client';

import { CheckCircle2, Moon, Smartphone, Zap } from 'lucide-react';

const BENEFITS = [
    {
        title: 'Gemaakt voor nachtbrakers',
        description: 'Onze Dark Mode is geoptimaliseerd om vermoeide ogen te voorkomen tijdens late studiesessies.',
        icon: Moon,
        color: 'text-purple-400'
    },
    {
        title: 'Altijd en overal leren',
        description: 'Start op je laptop, ga verder op de bus met je telefoon. Alles synct real-time.',
        icon: Smartphone,
        color: 'text-blue-400'
    },
    {
        title: 'Importeer in seconden',
        description: 'Heb je sets op Quizlet staan? Importeer ze met Ã©Ã©n klik en upgrade ze met AI.',
        icon: Zap,
        color: 'text-amber-400'
    }
];

export default function Benefits() {
    return (
        <div className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-slate-900/50" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid md:grid-cols-3 gap-8">
                    {BENEFITS.map((benefit, i) => (
                        <div key={i} className="glass-card p-8 hover:translate-y-[-5px] transition-transform duration-300">
                            <div className={`w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center mb-6 ${benefit.color}`}>
                                <benefit.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
                            <p className="text-slate-400 leading-relaxed">
                                {benefit.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
