'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Global Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
            <div className="glass-card max-w-md w-full p-8 text-center border-red-500/30">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">Something went wrong!</h2>
                <p className="text-slate-400 mb-8">
                    We apologize for the inconvenience. An unexpected error has occurred.
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => reset()}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try again
                    </button>

                    <button
                        onClick={() => router.push('/dashboard')}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                        <Home className="w-4 h-4" />
                        Return to Dashboard
                    </button>
                </div>

                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-8 text-left bg-black/30 p-4 rounded-lg overflow-auto max-h-48">
                        <p className="text-red-400 font-mono text-xs break-all">
                            {error.message}
                        </p>
                        {error.digest && (
                            <p className="text-slate-500 font-mono text-xs mt-2">
                                Digest: {error.digest}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
