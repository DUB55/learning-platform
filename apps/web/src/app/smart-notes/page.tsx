'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import TextAlign from '@tiptap/extension-text-align';
import CharacterCount from '@tiptap/extension-character-count';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TiptapYoutube from '@tiptap/extension-youtube';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { useAuth } from '@/contexts/AuthContext';
import {
    Save, Sparkles, Bold, Italic, List,
    ListOrdered, Heading1, Heading2, Quote, Code,
    Loader2, Lightbulb, Wand2, Plus, Trash2,
    Undo, Redo, Image as ImageIcon, Video,
    CheckSquare, Highlighter, AlignLeft, AlignCenter,
    AlignRight, Search, FileText, Clock, ChevronRight,
    Share2, Underline as UnderlineIcon,
    Table as TableIcon,
    FileJson, FileCode,
    Settings, Brain, Info, AlertCircle,
    CheckCircle2, Info as InfoIcon, StickyNote, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { dub5ai } from '@/lib/dub5ai';
import ErrorLogger from '@/lib/ErrorLogger';

type Note = { 
    id: string; 
    name: string; 
    content: string; 
    createdAt: string; 
    updatedAt: string;
    folder?: string;
};

type Collaborator = {
    id: string;
    name: string;
    color: string;
};

type MenuItem = {
    name: string;
    icon: React.ElementType;
    action: () => void;
};

type PresenceState = {
    presence_ref: string;
    name?: string;
    color?: string;
};

export default function SmartNotesPage() {
    const { user, loading: authLoading, updateXP } = useAuth();
    
    const [title, setTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState('');
    const [showSuggestion, setShowSuggestion] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [notes, setNotes] = useState<Note[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [cursorPositions, setCursorPositions] = useState<Record<string, { x: number, y: number, name: string, color: string }>>({});
    const [isSharing, setIsSharing] = useState(false);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [messageBox, setMessageBox] = useState<{
        show: boolean;
        title: string;
        message: string;
        type: 'info' | 'success' | 'error' | 'confirm';
        onConfirm?: () => void;
    }>({ show: false, title: '', message: '', type: 'info' });
    const [promptBox, setPromptBox] = useState<{
        show: boolean;
        title: string;
        placeholder: string;
        value: string;
        onConfirm?: (value: string) => void;
    }>({ show: false, title: '', placeholder: '', value: '' });
    const channelRef = useRef<RealtimeChannel | null>(null);
    const saveControllerRef = useRef<AbortController | null>(null);

    const showMessage = (title: string, message: string, type: 'info' | 'success' | 'error' | 'confirm' = 'info', onConfirm?: () => void) => {
        setMessageBox({ show: true, title, message, type, onConfirm });
    };

    const showPrompt = (title: string, placeholder: string, onConfirm: (value: string) => void) => {
        setPromptBox({ show: true, title, placeholder, value: '', onConfirm });
    };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // history is disabled to avoid conflict with shared content
            }),
            Placeholder.configure({
                placeholder: 'Start writing your masterpiece...',
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-lg border border-white/10 max-w-full h-auto',
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-400 hover:text-blue-300 underline underline-offset-4',
                },
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Highlight.configure({
                multicolor: true,
            }),
            Typography,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            CharacterCount,
            Underline,
            Subscript,
            Superscript,
            TextStyle,
            Color,
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            TiptapYoutube.configure({
                width: 640,
                height: 480,
            }),
        ],
        content: '',
        immediatelyRender: false, // Fix Hydration mismatch
        editorProps: {
            attributes: {
                class: 'prose prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none min-h-[500px] max-w-none',
            },
        },
        onUpdate: ({ editor }) => {
            // Trigger auto-save or local storage update
            updateLocalNote(editor.getHTML());
            
            // Broadcast changes to collaborators using the ref
            if (activeId && user && channelRef.current) {
                channelRef.current.send({
                    type: 'broadcast',
                    event: 'content-change',
                    payload: { 
                        content: editor.getHTML(), 
                        userId: user.id,
                        userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous'
                    }
                });
            }
        },
        onSelectionUpdate: ({ editor }) => {
            if (activeId && user && channelRef.current) {
                const { from } = editor.state.selection;
                try {
                    const pos = editor.view.coordsAtPos(from);
                    const editorBounds = editor.view.dom.getBoundingClientRect();
                    
                    // Calculate relative position within the editor
                    const x = pos.left - editorBounds.left;
                    const y = pos.top - editorBounds.top;

                    channelRef.current.send({
                        type: 'broadcast',
                        event: 'cursor-move',
                        payload: {
                            userId: user.id,
                            userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
                            x,
                            y
                        }
                    });
                } catch {
                    // Ignore errors when coordsAtPos fails (e.g. during rapid updates)
                }
            }
        },
    });

    // Real-time Collaboration Effect
    useEffect(() => {
        if (!activeId || !user) return;

        // Reset cursor positions when switching notes
        setCursorPositions({});

        const channel = supabase.channel(`note:${activeId}`, {
            config: {
                presence: {
                    key: user.id,
                },
            },
        });

        channelRef.current = channel;

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const users = Object.values(state).flat().map((p) => {
                    const presence = p as unknown as PresenceState;
                    return {
                        id: presence.presence_ref,
                        name: presence.name || 'Collaborator',
                        color: presence.color || '#3b82f6'
                    };
                }) as Collaborator[];
                setCollaborators(users);
            })
            .on('broadcast', { event: 'content-change' }, ({ payload }) => {
                if (payload.userId !== user.id && editor) {
                    const currentContent = editor.getHTML();
                    if (currentContent !== payload.content) {
                        if (!editor.isFocused) {
                            editor.commands.setContent(payload.content, { emitUpdate: false });
                        }
                    }
                }
            })
            .on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
                if (payload.userId !== user.id) {
                    const collaborator = collaborators.find(c => c.id === payload.userId);
                    setCursorPositions(prev => ({
                        ...prev,
                        [payload.userId]: {
                            x: payload.x,
                            y: payload.y,
                            name: payload.userName,
                            color: collaborator?.color || '#3b82f6'
                        }
                    }));
                }
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
                        color: '#' + Math.floor(Math.random()*16777215).toString(16),
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            channel.unsubscribe();
            channelRef.current = null;
        };
    }, [activeId, user, editor, collaborators]);

    // Load notes from local storage
    useEffect(() => {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('smart_notes_v2') : null;
        if (raw) {
            try {
                const parsed: Note[] = JSON.parse(raw);
                setNotes(parsed);
                
                // Check for shared note ID in URL
                const urlParams = new URLSearchParams(window.location.search);
                const sharedId = urlParams.get('id');
                
                if (sharedId) {
                    const sharedNote = parsed.find(n => n.id === sharedId);
                    if (sharedNote) {
                        setActiveId(sharedNote.id);
                        setTitle(sharedNote.name);
                        editor?.commands.setContent(sharedNote.content);
                    } else if (parsed.length > 0 && !activeId) {
                        const first = parsed[0];
                        setActiveId(first.id);
                        setTitle(first.name);
                        editor?.commands.setContent(first.content);
                    }
                } else if (parsed.length > 0 && !activeId) {
                    const first = parsed[0];
                    setActiveId(first.id);
                    setTitle(first.name);
                    editor?.commands.setContent(first.content);
                }
            } catch (e) {
                ErrorLogger.error('Error parsing notes', e);
            }
        }
    }, [editor, activeId]);

    // Auto-save logic
    useEffect(() => {
        if (!editor || !activeId) return;

        const timer = setTimeout(() => {
            saveNote();
        }, 5000); // Auto-save after 5 seconds of inactivity

        return () => clearTimeout(timer);
    }, [editor?.getHTML(), activeId, title]);

    const updateLocalNote = useCallback((content: string) => {
        if (!activeId) return;
        const now = new Date().toISOString();
        setNotes(prev => {
            const updated = prev.map(n => 
                n.id === activeId ? { ...n, content, updatedAt: now } : n
            );
            localStorage.setItem('smart_notes_v2', JSON.stringify(updated));
            return updated;
        });
    }, [activeId]);

    const saveNote = async () => {
        if (!activeId || !editor) return;
        
        setIsSaving(true);
        try {
            const content = editor.getHTML();
            
            // Local save first
            updateLocalNote(content);

            // Cloud save if user is logged in
            if (user) {
                const { error } = await supabase
                    .from('notes')
                    .upsert({
                        id: activeId,
                        user_id: user.id,
                        title: title || 'Untitled Note',
                        content,
                        updated_at: new Date().toISOString()
                    });

                if (error) throw error;
                
                setLastSaved(new Date());
                updateXP(10, 'Saved note to cloud');
            } else {
                setLastSaved(new Date());
                showMessage('Saved Locally', 'Your changes are saved on this device. Sign in to sync with the cloud.', 'info');
            }
        } catch (error) {
            ErrorLogger.error('Failed to save note', error);
            showMessage('Error', 'Failed to save note to cloud. It is still saved locally.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleShare = async () => {
        if (!activeId) return;
        
        setIsSharing(true);
        const shareUrl = `${window.location.origin}/smart-notes?id=${activeId}`;
        
        try {
            await navigator.clipboard.writeText(shareUrl);
            showMessage('Success', 'Collaboration link copied to clipboard! Share this with others to edit together.', 'success');
        } catch (err) {
            ErrorLogger.error('Failed to copy share link', err);
        } finally {
            setTimeout(() => setIsSharing(false), 2000);
        }
    };

    const newNote = () => {
        showPrompt('New Note', 'Enter note title...', (name) => {
            const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
            const now = new Date().toISOString();
            const noteName = name.trim() || 'Untitled';
            const item: Note = { id, name: noteName, content: '', createdAt: now, updatedAt: now };
            
            setNotes(prev => [item, ...prev]);
            setActiveId(id);
            setTitle(noteName);
            editor?.commands.setContent('');
            
            // Save immediately to local storage
            const updatedNotes = [item, ...notes];
            localStorage.setItem('smart_notes_v2', JSON.stringify(updatedNotes));
        });
    };

    const deleteNote = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        
        showMessage(
            'Confirm Delete',
            'Are you sure you want to delete this note? This action cannot be undone.',
            'confirm',
            () => {
                const nextNotes = notes.filter(n => n.id !== id);
                setNotes(nextNotes);
                localStorage.setItem('smart_notes_v2', JSON.stringify(nextNotes));
                
                if (activeId === id) {
                    if (nextNotes.length > 0) {
                        const first = nextNotes[0];
                        setActiveId(first.id);
                        setTitle(first.name);
                        editor?.commands.setContent(first.content);
                    } else {
                        setActiveId(null);
                        setTitle('');
                        editor?.commands.setContent('');
                    }
                }
            }
        );
    };

    const openNote = (id: string) => {
        const n = notes.find(x => x.id === id);
        if (!n) return;
        setActiveId(id);
        setTitle(n.name);
        editor?.commands.setContent(n.content);
    };

    const enhanceWithAI = async (action: 'improve' | 'summarize' | 'expand' | 'keypoints' | 'quiz' | 'recall') => {
        if (!editor || editor.isEmpty) return;

        setIsEnhancing(true);
        setShowSuggestion(false);

        try {
            const content = editor.getHTML();
            let prompt = '';
            switch (action) {
                case 'improve':
                    prompt = `Improve and enhance the following HTML text while maintaining its meaning and structure. Fix grammar, improve clarity, and make it more professional. Return only the improved HTML:\n\n${content}`;
                    break;
                case 'summarize':
                    prompt = `Create a concise HTML summary of the following content. Use bullet points if helpful:\n\n${content}`;
                    break;
                case 'expand':
                    prompt = `Expand on the following content with more details, examples, and explanations. Maintain the HTML structure:\n\n${content}`;
                    break;
                case 'keypoints':
                    prompt = `Extract the key points from the following content as an HTML bullet list:\n\n${content}`;
                    break;
                case 'quiz':
                    prompt = `Based on the following content, generate a 5-question multiple choice quiz in HTML format. Include the correct answers at the bottom:\n\n${content}`;
                    break;
                case 'recall':
                    prompt = `Generate 5 challenging active recall questions and hints based on this content. Format as an HTML list where questions are bold and hints are in italics:\n\n${content}`;
                    break;
            }

            const response = await dub5ai.streamRequest(prompt, {
                task: 'enhance_notes'
            });

            setAiSuggestion(response);
            setShowSuggestion(true);
        } catch (error) {
            ErrorLogger.error('AI enhancement error', error);
        } finally {
            setIsEnhancing(false);
        }
    };

    const applySuggestion = () => {
        if (editor && aiSuggestion) {
            editor.commands.setContent(aiSuggestion);
            setShowSuggestion(false);
            setAiSuggestion('');
        }
    };

    const filteredNotes = notes.filter(n => 
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const exportAs = (format: 'html' | 'text' | 'json') => {
        if (!editor) return;
        let content = '';
        let type = '';
        let ext = '';

        if (format === 'html') {
            content = editor.getHTML();
            type = 'text/html';
            ext = 'html';
        } else if (format === 'text') {
            content = editor.getText();
            type = 'text/plain';
            ext = 'txt';
        } else {
            content = JSON.stringify(editor.getJSON());
            type = 'application/json';
            ext = 'json';
        }

        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title || 'Untitled'}.${ext}`;
        a.click();
    };

    const menuItems: Record<string, MenuItem[]> = {
        'File': [
            { name: 'New Document', icon: Plus, action: () => newNote() },
            { name: 'Save to Cloud', icon: Save, action: () => saveNote() },
            { name: 'Export as HTML', icon: FileCode, action: () => exportAs('html') },
            { name: 'Export as Text', icon: FileText, action: () => exportAs('text') },
            { name: 'Export as JSON', icon: FileJson, action: () => exportAs('json') },
        ],
        'Edit': [
            { name: 'Undo', icon: Undo, action: () => editor?.commands.undo() },
            { name: 'Redo', icon: Redo, action: () => editor?.commands.redo() },
            { name: 'Clear Content', icon: Trash2, action: () => showMessage('Confirm', 'Are you sure you want to clear all content?', 'confirm', () => editor?.commands.clearContent()) },
        ],
        'View': [
            { name: 'Toggle Sidebar', icon: List, action: () => setIsSidebarOpen(!isSidebarOpen) },
        ],
        'Format': [
            { name: 'Bold', icon: Bold, action: () => editor?.chain().focus().toggleBold().run() },
            { name: 'Italic', icon: Italic, action: () => editor?.chain().focus().toggleItalic().run() },
            { name: 'Underline', icon: UnderlineIcon, action: () => editor?.chain().focus().toggleUnderline().run() },
            { name: 'Heading 1', icon: Heading1, action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run() },
            { name: 'Heading 2', icon: Heading2, action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
        ],
        'Extensions': [
            { name: 'AI Grammar Check', icon: Brain, action: () => enhanceWithAI('improve') },
            { name: 'Summarize', icon: Sparkles, action: () => enhanceWithAI('summarize') },
            { name: 'Extract Key Points', icon: CheckSquare, action: () => enhanceWithAI('keypoints') },
            { name: 'Generate Quiz', icon: Plus, action: () => enhanceWithAI('quiz') },
        ],
        'Help': [
            { name: 'About Smart Notes', icon: Info, action: () => showMessage('About', 'Smart Notes v2.0 - A collaborative AI-powered note taking application.', 'info') },
            { name: 'Keyboard Shortcuts', icon: Settings, action: () => showMessage('Shortcuts', 'Ctrl+B: Bold, Ctrl+I: Italic, Ctrl+U: Underline, Ctrl+Z: Undo, Ctrl+Shift+Z: Redo', 'info') },
        ],
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <StickyNote className="w-6 h-6 text-blue-500" />
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm font-medium animate-pulse">Initializing AI Workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-950 text-white overflow-hidden font-sans selection:bg-blue-500/30">
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Modern Glass Header */}
                <header className="h-16 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50 flex flex-col justify-center">
                    <div className="flex items-center justify-between px-4 md:px-6">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-2 hover:bg-white/5 rounded-xl text-slate-400 md:hidden transition-colors"
                            >
                                <List size={20} />
                            </button>
                            <div className="flex items-center gap-3 group">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/20 group-hover:scale-105 transition-transform duration-300">
                                    <StickyNote className="w-5 h-5 text-white" />
                                </div>
                                <div className="hidden sm:block">
                                    <h1 className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 leading-none">Smart Notes</h1>
                                    <p className="text-[10px] text-blue-400/80 mt-1 uppercase tracking-widest font-black">AI Powered</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 max-w-2xl mx-8 hidden md:block">
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Untitled Document"
                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                                    onBlur={() => updateLocalNote(editor?.getHTML() || '')}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    {isSaving ? (
                                        <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                                    ) : (
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Collaboration Section */}
                            {collaborators.length > 0 && (
                                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 mr-2">
                                    <div className="flex -space-x-2">
                                        {collaborators.map((c, i) => (
                                            <div 
                                                key={c.id || i} 
                                                className="w-7 h-7 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white relative group ring-2 ring-white/5"
                                                style={{ backgroundColor: c.color }}
                                                title={c.name}
                                            >
                                                {c.name.substring(0, 1).toUpperCase()}
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                                        {collaborators.length} Online
                                    </span>
                                </div>
                            )}

                            <button
                                onClick={saveNote}
                                disabled={isSaving || !editor}
                                className="relative group overflow-hidden px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all text-xs font-bold shadow-lg shadow-blue-600/20 disabled:opacity-50"
                            >
                                <div className="flex items-center gap-2">
                                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                    <span className="hidden xs:inline">Save Changes</span>
                                </div>
                            </button>

                            <div className="relative">
                                <button
                                    onClick={() => setActiveMenu(activeMenu === 'options' ? null : 'options')}
                                    className={`p-2 rounded-xl transition-all border ${activeMenu === 'options' ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/10'}`}
                                >
                                    <Settings size={20} />
                                </button>
                                <AnimatePresence>
                                    {activeMenu === 'options' && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                className="absolute top-full right-0 mt-3 w-64 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden p-2 backdrop-blur-xl ring-1 ring-white/10"
                                            >
                                                {Object.entries(menuItems).map(([category, items]) => (
                                                    <div key={category} className="mb-2 last:mb-0">
                                                        <div className="px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                                            {category}
                                                            <div className="h-px flex-1 bg-white/5 ml-3" />
                                                        </div>
                                                        <div className="space-y-0.5 mt-1">
                                                            {items.map((item, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => {
                                                                        item.action();
                                                                        setActiveMenu(null);
                                                                    }}
                                                                    className="w-full flex items-center gap-3 px-3 py-2 text-[12px] text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all group"
                                                                >
                                                                    <div className="p-1.5 rounded-md bg-white/5 group-hover:bg-blue-500/20 transition-colors">
                                                                        <item.icon size={14} className="group-hover:text-blue-400 transition-colors" />
                                                                    </div>
                                                                    <span className="font-medium">{item.name}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden relative">
                    {/* Left Sidebar - Note List */}
                    <aside className={`
                        absolute md:relative inset-y-0 left-0 w-72 border-r border-white/5 bg-slate-900/50 backdrop-blur-2xl flex flex-col z-[45] transition-all duration-300 ease-in-out md:translate-x-0
                        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
                    `}>
                        <div className="p-5 space-y-4">
                            <button 
                                onClick={() => { newNote(); }}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold transition-all shadow-lg shadow-blue-900/20 hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98] group"
                            >
                                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                                Create New Note
                            </button>
                            
                            <div className="relative group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search your notes..."
                                    className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-[12px] text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 pb-20 space-y-1 custom-scrollbar">
                            {filteredNotes.length === 0 ? (
                                <div className="px-4 py-12 text-center">
                                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <FileText className="w-6 h-6 text-slate-700 opacity-50" />
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium">No documents found</p>
                                </div>
                            ) : (
                                filteredNotes.map(n => (
                                    <button 
                                        key={n.id} 
                                        onClick={() => { openNote(n.id); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                                        className={`w-full group p-3 rounded-xl text-left transition-all border ${
                                            activeId === n.id 
                                            ? 'bg-blue-600/10 border-blue-500/20 shadow-lg shadow-blue-900/10' 
                                            : 'hover:bg-white/5 border-transparent'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className={`text-sm font-bold truncate ${activeId === n.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                                    {n.name || 'Untitled Note'}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                                                        {new Date(n.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                    {activeId === n.id && (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                                    )}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={(e) => deleteNote(n.id, e)}
                                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
                        {/* Mobile Title Input */}
                        <div className="p-4 md:hidden border-b border-white/5 bg-slate-900/30">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Untitled Note"
                                className="w-full bg-transparent border-none text-xl font-bold text-white focus:outline-none placeholder:text-slate-600"
                            />
                        </div>

                        {/* Professional Editor Toolbar */}
                        {editor && (
                            <div className="h-14 border-b border-white/5 bg-slate-900/40 backdrop-blur-xl flex items-center px-4 gap-1.5 overflow-x-auto no-scrollbar sticky top-0 z-40">
                                <div className="flex items-center bg-white/5 rounded-xl p-1 gap-1">
                                    <ToolbarButton 
                                        onClick={() => editor.chain().focus().toggleBold().run()}
                                        active={editor.isActive('bold')}
                                        icon={Bold}
                                        title="Bold (Ctrl+B)"
                                    />
                                    <ToolbarButton 
                                        onClick={() => editor.chain().focus().toggleItalic().run()}
                                        active={editor.isActive('italic')}
                                        icon={Italic}
                                        title="Italic (Ctrl+I)"
                                    />
                                    <ToolbarButton 
                                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                                        active={editor.isActive('underline')}
                                        icon={UnderlineIcon}
                                        title="Underline (Ctrl+U)"
                                    />
                                    <ToolbarButton 
                                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                                        active={editor.isActive('highlight')}
                                        icon={Highlighter}
                                        title="Highlight"
                                    />
                                </div>

                                <div className="h-6 w-px bg-white/10 mx-1"></div>

                                <div className="flex items-center bg-white/5 rounded-xl p-1 gap-1">
                                    <ToolbarButton 
                                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                                        active={editor.isActive('heading', { level: 1 })}
                                        icon={Heading1}
                                        title="Heading 1"
                                    />
                                    <ToolbarButton 
                                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                                        active={editor.isActive('heading', { level: 2 })}
                                        icon={Heading2}
                                        title="Heading 2"
                                    />
                                </div>

                                <div className="h-6 w-px bg-white/10 mx-1"></div>

                                <div className="flex items-center bg-white/5 rounded-xl p-1 gap-1">
                                    <ToolbarButton 
                                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                                        active={editor.isActive('bulletList')}
                                        icon={List}
                                        title="Bullet List"
                                    />
                                    <ToolbarButton 
                                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                        active={editor.isActive('orderedList')}
                                        icon={ListOrdered}
                                        title="Ordered List"
                                    />
                                    <ToolbarButton 
                                        onClick={() => editor.chain().focus().toggleTaskList().run()}
                                        active={editor.isActive('taskList')}
                                        icon={CheckSquare}
                                        title="Task List"
                                    />
                                </div>

                                <div className="h-6 w-px bg-white/10 mx-1"></div>

                                <div className="flex items-center bg-white/5 rounded-xl p-1 gap-1">
                                    <ToolbarButton 
                                        onClick={() => {
                                            showPrompt('Insert Image', 'Enter image URL...', (url) => {
                                                if (url) editor.chain().focus().setImage({ src: url }).run();
                                            });
                                        }}
                                        icon={ImageIcon}
                                        title="Insert Image"
                                    />
                                    <ToolbarButton 
                                        onClick={() => {
                                            showPrompt('Insert YouTube Video', 'Enter YouTube URL...', (url) => {
                                                if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
                                            });
                                        }}
                                        icon={Video}
                                        title="Insert YouTube"
                                    />
                                    <ToolbarButton 
                                        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                                        icon={TableIcon}
                                        title="Insert Table"
                                    />
                                </div>

                                <div className="h-6 w-px bg-white/10 mx-1"></div>

                                <div className="flex items-center bg-white/5 rounded-xl p-1 gap-1">
                                    <ToolbarButton 
                                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                                        active={editor.isActive({ textAlign: 'left' })}
                                        icon={AlignLeft}
                                        title="Align Left"
                                    />
                                    <ToolbarButton 
                                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                                        active={editor.isActive({ textAlign: 'center' })}
                                        icon={AlignCenter}
                                        title="Align Center"
                                    />
                                    <ToolbarButton 
                                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                                        active={editor.isActive({ textAlign: 'right' })}
                                        icon={AlignRight}
                                        title="Align Right"
                                    />
                                </div>

                                <div className="ml-auto flex items-center gap-2">
                                    <button
                                        onClick={() => enhanceWithAI('improve')}
                                        disabled={isEnhancing}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-bold shadow-lg shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 group"
                                    >
                                        {isEnhancing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />}
                                        AI Enhance
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>



                    {/* Editor Canvas */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/30">
                        <div className="max-w-4xl mx-auto px-8 py-16 lg:px-16 min-h-full flex flex-col">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    updateLocalNote(editor?.getHTML() || '');
                                }}
                                placeholder="Enter document title..."
                                className="w-full text-4xl lg:text-5xl font-extrabold bg-transparent border-none text-white placeholder:text-slate-700 focus:outline-none mb-8 tracking-tight transition-all"
                            />
                            
                            <div className="flex-1 relative group">
                                <EditorContent 
                                    editor={editor} 
                                    className="relative z-10 min-h-[500px]" 
                                />
                                
                                {/* Collaborative Cursors */}
                                {Object.entries(cursorPositions).map(([id, pos]) => (
                                    <div 
                                        key={id}
                                        className="absolute pointer-events-none z-50 transition-all duration-150 ease-out"
                                        style={{ 
                                            left: pos.x, 
                                            top: pos.y,
                                        }}
                                    >
                                        <div 
                                            className="w-0.5 h-6 animate-pulse"
                                            style={{ backgroundColor: pos.color }}
                                        />
                                        <div 
                                            className="absolute top-full left-0 px-2 py-0.5 rounded-md text-[10px] font-bold text-white whitespace-nowrap shadow-xl z-[60] backdrop-blur-md"
                                            style={{ backgroundColor: `${pos.color}CC` }}
                                        >
                                            {pos.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Fixed Bottom Information Bar */}
                    <div className="h-14 border-t border-white/5 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between px-6 z-50">
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest group">
                                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                                    <FileText size={14} />
                                </div>
                                <span>{editor?.storage.characterCount?.words() || 0} Words</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest group">
                                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                                    <Clock size={14} />
                                </div>
                                <span>{Math.ceil((editor?.storage.characterCount?.words() || 0) / 200)} Min Read</span>
                            </div>
                            {lastSaved && (
                                <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest group">
                                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                                        <Save size={14} />
                                    </div>
                                    <span>Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center bg-white/5 rounded-xl p-1 mr-2">
                                <button 
                                    onClick={() => enhanceWithAI('improve')}
                                    disabled={isEnhancing}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-[10px] font-bold text-slate-300 transition-all group disabled:opacity-50"
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                                    Refine
                                </button>
                                <button 
                                    onClick={() => enhanceWithAI('summarize')}
                                    disabled={isEnhancing}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-[10px] font-bold text-slate-300 transition-all group disabled:opacity-50"
                                >
                                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                                    Summarize
                                </button>
                                <button 
                                    onClick={() => enhanceWithAI('keypoints')}
                                    disabled={isEnhancing}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-[10px] font-bold text-slate-300 transition-all group disabled:opacity-50"
                                >
                                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                                    Key Points
                                </button>
                            </div>
                            <div className="w-px h-6 bg-white/10 mx-1"></div>
                            <button 
                                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-[11px] font-bold text-white transition-all shadow-lg shadow-blue-900/30 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Wand2 className="w-4 h-4" />
                                AI Workspace
                            </button>
                        </div>
                    </div>

                    {/* AI Suggestion Modal */}
                    {showSuggestion && (
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
                            <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center border border-blue-500/20">
                                            <Sparkles className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white tracking-tight">AI Enhancement</h3>
                                            <p className="text-xs text-slate-400 mt-0.5">Review and apply suggested changes</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setShowSuggestion(false)}
                                        className="p-2.5 hover:bg-white/5 rounded-xl text-slate-400 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar prose prose-invert prose-blue max-w-none bg-slate-950/20">
                                    <div className="text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: aiSuggestion }} />
                                </div>
                                <div className="p-8 border-t border-white/5 bg-slate-900/50 flex gap-4">
                                    <button 
                                        onClick={() => setShowSuggestion(false)}
                                        className="flex-1 py-3.5 rounded-2xl border border-white/10 text-slate-300 font-bold hover:bg-white/5 transition-all"
                                    >
                                        Discard Changes
                                    </button>
                                    <button 
                                        onClick={applySuggestion}
                                        className="flex-1 py-3.5 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/30"
                                    >
                                        Apply Enhancement
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading Overlay */}
                    {isEnhancing && (
                        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md z-[90] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-600/30 blur-2xl rounded-full animate-pulse" />
                                    <div className="relative w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-600/50">
                                        <Sparkles className="w-10 h-10 text-white animate-pulse" />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-white tracking-tight">AI is crafting...</h3>
                                    <p className="text-sm text-slate-400 mt-1">Generating professional content</p>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* Right Sidebar - Analytics & Tools */}
                <aside className="w-72 border-l border-white/5 bg-slate-900/30 backdrop-blur-sm hidden xl:flex flex-col">
                    <div className="p-8 space-y-10">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                Export Tools
                            </h3>
                            <div className="space-y-3">
                                <button 
                                    onClick={() => exportAs('html')}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-xs font-bold transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-blue-400 transition-colors">
                                            <FileCode size={16} />
                                        </div>
                                        Export as HTML
                                    </div>
                                    <ChevronRight size={14} className="text-slate-600 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button 
                                    onClick={() => exportAs('text')}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-xs font-bold transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-amber-400 transition-colors">
                                            <FileText size={16} />
                                        </div>
                                        Export as Text
                                    </div>
                                    <ChevronRight size={14} className="text-slate-600 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button 
                                    onClick={() => exportAs('json')}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-xs font-bold transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-emerald-400 transition-colors">
                                            <FileJson size={16} />
                                        </div>
                                        Export as JSON
                                    </div>
                                    <ChevronRight size={14} className="text-slate-600 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                AI Intelligence
                            </h3>
                            <div className="space-y-3">
                                <button 
                                    onClick={() => enhanceWithAI('improve')}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-bold hover:bg-blue-600/20 transition-all"
                                >
                                    <div className="p-2 rounded-lg bg-blue-600/20">
                                        <Brain size={16} />
                                    </div>
                                    AI Grammar Check
                                </button>
                                <button 
                                    onClick={() => enhanceWithAI('keypoints')}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-600/20 transition-all"
                                >
                                    <div className="p-2 rounded-lg bg-emerald-600/20">
                                        <CheckSquare size={16} />
                                    </div>
                                    Extract Key Points
                                </button>
                                <button 
                                    onClick={() => enhanceWithAI('quiz')}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-purple-600/10 border border-purple-500/20 text-purple-400 text-xs font-bold hover:bg-purple-600/20 transition-all"
                                >
                                    <div className="p-2 rounded-lg bg-purple-600/20">
                                        <Plus size={16} />
                                    </div>
                                    Practice Quiz
                                </button>
                                <button 
                                    onClick={() => enhanceWithAI('recall')}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-amber-600/10 border border-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-600/20 transition-all"
                                >
                                    <div className="p-2 rounded-lg bg-amber-600/20">
                                        <Brain size={16} />
                                    </div>
                                    Active Recall
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>

            {/* Custom Message Box */}
            <AnimatePresence>
                {messageBox.show && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-slate-900 border border-white/10 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="flex items-center gap-5 mb-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                                        messageBox.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 shadow-emerald-500/10' :
                                        messageBox.type === 'error' ? 'bg-red-500/20 text-red-400 shadow-red-500/10' :
                                        messageBox.type === 'confirm' ? 'bg-amber-500/20 text-amber-400 shadow-amber-500/10' :
                                        'bg-blue-500/20 text-blue-400 shadow-blue-500/10'
                                    }`}>
                                        {messageBox.type === 'success' ? <CheckCircle2 size={28} /> :
                                         messageBox.type === 'error' ? <AlertCircle size={24} /> :
                                         messageBox.type === 'confirm' ? <AlertCircle size={24} /> :
                                         <InfoIcon size={24} />}
                                    </div>
                                    <h3 className="text-xl font-bold text-white">{messageBox.title}</h3>
                                </div>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    {messageBox.message}
                                </p>
                            </div>
                            <div className="p-4 bg-white/5 flex items-center justify-end gap-3">
                                {messageBox.type === 'confirm' ? (
                                    <>
                                        <button
                                            onClick={() => setMessageBox(prev => ({ ...prev, show: false }))}
                                            className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-bold"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                messageBox.onConfirm?.();
                                                setMessageBox(prev => ({ ...prev, show: false }));
                                            }}
                                            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all text-sm font-bold shadow-lg shadow-red-600/20"
                                        >
                                            Confirm
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setMessageBox(prev => ({ ...prev, show: false }))}
                                        className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all text-sm font-bold shadow-lg shadow-blue-600/20"
                                    >
                                        Got it
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Custom Prompt Box */}
            <AnimatePresence>
                {promptBox.show && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                        >
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-white mb-4">{promptBox.title}</h3>
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder={promptBox.placeholder}
                                    value={promptBox.value}
                                    onChange={(e) => setPromptBox(prev => ({ ...prev, value: e.target.value }))}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            promptBox.onConfirm?.(promptBox.value);
                                            setPromptBox(prev => ({ ...prev, show: false }));
                                        } else if (e.key === 'Escape') {
                                            setPromptBox(prev => ({ ...prev, show: false }));
                                        }
                                    }}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
                                />
                            </div>
                            <div className="p-4 bg-white/5 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setPromptBox(prev => ({ ...prev, show: false }))}
                                    className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        promptBox.onConfirm?.(promptBox.value);
                                        setPromptBox(prev => ({ ...prev, show: false }));
                                    }}
                                    className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all text-sm font-bold shadow-lg shadow-blue-600/20"
                                >
                                    Confirm
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

const ToolbarButton = ({ onClick, active, icon: Icon, title, disabled }: { onClick: () => void, active?: boolean, icon: any, title: string, disabled?: boolean }) => (
    <button
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`p-2 rounded-lg transition-all ${
            active 
            ? 'bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30' 
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        } disabled:opacity-30 disabled:pointer-events-none`}
    >
        <Icon size={18} />
    </button>
);
