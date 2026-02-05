'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Clock, Trash2, RefreshCw, Search, Filter, Download, CheckSquare, Square } from 'lucide-react';
import ErrorLogger from '@/lib/ErrorLogger';

interface LogEntry {
    id: string;
    level: 'error' | 'warn' | 'info';
    message: string;
    details: any;
    user_id: string | null;
    created_at: string;
}

export default function AdminLogs() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [levelFilter, setLevelFilter] = useState<'all' | 'error' | 'warn' | 'info'>('all');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('error_logs')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (levelFilter !== 'all') {
                query = query.eq('level', levelFilter);
            }

            const { data, error } = await query.limit(200);

            if (error) {
                if (error.code === 'PGRST116') {
                    setLogs([]);
                    return;
                }
                throw error;
            }
            setLogs(data || []);
            setSelectedIds(new Set());
        } catch (error) {
            console.error('Error fetching logs', error);
        } finally {
            setLoading(false);
        }
    };

    const clearLogs = async () => {
        if (!confirm('Clear all logs?')) return;
        try {
            const { error } = await supabase.from('error_logs').delete().neq('id', '0');
            if (error) throw error;
            setLogs([]);
            setSelectedIds(new Set());
        } catch (error) {
            alert('Failed to clear logs');
        }
    };

    const deleteSelected = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Delete ${selectedIds.size} selected logs?`)) return;

        try {
            const { error } = await supabase
                .from('error_logs')
                .delete()
                .in('id', Array.from(selectedIds));

            if (error) throw error;
            
            setLogs(logs.filter(log => !selectedIds.has(log.id)));
            setSelectedIds(new Set());
        } catch (error) {
            alert('Failed to delete selected logs');
        }
    };

    const exportLogs = () => {
        const logsToExport = selectedIds.size > 0 
            ? logs.filter(l => selectedIds.has(l.id))
            : logs;
        
        const headers = ['ID', 'Level', 'Message', 'User ID', 'Created At', 'Details'];
        const csvContent = [
            headers.join(','),
            ...logsToExport.map(l => [
                l.id,
                l.level,
                `"${l.message?.replace(/"/g, '""')}"`,
                l.user_id || '',
                l.created_at,
                `"${JSON.stringify(l.details).replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `system_logs_${new Date().toISOString()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredLogs.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredLogs.map(l => l.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const filteredLogs = logs.filter(log => 
        (log.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        JSON.stringify(log.details || '').toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <select 
                            value={levelFilter}
                            onChange={(e) => setLevelFilter(e.target.value as any)}
                            className="bg-slate-800/50 border border-white/10 rounded-xl text-white text-sm px-4 py-2 focus:outline-none focus:border-blue-500"
                        >
                            <option value="all">All Levels</option>
                            <option value="error">Errors</option>
                            <option value="warn">Warnings</option>
                            <option value="info">Info</option>
                        </select>
                        <button onClick={fetchLogs} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-4 px-2">
                        <button 
                            onClick={toggleSelectAll}
                            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
                        >
                            {selectedIds.size === filteredLogs.length && filteredLogs.length > 0 ? (
                                <CheckSquare className="w-4 h-4 text-blue-500" />
                            ) : (
                                <Square className="w-4 h-4" />
                            )}
                            {selectedIds.size} Selected
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedIds.size > 0 && (
                            <button 
                                onClick={deleteSelected}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-medium transition-all border border-red-500/20"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                            </button>
                        )}
                        <button 
                            onClick={exportLogs}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-xs font-medium transition-all border border-blue-500/20"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Export CSV
                        </button>
                        <button 
                            onClick={clearLogs}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 text-slate-400 hover:bg-white/10 rounded-lg text-xs font-medium transition-all"
                        >
                            Clear All
                        </button>
                    </div>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto">
                    {loading ? (
                        <div className="p-12 text-center text-slate-500">Loading logs...</div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">No logs found.</div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {filteredLogs.map((log) => (
                                <div 
                                    key={log.id} 
                                    className={`p-4 hover:bg-white/2 transition-colors space-y-2 cursor-pointer ${selectedIds.has(log.id) ? 'bg-blue-500/5' : ''}`}
                                    onClick={() => toggleSelect(log.id)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="pt-0.5">
                                                {selectedIds.has(log.id) ? (
                                                    <CheckSquare className="w-4 h-4 text-blue-500" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-slate-600" />
                                                )}
                                            </div>
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${log.level === 'error' ? 'bg-red-500' : log.level === 'warn' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                                            <span className="text-white font-medium text-sm">{log.message}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                                            <Clock className="w-3 h-3" />
                                            {new Date(log.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    {log.details && (
                                        <div className="pl-11">
                                            <pre className="text-[11px] bg-black/30 p-3 rounded-lg text-slate-400 overflow-x-auto border border-white/5">
                                                {JSON.stringify(log.details, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                    {log.user_id && (
                                        <div className="pl-11 text-[10px] text-slate-600 flex items-center gap-1">
                                            <span className="font-bold">USER_ID:</span> {log.user_id}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
