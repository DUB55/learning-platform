'use client';

import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav
            className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled
                    ? 'bg-[#0f172a]/80 backdrop-blur-md border-b border-white/10 py-4'
                    : 'bg-transparent py-6'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-serif font-bold text-white tracking-tight">
                            DUB5
                        </span>
                    </Link>

                    {/* Navigation */}
                    <div className="flex items-center gap-6">
                        <Link
                            href="/login"
                            className="hidden sm:block text-sm font-medium text-slate-300 hover:text-white transition-colors"
                        >
                            Inloggen
                        </Link>
                        <Link
                            href="/login"
                            className="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-indigo-50 transition-all transform hover:scale-105 shadow-lg hover:shadow-white/10"
                        >
                            Start nu gratis
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
