'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { CheckCircle2, XCircle, RefreshCw, GitCommit, Clock, ShieldAlert } from 'lucide-react';
import { getGitHistory, CommitInfo } from './actions';
import { useRouter } from 'next/navigation';

interface SyncStatus {
    lastSync: string;
    status: 'success' | 'error' | 'active';
    message: string;
}

export default function AdminSyncPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [status, setStatus] = useState<SyncStatus | null>(null);
    const [commits, setCommits] = useState<CommitInfo[]>([]);
    const [lastChecked, setLastChecked] = useState(new Date());

    useEffect(() => {
        if (!loading) {
            if (!user || !profile?.is_admin) {
                router.push('/dashboard');
                return;
            }
            fetchData();
            // Poll for status updates every 5 seconds
            const interval = setInterval(fetchData, 5000);
            return () => clearInterval(interval);
        }
    }, [user, profile, loading, router]);

    const fetchData = async () => {
        try {
            // Fetch status JSON
            const res = await fetch('/git-status.json?t=' + Date.now());
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }

            // Fetch git history
            const history = await getGitHistory();
            setCommits(history);
            setLastChecked(new Date());
        } catch (error) {
            console.error('Error fetching sync data:', error);
        }
    };

    if (loading || !profile?.is_admin) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto relative p-8">
                <div className="max-w-4xl mx-auto">
                    <header className="mb-10">
                        <div className="flex items-center gap-3 mb-2">
                            <ShieldAlert className="w-8 h-8 text-red-500" />
                            <h1 className="text-3xl font-serif font-bold text-white">Git Auto-Sync Status</h1>
                        </div>
                        <p className="text-slate-400">Monitor your automatic code backups and deployment status</p>
                    </header>

                    {/* Actions & Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-medium text-white mb-4">Quick Actions</h3>
                            <a
                                href="https://github.com/Mohammed-88/learning-platform"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="glass-button w-full px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-white hover:bg-white/10 transition-colors"
                            >
                                <Github className="w-5 h-5" />
                                <span>Open GitHub Repository</span>
                            </a>
                        </div>

                        <div className="glass-card p-6">
                            <h3 className="text-lg font-medium text-white mb-2">Local Sync Command</h3>
                            <p className="text-slate-400 text-xs mb-3">Run this on your PC to start background sync:</p>
                            <code className="block bg-black/50 p-3 rounded-lg text-green-400 font-mono text-xs select-all cursor-pointer hover:bg-black/70 transition-colors">
                                wscript run-silent.vbs
                            </code>
                        </div>
                    </div>

                    {/* Status Card */}
                    <div className="glass-card p-8 mb-8 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-medium text-white mb-2">Current Status</h2>
                            <p className="text-slate-400 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Last checked: {lastChecked.toLocaleTimeString()}
                            </p>
                            {status && (
                                <p className="text-slate-300 mt-2 font-mono text-sm bg-black/20 px-3 py-1 rounded-lg inline-block">
                                    {status.message}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            {status?.status === 'success' ? (
                                <>
                                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                                    </div>
                                    <span className="text-green-400 font-bold uppercase tracking-wider text-sm">Synced</span>
                                </>
                            ) : status?.status === 'error' ? (
                                <>
                                    <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                                        <XCircle className="w-10 h-10 text-red-500" />
                                    </div>
                                    <span className="text-red-400 font-bold uppercase tracking-wider text-sm">Error</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center border-2 border-blue-500 animate-pulse">
                                        <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
                                    </div>
                                    <span className="text-blue-400 font-bold uppercase tracking-wider text-sm">Active</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Commit History */}
                    <h3 className="text-xl font-medium text-white mb-6 flex items-center gap-2">
                        <GitCommit className="w-5 h-5 text-blue-400" />
                        Recent Commits
                    </h3>

                    <div className="space-y-4">
                        {commits.map((commit) => (
                            <div key={commit.hash} className="glass-card p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                                <div className="font-mono text-blue-400 text-sm bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                                    {commit.hash}
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-medium">{commit.message}</p>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                        <span>{commit.author}</span>
                                        <span>•</span>
                                        <span>{commit.date}</span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {commits.length === 0 && (
                            <div className="text-center py-10 text-slate-500">
                                No commit history available
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
