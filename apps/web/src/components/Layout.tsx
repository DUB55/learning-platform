import { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Home, Book, Calendar, Settings, LogOut, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Layout({ children }: { children: ReactNode }) {
    const { user, profile, signOut } = useAuth();
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    if (!user) return <>{children}</>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
            {/* Top Navigation */}
            <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-8">
                            <Link href="/dashboard" className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                Leerplatform
                            </Link>

                            <div className="hidden md:flex gap-6">
                                <Link href="/dashboard" className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    <Home className="w-4 h-4" />
                                    Dashboard
                                </Link>
                                <Link href="/subjects" className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    <Book className="w-4 h-4" />
                                    Vakken
                                </Link>
                                <Link href="/planner" className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    <Calendar className="w-4 h-4" />
                                    Planner
                                </Link>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                {darkMode ? <Sun className="w-5 h-5 text-slate-300" /> : <Moon className="w-5 h-5 text-slate-700" />}
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                        {profile?.full_name || user.email}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {profile?.role || 'Student'}
                                    </p>
                                </div>

                                <button
                                    onClick={signOut}
                                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    title="Sign out"
                                >
                                    <LogOut className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
