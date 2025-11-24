'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';

export default function HomePage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    // Auto-redirect logged-in users to dashboard
    useEffect(() => {
        if (!loading && user) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] opacity-50"></div>

            {/* Content */}
            <div className="relative z-10">
                {/* Navbar */}
                <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-serif font-bold text-white tracking-tight">LearnHub</span>
                    </div>
                    <Link href="/login" className="glass-button px-4 py-2 rounded-xl">
                        Sign In
                    </Link>
                </nav>

                {/* Hero Section */}
                <div className="max-w-7xl mx-auto px-6 py-20 text-center">
                    <h1 className="text-5xl md:text-6xl font-serif font-bold text-white mb-6 animate-fade-in">
                        Your Personal
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400"> Learning Hub</span>
                    </h1>
                    <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                        Master your subjects with AI-powered study tools, spaced repetition, and intelligent progress tracking.
                    </p>
                    <Link href="/login" className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 inline-flex items-center gap-2 group">
                        Get Started
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
