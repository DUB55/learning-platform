import './globals.css';
import type { Metadata } from 'next';
import { Inter, Outfit, Roboto, Open_Sans, Playfair_Display } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { UISettingsProvider } from '@/contexts/UISettingsContext';
import AITutorWidget from '@/components/AITutorWidget';
import RoutePrefetcher from '@/components/RoutePrefetcher';
import GlobalLoadingIndicator from '@/components/GlobalLoadingIndicator';
import AdminControls from '@/components/AdminControls';
import GlobalAnnouncementOverlay from '@/components/GlobalAnnouncementOverlay';
import DynamicFontProvider from '../components/DynamicFontProvider';
import SiteContentLoader from '@/components/SiteContentLoader';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const roboto = Roboto({ weight: ['400', '500', '700'], subsets: ['latin'], variable: '--font-roboto' });
const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-opensans' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
    title: 'Leerplatform',
    description: 'AI-Powered Learning Platform',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="nl" className={`${inter.variable} ${outfit.variable} ${roboto.variable} ${openSans.variable} ${playfair.variable}`}>
            <body className="font-sans antialiased">
                <AuthProvider>
                    <UISettingsProvider>
                        <DynamicFontProvider />
                        <SiteContentLoader />
                        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
                            <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                            <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
                        </div>
                        <RoutePrefetcher />
                        <GlobalLoadingIndicator />
                        <GlobalAnnouncementOverlay />
                        <AdminControls />
                        {children}
                        <AITutorWidget />
                    </UISettingsProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
