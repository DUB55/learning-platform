'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Menu, X, BookOpen } from 'lucide-react';
import { useUISettings } from '@/contexts/UISettingsContext';
import WindowControls from '@/components/WindowControls';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { settings } = useUISettings();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu when pathname changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Define routes where sidebar should be hidden
    const hiddenRoutes = ['/login', '/signup', '/forgot-password', '/orbit', '/'];

    const showSidebar = !hiddenRoutes.includes(pathname);

    if (!showSidebar) {
        return <>{children}</>;
    }

    return (
        <div className={`h-screen flex overflow-hidden ${settings.highContrast ? 'high-contrast' : ''} ${settings.theme === 'light' ? 'bg-white' : 'bg-[#0f172a]'}`}>
            {/* Desktop Sidebar */}
            <div className="hidden md:flex">
                <Sidebar />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    <div 
                        className="w-64 h-full bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Sidebar isMobile onClose={() => setIsMobileMenuOpen(false)} />
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between px-6 h-16 bg-slate-900/50 backdrop-blur-xl border-b border-white/5 z-50 electron-drag">
                    <div className="flex items-center gap-3 electron-no-drag">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-white tracking-tight">Leerplatform</span>
                    </div>
                    <div className="flex items-center gap-2 electron-no-drag">
                        <WindowControls />
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </header>

                <main className="flex-1 relative overflow-y-auto flex flex-col scrollbar-hide">
                    {children}
                </main>
            </div>
        </div>
    );
}
