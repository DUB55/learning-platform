'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Edit3, Save, RotateCcw, RotateCw, X, Megaphone, Database as DatabaseIcon, Lightbulb, Layout } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { importStudyGoData } from '@/app/actions/importData';
import ErrorLogger from '@/lib/ErrorLogger';

interface EditAction {
    elementId: string; // XPath or unique selector
    oldText: string;
    newText: string;
}

export default function AdminControls() {
    const { user, profile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [history, setHistory] = useState<EditAction[]>([]);
    const [future, setFuture] = useState<EditAction[]>([]);
    const [pendingChanges, setPendingChanges] = useState<Map<string, string>>(new Map());

    // Broadcast State
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastContent, setBroadcastContent] = useState('');
    const [broadcastPriority, setBroadcastPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
    const [broadcastIcon, setBroadcastIcon] = useState('alert-circle');
    const [broadcastBadgeText, setBroadcastBadgeText] = useState('System Locked by Administrator');

    // Landing Page Toggle State
    const [landingVersion, setLandingVersion] = useState<'classic' | 'modern'>('modern');
    const [isUpdatingLanding, setIsUpdatingLanding] = useState(false);

    // Fetch landing version on mount
    useEffect(() => {
        const fetchLandingVersion = async () => {
            try {
                const { data, error } = await supabase
                    .from('system_settings')
                    .select('value')
                    .eq('key', 'landing_page_version')
                    .single();

                if (data && data.value) {
                    const cleanValue = typeof data.value === 'string' ? data.value.replace(/"/g, '') : data.value;
                    setLandingVersion(cleanValue as 'classic' | 'modern');
                }
            } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            ErrorLogger.error('Error fetching landing version for admin', error);
        }
        };

        if (profile?.is_admin) {
            fetchLandingVersion();
        }
    }, [profile]);

    const handleLandingToggle = async () => {
        const nextVersion = landingVersion === 'modern' ? 'classic' : 'modern';
        setIsUpdatingLanding(true);

        try {
            const { error } = await supabase
                .from('system_settings')
                .upsert({
                    key: 'landing_page_version',
                    value: nextVersion,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });

            if (error) throw error;
            setLandingVersion(nextVersion);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            ErrorLogger.error('Error toggling landing page version', error);
            alert(`Failed to toggle landing page: ${errorMessage}`);
        } finally {
            setIsUpdatingLanding(false);
        }
    };

    // Import State
    const [showImportModal, setShowImportModal] = useState(false);
    const [importPath, setImportPath] = useState('c:\\Users\\Mohammed\\OneDrive - St Michaël College\\2025-2026\\Wiskunde\\Uitwerkingen\\Projects\\Projects\\auto-export-studygo\\export_golden_sample');
    const [isImporting, setIsImporting] = useState(false);

    const toggleEditMode = () => {
        setIsEditing(!isEditing);
        document.body.classList.toggle('admin-edit-mode');
    };

    // Handle global clicks for editing
    useEffect(() => {
        if (!isEditing) return;

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            // Ignore if clicking on the admin controls themselves
            if (target.closest('#admin-controls')) return;

            // Check if target is text-containing element
            if (target.childNodes.length === 1 && target.childNodes[0].nodeType === Node.TEXT_NODE) {
                e.preventDefault();
                makeEditable(target);
            }
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [isEditing]);

    const makeEditable = (element: HTMLElement) => {
        if (element.isContentEditable) return;

        const originalText = element.innerText;
        element.contentEditable = 'true';
        element.focus();
        element.classList.add('outline-blue-500', 'outline', 'outline-2', 'rounded', 'p-1');

        const handleBlur = () => {
            element.contentEditable = 'false';
            element.classList.remove('outline-blue-500', 'outline', 'outline-2', 'rounded', 'p-1');

            const newText = element.innerText;
            if (newText !== originalText) {
                // Add to history
                const selector = getUniqueSelector(element);
                const action: EditAction = {
                    elementId: selector,
                    oldText: originalText,
                    newText: newText
                };

                setHistory(prev => [...prev, action]);
                setFuture([]); // Clear redo stack

                // Track pending change
                setPendingChanges(prev => new Map(prev).set(selector, newText));
            }

            element.removeEventListener('blur', handleBlur);
        };

        element.addEventListener('blur', handleBlur);
    };

    const getUniqueSelector = (el: HTMLElement): string => {
        if (el.id) return '#' + el.id;
        // Simple fallback path generator
        let path = [];
        while (el.parentElement) {
            let tag = el.tagName.toLowerCase();
            let siblings = Array.from(el.parentElement.children);
            if (siblings.length > 1) {
                let index = siblings.indexOf(el) + 1;
                tag += `:nth-child(${index})`;
            }
            path.unshift(tag);
            el = el.parentElement;
        }
        return path.join(' > ');
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const lastAction = history[history.length - 1];
        const element = document.querySelector(lastAction.elementId) as HTMLElement;

        if (element) {
            element.innerText = lastAction.oldText;
            setHistory(prev => prev.slice(0, -1));
            setFuture(prev => [lastAction, ...prev]);

            // Update pending changes
            setPendingChanges(prev => {
                const newMap = new Map(prev);
                newMap.set(lastAction.elementId, lastAction.oldText);
                return newMap;
            });
        }
    };

    const handleRedo = () => {
        if (future.length === 0) return;
        const nextAction = future[0];
        const element = document.querySelector(nextAction.elementId) as HTMLElement;

        if (element) {
            element.innerText = nextAction.newText;
            setFuture(prev => prev.slice(1));
            setHistory(prev => [...prev, nextAction]);

            // Update pending changes
            setPendingChanges(prev => {
                const newMap = new Map(prev);
                newMap.set(nextAction.elementId, nextAction.newText);
                return newMap;
            });
        }
    };

    const handleSave = async () => {
        if (pendingChanges.size === 0) return;

        try {
            const updates = Array.from(pendingChanges.entries()).map(([selector, text]) => ({
                selector,
                text,
                updated_by: user?.id
            }));

            const { error } = await supabase.from('site_content')
                .upsert(updates, { onConflict: 'selector' });

            if (error) throw error;

            alert(`Successfully saved ${pendingChanges.size} changes!`);
            setPendingChanges(new Map());
            setHistory([]);
            setFuture([]);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            ErrorLogger.error('Error saving changes:', error);
            alert(`Failed to save changes: ${errorMessage}`);
        }
    };

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!broadcastTitle || !broadcastContent) return;

        try {
            const { error } = await supabase
                .from('announcements')
                .insert({
                    title: broadcastTitle,
                    content: broadcastContent,
                    priority: broadcastPriority,
                    icon: broadcastIcon,
                    badge_text: broadcastBadgeText,
                    created_by: user?.id
                });

            if (error) throw error;

            alert('Announcement broadcasted successfully!');
            setShowBroadcastModal(false);
            setBroadcastTitle('');
            setBroadcastContent('');
            setBroadcastPriority('normal');
            setBroadcastIcon('alert-circle');
            setBroadcastBadgeText('System Locked by Administrator');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            ErrorLogger.error('Error broadcasting:', error);
            alert(`Failed to broadcast: ${errorMessage}`);
        }
    };

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importPath || !user) return;

        setIsImporting(true);
        try {
            const result = await importStudyGoData(importPath, user.id);
            if (result.success) {
                alert(result.message);
                setShowImportModal(false);
            } else {
                alert(`Import failed: ${result.message}`);
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            ErrorLogger.error('Import Error:', error);
            alert(`Unexpected error: ${errorMessage}`);
        } finally {
            setIsImporting(false);
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        if (!isEditing) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                handleUndo();
            }
            if (e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                handleRedo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isEditing, history, future]);

    if (!profile?.is_admin) return null;

    return (
        <div id="admin-controls" className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2">
            {/* Broadcast Modal */}
            {showBroadcastModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Megaphone className="w-5 h-5 text-blue-400" />
                                Broadcast Announcement
                            </h3>
                            <button onClick={() => setShowBroadcastModal(false)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleBroadcast} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={broadcastTitle}
                                    onChange={(e) => setBroadcastTitle(e.target.value)}
                                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="Announcement Title"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Content</label>
                                <textarea
                                    value={broadcastContent}
                                    onChange={(e) => setBroadcastContent(e.target.value)}
                                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white h-32 resize-none focus:outline-none focus:border-blue-500"
                                    placeholder="Message content..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Display Mode</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setBroadcastPriority('normal')}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${broadcastPriority === 'normal'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        Normal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBroadcastPriority('high')}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${broadcastPriority === 'high'
                                            ? 'bg-orange-600 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        Modal (Once)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBroadcastPriority('urgent')}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${broadcastPriority === 'urgent'
                                            ? 'bg-red-600 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        Blocking
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    {broadcastPriority === 'normal' && "Shows in announcements list only."}
                                    {broadcastPriority === 'high' && "Shows as a popup once per user."}
                                    {broadcastPriority === 'urgent' && "BLOCKS screen for all users. No close button."}
                                </p>
                            </div>

                            {broadcastPriority === 'urgent' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Icon Name (Lucide)</label>
                                        <input
                                            type="text"
                                            value={broadcastIcon}
                                            onChange={(e) => setBroadcastIcon(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                            placeholder="e.g., alert-circle, lock, shield-alert"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Badge Text</label>
                                        <input
                                            type="text"
                                            value={broadcastBadgeText}
                                            onChange={(e) => setBroadcastBadgeText(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                            placeholder="e.g., System Locked by Administrator"
                                        />
                                    </div>
                                </>
                            )}

                            <button
                                type="submit"
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors mt-4"
                            >
                                Send Broadcast
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isEditing && (
                <div className="flex gap-2 mb-2 animate-fade-in">
                    <button
                        onClick={handleLandingToggle}
                        disabled={isUpdatingLanding}
                        className={`p-3 text-white rounded-full shadow-lg transition-all ${landingVersion === 'modern' ? 'bg-orange-600 hover:bg-orange-500' : 'bg-cyan-600 hover:bg-cyan-500'} ${isUpdatingLanding ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={`Switch to ${landingVersion === 'modern' ? 'Classic' : 'Modern'} Landing`}
                    >
                        {isUpdatingLanding ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Layout size={20} />
                        )}
                    </button>
                    <button
                        onClick={() => {
                            // Dispatch custom event to open tip editor in Dashboard
                            window.dispatchEvent(new CustomEvent('open-tip-editor'));
                        }}
                        className="p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-400 transition-all"
                        title="Edit DUB5 Tip"
                    >
                        <Lightbulb size={20} />
                    </button>
                    <button
                        onClick={() => setShowBroadcastModal(true)}
                        className="p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-500 transition-all"
                        title="Broadcast Announcement"
                    >
                        <Megaphone size={20} />
                    </button>
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-500 transition-all"
                        title="Import StudyGo Data"
                    >
                        <DatabaseIcon size={20} />
                    </button>
                    <button
                        onClick={handleUndo}
                        disabled={history.length === 0}
                        className="p-3 bg-slate-800 text-white rounded-full shadow-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        title="Undo (Ctrl+Z)"
                    >
                        <RotateCcw size={20} />
                    </button>
                    <button
                        onClick={handleRedo}
                        disabled={future.length === 0}
                        className="p-3 bg-slate-800 text-white rounded-full shadow-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        title="Redo (Ctrl+Y)"
                    >
                        <RotateCw size={20} />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={pendingChanges.size === 0}
                        className="p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        title="Save Changes"
                    >
                        <Save size={20} />
                    </button>
                </div>
            )}

            <button
                onClick={toggleEditMode}
                className={`p-4 rounded-full shadow-xl transition-all duration-300 ${isEditing
                    ? 'bg-red-600 hover:bg-red-500 rotate-180'
                    : 'bg-blue-600 hover:bg-blue-500'
                    } text-white`}
                title={isEditing ? "Exit Edit Mode" : "Enter Admin Edit Mode"}
            >
                {isEditing ? <X size={24} /> : <Edit3 size={24} />}
            </button>
            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <DatabaseIcon className="w-5 h-5 text-indigo-400" />
                                Import StudyGo Data
                            </h3>
                            <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleImport} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Export Directory Path</label>
                                <input
                                    type="text"
                                    value={importPath}
                                    onChange={(e) => setImportPath(e.target.value)}
                                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
                                    placeholder="C:\path\to\export"
                                    required
                                />
                                <p className="text-[10px] text-slate-500 mt-1">
                                    Ensure this path is accessible by the server.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isImporting}
                                className={`w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isImporting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    'Start Import'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
