'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Star, ChevronRight, Play } from 'lucide-react';

export default function Hero() {
    return (
        <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

                    {/* Left Column: Text */}
                    <div className="text-center lg:text-left">
                        {/* Trust Pill */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8 animate-fade-in hover:bg-blue-500/20 transition-colors cursor-default">
                            <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
                            <span className="text-sm font-medium text-blue-200">Nieuw: AI-Tutor 2.0 nu beschikbaar</span>
                            <ChevronRight className="w-4 h-4 text-blue-400" />
                        </div>

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 tracking-tight leading-[1.1]">
                            Leer slimmer, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                                niet harder.
                            </span>
                        </h1>

                        <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                            Het alles-in-één leerplatform dat je helpt excelleren.
                            Vergeet StudyGo en Quizlet. DUB5 is gebouwd voor de serieuze student.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link
                                href="/login"
                                className="group px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 flex items-center justify-center gap-2"
                            >
                                Start nu gratis
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <button className="px-8 py-4 bg-[#1e293b]/50 hover:bg-[#1e293b] text-white border border-white/10 font-bold rounded-2xl backdrop-blur-sm transition-all flex items-center justify-center gap-2 group">
                                <Play className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
                                Bekijk demo
                            </button>
                        </div>

                        <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-slate-500">
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0f172a] bg-slate-700 overflow-hidden">
                                        {/* Placeholder for user avatars */}
                                        <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-800" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-white font-bold">500+</span>
                                <span>studenten gingen je voor</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Visual */}
                    <div className="relative lg:h-[600px] w-full flex items-center justify-center perspective-1000">
                        {/* Glow effect behind illustration */}
                        <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />

                        {/* Main App Mockup */}
                        <div className="relative w-full aspect-[16/10] bg-[#1e293b] rounded-xl border border-white/10 shadow-2xl overflow-hidden transform rotate-y-[-5deg] rotate-x-[5deg] hover:rotate-y-[0deg] hover:rotate-x-[0deg] transition-all duration-700 hover:shadow-blue-500/10 group">
                            <Image
                                src="/mockups/app-dashboard.png"
                                alt="DUB5 Dashboard Interface"
                                fill
                                className="object-cover"
                                priority
                            />

                            {/* Floating Card Element */}
                            <div className="absolute -bottom-6 -left-6 w-48 p-4 bg-[#1e293b] rounded-xl border border-white/10 shadow-xl backdrop-blur-md transform translate-z-20 group-hover:translate-y-[-10px] transition-transform duration-500 animate-float">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <Star className="w-4 h-4 text-green-400" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-400">Streak</div>
                                        <div className="text-sm font-bold text-white">12 Dagen</div>
                                    </div>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full w-4/5 bg-green-500 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
