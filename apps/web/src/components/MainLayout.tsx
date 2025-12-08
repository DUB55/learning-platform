'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Define routes where sidebar should be hidden
    const hiddenRoutes = ['/login', '/signup', '/forgot-password', '/orbit', '/'];
    const isHidden = hiddenRoutes.includes(pathname) || pathname === '/login';

    // Also hide if strictly root '/'? Or is that the landing page?
    // Usually '/' is landing.
    const showSidebar = !hiddenRoutes.includes(pathname);

    if (!showSidebar) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
            <Sidebar />
            {/* 
                We remove the 'flex-1 overflow-y-auto relative p-8' from here 
                because pages might want to control their own scrolling or padding 
                (e.g., full-width maps, or split views).
                BUT, most pages currently duplicate:
                <main className="flex-1 overflow-y-auto relative p-8">
                
                If we want to enforce consistency, we SHOULD put it here.
                However, 'Flashcard View' or 'Study Mode' might need full screen.
                The Flashcard view had: <div className="min-h-screen ... flex ..."> <Sidebar /> <main ...> 
                
                If we put <main> here, the Flashcard page will be nested inside it.
                If Flashcard page wants to hide sidebar?
                Flashcard page is: /subjects/[id]/units/.../learning-sets/[id]/page.tsx
                It HAS sidebar currently.
                
                Let's use a standard wrapper, but allow pages to opt-out if needed?
                No, simpler: Layout provides the flex container. Children is strictly the content right of sidebar.
                Children MUST handle their own main tag? Or we provide it?
                
                If I provide <main className="flex-1 w-full relative">, it's safe.
                Scrolling: If I put overflow-y-auto on Main, then window scroll is disabled.
                Standard dashboard usually has main scrollable.
                
                Let's stick to the pattern found in Dashboard:
                <main className="flex-1 overflow-y-auto relative p-8">
                
                But if I enforce p-8, I break full-width pages.
                I will enforce structure but NOT padding.
            */}
            <main className="flex-1 overflow-y-auto relative h-screen">
                {children}
            </main>
        </div>
    );
}
