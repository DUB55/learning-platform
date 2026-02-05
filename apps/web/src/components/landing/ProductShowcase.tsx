'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Zap, Calendar, MessageCircle } from 'lucide-react';

const FEATURES = [
    {
        id: 'ai-chat',
        title: '24/7 AI Tutor',
        description: 'Loop je vast? Onze AI-tutor legt complexe onderwerpen uit alsof je naast een privÃ©docent zit. Stel vragen over je eigen documenten.',
        icon: MessageCircle,
        image: '/mockups/mobile-flashcards.png' // Utilizing the generated asset
    },
    {
        id: 'flashcards',
        title: 'Slimme Flashcards',
        description: 'Gebruik spaced repetition om begrippen 3x sneller te onthouden. Importeer direct vanuit Quizlet of laat AI ze maken.',
        icon: Zap,
        image: '/mockups/app-dashboard.png' // Utilizing the generated asset
    },
    {
        id: 'planning',
        title: 'Automatische Planning',
        description: 'Voer je toetsdatum in en wij genereren een haalbaar studieplan dat rekening houdt met je vrije tijd.',
        icon: Calendar,
        image: '/mockups/app-dashboard.png'
    }
];

export default function ProductShowcase() {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <div className="py-24 bg-[#0f172a]">
            {/* Background Gradient Blob */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6">
                        Alles wat je nodig hebt om te <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">excelleren</span>
                    </h2>
                    <p className="text-slate-400 text-lg">
                        Geen losse apps meer. DUB5 combineert notities, planning en flashcards in Ã©Ã©n krachtig platform.
                    </p>
                </div>

                <div className="grid lg:grid-cols-12 gap-12">
                    {/* Feature Navigation - Left Side */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        {FEATURES.map((feature, index) => (
                            <button
                                key={feature.id}
                                onClick={() => setActiveTab(index)}
                                className={`text-left p-6 rounded-2xl transition-all duration-300 border ${activeTab === index
                                        ? 'bg-slate-800/80 border-blue-500/50 shadow-lg shadow-blue-900/10'
                                        : 'bg-transparent border-transparent hover:bg-slate-800/30'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${activeTab === index ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                                    }`}>
                                    <feature.icon className="w-5 h-5" />
                                </div>
                                <h3 className={`text-lg font-bold mb-2 ${activeTab === index ? 'text-white' : 'text-slate-300'}`}>
                                    {feature.title}
                                </h3>
                                <p className={`text-sm leading-relaxed ${activeTab === index ? 'text-slate-300' : 'text-slate-500'}`}>
                                    {feature.description}
                                </p>
                            </button>
                        ))}
                    </div>

                    {/* Feature Visual - Right Side */}
                    <div className="lg:col-span-8">
                        <div className="relative h-[500px] sm:h-[600px] bg-[#1e293b] rounded-2xl border border-white/10 shadow-2xl overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800" />

                            {/* Decorative Elements */}
                            <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                            {/* Image Display */}
                            <div className="relative w-full h-full p-8 flex items-center justify-center">
                                <div className="relative w-full h-full max-w-2xl shadow-xl">
                                    <Image
                                        src={FEATURES[activeTab].image}
                                        alt={FEATURES[activeTab].title}
                                        fill
                                        className="object-contain drop-shadow-2xl transition-all duration-500 transform scale-100 opacity-100"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
