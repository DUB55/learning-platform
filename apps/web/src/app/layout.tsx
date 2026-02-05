import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserXPProvider } from '@/contexts/UserXPContext';
import { UISettingsProvider } from '@/contexts/UISettingsContext';
import RoutePrefetcher from '@/components/RoutePrefetcher';
import GlobalLoadingIndicator from '@/components/GlobalLoadingIndicator';
import AdminControls from '@/components/AdminControls';
import GlobalAnnouncementOverlay from '@/components/GlobalAnnouncementOverlay';
import DynamicFontProvider from '@/components/DynamicFontProvider';
import SiteContentLoader from '@/components/SiteContentLoader';
import TimeTracker from '@/components/Gamification/TimeTracker';
import LevelUpListener from '@/components/Gamification/LevelUpListener';
import MainLayout from '@/components/MainLayout';
import CommandPalette from '@/components/CommandPalette';
import WindowControls from '@/components/WindowControls';
import { Suspense } from 'react';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });

export const metadata: Metadata = {
    title: 'Leerplatform',
    description: 'AI-Powered Learning Platform',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Leerplatform',
    },
    formatDetection: {
        telephone: false,
    },
};

export const viewport: Viewport = {
    themeColor: '#3b82f6',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Root Layout

    return (
        <html lang="nl" className={`${inter.variable} ${outfit.variable} font-sans`} suppressHydrationWarning>
            <body className="font-sans antialiased" suppressHydrationWarning>
                <AuthProvider>
                    <UserXPProvider>
                        <UISettingsProvider>
                            <DynamicFontProvider />
                            <SiteContentLoader />
                            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
                                <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                                <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
                            </div>
                            <RoutePrefetcher />

                            <Suspense fallback={null}>
                                <GlobalLoadingIndicator />
                            </Suspense>

                            <Suspense fallback={null}>
                                <GlobalAnnouncementOverlay />
                            </Suspense>

                            <TimeTracker />
                            <LevelUpListener />
                            <AdminControls />

                            <div className="fixed top-0 right-0 z-[9999] h-12 flex items-center pr-2 electron-drag pointer-events-none">
                                <div className="pointer-events-auto">
                                    <WindowControls />
                                </div>
                            </div>

                            <MainLayout>
                                {children}
                            </MainLayout>

                            <CommandPalette />
                            <Toaster position="top-right" richColors theme="dark" />
                        </UISettingsProvider>
                    </UserXPProvider>
                </AuthProvider>

            </body>
        </html>
    );
}
