export default function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
            {/* Sidebar Skeleton (Hidden because Sidebar is static? No, loading might replace sidebar? 
                Actually loading.tsx wraps the page content INSIDE the layout? 
                Sidebar is in Layout usually. 
                If Layout has Sidebar, loading.tsx replaces only page children.
                Dashboard page has Sidebar in line 255 of page.tsx? No, wait. 
                Line 7: import Sidebar from '@/components/Sidebar';
                Line 233 in page.tsx:
                return ( <div ...> <Sidebar /> <main ...> ... )
                So Sidebar IS in the page.
                This means loading.tsx replaces EVERYTHING including Sidebar in Previous Version?
                Usually Layout handles Sidebar.
                If I put loading.tsx in app/dashboard/loading.tsx, it replaces page.tsx.
                So I need Sidebar in Skeleton too?
                Yes. Or move Sidebar to Layout.
                Moving Sidebar to Layout is "10x Engineering".
                But might break things if I don't check Layout.
                Let's stick to adding Sidebar to Skeleton or generic rail.
            */}

            {/* Fake Sidebar */}
            <div className="w-20 bg-slate-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col min-h-screen z-40 hidden md:flex">
                <div className="h-20 flex items-center justify-center">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl animate-pulse" />
                </div>
                <div className="flex-1 py-4 space-y-4 px-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-10 bg-slate-800/50 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>

            <main className="flex-1 overflow-y-auto relative p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header Skeleton */}
                    <header className="flex justify-between items-center mb-10">
                        <div>
                            <div className="h-8 w-48 bg-slate-800 rounded-lg animate-pulse mb-2" />
                            <div className="h-4 w-64 bg-slate-800/50 rounded-lg animate-pulse" />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-64 bg-slate-800 rounded-full animate-pulse hidden md:block" />
                            <div className="h-10 w-10 bg-slate-800 rounded-full animate-pulse" />
                            <div className="h-10 w-10 bg-slate-800 rounded-full animate-pulse" />
                        </div>
                    </header>

                    {/* Stats Grid Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="glass-card p-6 h-32 animate-pulse">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="space-y-2">
                                        <div className="h-4 w-24 bg-slate-800 rounded" />
                                        <div className="h-6 w-16 bg-slate-800 rounded" />
                                    </div>
                                    <div className="h-10 w-10 bg-slate-800 rounded-lg" />
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full w-full mt-4" />
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Subjects Skeleton */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex justify-between items-center">
                                <div className="h-6 w-32 bg-slate-800 rounded animate-pulse" />
                                <div className="h-4 w-16 bg-slate-800 rounded animate-pulse" />
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="glass-card p-6 h-48 animate-pulse border-l-4 border-slate-700">
                                        <div className="space-y-3 mb-6">
                                            <div className="h-6 w-3/4 bg-slate-800 rounded" />
                                            <div className="h-4 w-1/2 bg-slate-800 rounded" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <div className="h-3 w-16 bg-slate-800 rounded" />
                                                <div className="h-3 w-10 bg-slate-800 rounded" />
                                            </div>
                                            <div className="h-2 bg-slate-800 rounded-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity / Upcoming Skeleton */}
                        <div className="space-y-6">
                            <div className="h-6 w-40 bg-slate-800 rounded animate-pulse" />
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="glass-card p-4 h-20 animate-pulse flex items-center gap-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 w-3/4 bg-slate-800 rounded" />
                                            <div className="h-3 w-1/2 bg-slate-800 rounded" />
                                        </div>
                                        <div className="h-8 w-16 bg-slate-800 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
