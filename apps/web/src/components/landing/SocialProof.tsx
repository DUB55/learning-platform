'use client';

import { Star } from 'lucide-react';

const SCHOOLS = [
    'Universiteit van Amsterdam', 'Erasmus Universiteit', 'TU Delft',
    'Hogeschool Utrecht', 'Fontys', 'Avans Hogeschool',
    'Rijksuniversiteit Groningen', 'Universiteit Leiden'
];

export default function SocialProof() {
    return (
        <div className="py-12 border-y border-white/5 bg-white/[0.02]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-center text-sm font-medium text-slate-500 uppercase tracking-widest mb-8">
                    Gebruikt door studenten van topinstituten
                </p>

                {/* Marquee Effect */}
                <div className="relative flex overflow-hidden group">
                    <div className="animate-marquee whitespace-nowrap flex gap-16 items-center">
                        {[...SCHOOLS, ...SCHOOLS].map((school, i) => (
                            <span
                                key={i}
                                className="text-xl font-serif font-bold text-slate-600 hover:text-white transition-colors cursor-default"
                            >
                                {school}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mt-16">
                    <TestimonialCard
                        name="Sarah K."
                        role="Rechten Student"
                        text="Ik gebruikte altijd Quizlet, maar de AI-functies van DUB5 besparen me uren studietijd per week."
                        rating={5}
                    />
                    <TestimonialCard
                        name="Mark T."
                        role="VWO 6"
                        text="Eindelijk een platform dat begrijpt hoe ik wil leren. De 'Night Mode' is een geschenk uit de hemel."
                        rating={5}
                    />
                    <TestimonialCard
                        name="Lisa B."
                        role="Geneeskunde"
                        text="Het automatisch genereren van oefentoetsen uit mijn samenvattingen is insane. Dikke aanrader!"
                        rating={5}
                    />
                </div>
            </div>
        </div>
    );
}

function TestimonialCard({ name, role, text, rating }: { name: string, role: string, text: string, rating: number }) {
    return (
        <div className="glass-card p-6 bg-[#1e293b]/30">
            <div className="flex gap-1 mb-4">
                {[...Array(rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
            </div>
            <p className="text-slate-300 mb-6 leading-relaxed">&quot;{text}&quot;</p>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white">
                    {name.charAt(0)}
                </div>
                <div>
                    <div className="font-bold text-white text-sm">{name}</div>
                    <div className="text-xs text-slate-500">{role}</div>
                </div>
            </div>
        </div>
    );
}
