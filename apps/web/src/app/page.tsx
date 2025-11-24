'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { ArrowRight, BookOpen, Brain, Calendar, BarChart3, Users, Clock, Target, Sparkles } from 'lucide-react';

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
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Learning Hub</span>
                    </h1>
                    <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                        Master your subjects with AI-powered study tools, spaced repetition, and intelligent progress tracking.
                    </p>
                    <Link href="/login" className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 inline-flex items-center gap-2 group">
                        Get Started
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Features Grid */}
                <div className="max-w-7xl mx-auto px-6 py-20">
                    <h2 className="text-3xl font-serif font-bold text-white text-center mb-12">
                        Everything you need to excel
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="glass-card p-6 group hover:border-blue-500/30 transition-all">
                            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Brain className="w-6 h-6 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Smart Study Tools</h3>
                            <p className="text-slate-400">
                                AI-powered flashcards and spaced repetition to optimize your learning retention.
                            </p>
                        </div>

                        <div className="glass-card p-6 group hover:border-purple-500/30 transition-all">
                            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Calendar className="w-6 h-6 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Study Planning</h3>
                            <p className="text-slate-400">
                                Organize your schedule with intelligent calendar and deadline tracking.
                            </p>
                        </div>

                        <div className="glass-card p-6 group hover:border-green-500/30 transition-all">
                            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <BarChart3 className="w-6 h-6 text-green-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Progress Analytics</h3>
                            <p className="text-slate-400">
                                Visualize your learning journey with detailed progress insights and statistics.
                            </p>
                        </div>

                        <div className="glass-card p-6 group hover:border-yellow-500/30 transition-all">
                            <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Target className="w-6 h-6 text-yellow-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Goal Setting</h3>
                            <p className="text-slate-400">
                                Set and track your academic goals with personalized milestones.
                            </p>
                        </div>

                        <div className="glass-card p-6 group hover:border-pink-500/30 transition-all">
                            <div className="w-12 h-12 bg-pink-600/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Clock className="w-6 h-6 text-pink-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Time Tracking</h3>
                            <p className="text-slate-400">
                                Monitor your study sessions and build consistent learning habits.
                            </p>
                        </div>

                        <div className="glass-card p-6 group hover:border-indigo-500/30 transition-all">
                            <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Sparkles className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Subject Management</h3>
                            <p className="text-slate-400">
                                Organize your subjects, chapters, and resources all in one place.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="max-w-4xl mx-auto px-6 py-20 text-center">
                    <div className="glass-card p-12">
                        <h2 className="text-3xl font-serif font-bold text-white mb-4">
                            Ready to transform your learning?
                        </h2>
                        <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
                            Join thousands of students who are already mastering their subjects with LearnHub.
                        </p>
                        <Link href="/login" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium px-8 py-3 rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 inline-flex items-center gap-2 group">
                            Get Started for Free
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <footer className="border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-6 py-8">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <BookOpen className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-serif font-bold text-white">LearnHub</span>
                            </div>
                            <p className="text-sm text-slate-500">
                                © 2024 LearnHub. All rights reserved.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
