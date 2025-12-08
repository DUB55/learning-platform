export default function Loading() {
    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <p className="text-slate-400 font-medium animate-pulse">Loading Admin Panel...</p>
            </div>
        </div>
    );
}
