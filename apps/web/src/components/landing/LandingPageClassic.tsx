import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';

export default function LandingPageClassic() {
    return (
        <div className="min-h-screen bg-[#0A0A0F] text-white selection:bg-blue-500/30">
            {/* Subtle Grid Background */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            {/* Header/Nav */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white fill-current" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">Leren<span className="text-blue-500">Platform</span></span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                        <Link href="#features" className="hover:text-white transition-colors">Features</Link>
                        <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
                        <Link href="#about" className="hover:text-white transition-colors">About</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                            Log in
                        </Link>
                        <Link href="/login" className="glass-button px-4 py-2 rounded-full text-sm font-medium">
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section - CENTERED */}
            <main className="relative pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-8">
                        <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        v2.0 Now Available with AI Tutor
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-b from-white via-white/90 to-white/50 bg-clip-text text-transparent">
                        Master Your Studies<br />
                        <span className="text-blue-500">With Superpowers</span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        The all-in-one learning platform that combines AI tutoring, gamified progress, and powerful study tools to help you ace every exam.
                    </p>

                    <div className="flex items-center justify-center gap-4">
                        <Link href="/login" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/25 flex items-center gap-2">
                            Start Learning Free
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link href="/demo" className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95">
                            View Demo
                        </Link>
                    </div>

                    <div className="mt-16 relative mx-auto max-w-5xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-[#0F1115]">
                        <img src="/mockups/app-dashboard.png" alt="App Interface" className="w-full h-auto opacity-90" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-transparent to-transparent" />
                    </div>
                </div>

                {/* Glow Effects */}
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/20 opacity-30 blur-[120px] rounded-full pointer-events-none" />
            </main>
        </div>
    );
}
