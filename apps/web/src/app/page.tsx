import Link from 'next/link';
import { ArrowRight, BookOpen, Brain, Zap, CheckCircle2, BarChart3, Calendar, Trophy } from 'lucide-react';

export default function Home() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/20 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-serif font-bold text-white tracking-tight">Leerplatform</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                Inloggen
                            </Link>
                            <Link
                                href="/login"
                                className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                Start nu
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in">
                        <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
                        <span className="text-sm text-slate-300">De toekomst van leren is hier</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-8 tracking-tight animate-slide-up">
                        Leer slimmer met <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                            AI-Powered Education
                        </span>
                    </h1>

                    <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        Transformeer je studieroutine met gepersonaliseerde AI-begeleiding, slimme planning en boeiende leermodi.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <Link
                            href="/login"
                            className="group px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
                        >
                            Start nu gratis
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <button className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-medium rounded-xl backdrop-blur-sm transition-colors">
                            Meer informatie
                        </button>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6">
                        Alles wat je nodig hebt om te <span className="text-purple-400">excelleren</span>
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">
                        Krachtige functies ontworpen om jouw leerervaring naar een hoger niveau te tillen.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FeatureCard
                        icon={<Brain className="w-6 h-6 text-blue-400" />}
                        title="AI-Powered Learning"
                        description="Krijg gepersonaliseerde hulp van je AI-tutor, 24/7 beschikbaar voor al je vragen."
                        delay="0s"
                    />
                    <FeatureCard
                        icon={<Calendar className="w-6 h-6 text-purple-400" />}
                        title="Smart Scheduling"
                        description="Organiseer je studiesessies met intelligente agenda-integratie en planning."
                        delay="0.1s"
                    />
                    <FeatureCard
                        icon={<BarChart3 className="w-6 h-6 text-pink-400" />}
                        title="Progress Tracking"
                        description="Monitor je leertraject met gedetailleerde analyses en inzichten."
                        delay="0.2s"
                    />
                    <FeatureCard
                        icon={<BookOpen className="w-6 h-6 text-emerald-400" />}
                        title="Rich Library"
                        description="Toegang tot duizenden leermiddelen en gedeelde samenvattingen op één plek."
                        delay="0.3s"
                    />
                    <FeatureCard
                        icon={<Trophy className="w-6 h-6 text-amber-400" />}
                        title="Gamification"
                        description="Blijf gemotiveerd met achievements, streaks en beloningen voor je inzet."
                        delay="0.4s"
                    />
                    <FeatureCard
                        icon={<Zap className="w-6 h-6 text-cyan-400" />}
                        title="Study Modes"
                        description="Meerdere leerformaten: flashcards, quizzen, oefentoetsen en meer."
                        delay="0.5s"
                    />
                </div>

                <div className="mt-20 text-center">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-medium rounded-xl hover:bg-slate-100 transition-all transform hover:scale-105 shadow-xl"
                    >
                        Begin vandaag nog
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: string }) {
    return (
        <div
            className="glass-card p-8 hover:bg-white/5 transition-colors group animate-slide-up"
            style={{ animationDelay: delay }}
        >
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/10">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-slate-400 leading-relaxed">
                {description}
            </p>
        </div>
    );
}
