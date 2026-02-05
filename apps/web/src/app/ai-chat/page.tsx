'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import AIChatSidebar from '@/components/AIChatSidebar';
import { Send, Bot, User, Sparkles, StopCircle, GraduationCap, Zap, FileText, Plus, X, Search as SearchIcon, Loader2, Mic, MicOff, CheckSquare, Brain, Clock, Lightbulb, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { dub5ai, AIMessage } from '@/lib/dub5ai';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/ui/Toast';
import { prepareContextWithSummary } from '@/lib/aiChatService';
import ErrorLogger from '@/lib/ErrorLogger';
import { useUISettings } from '@/contexts/UISettingsContext';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    created_at: string;
}

function AIChatContent() {
    const { user } = useAuth();
    const { settings } = useUISettings();
    const { toasts, hideToast, error: showError } = useToast();
    const searchParams = useSearchParams();

    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [aiTone, setAiTone] = useState<'professional' | 'simple'>('professional');
    const [selectedDocs, setSelectedDocs] = useState<{ id: string; title: string; content: string }[]>([]);
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [availableDocs, setAvailableDocs] = useState<{ id: string; title: string; content: string }[]>([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const loadDocsControllerRef = useRef<AbortController | null>(null);
    const loadMessagesControllerRef = useRef<AbortController | null>(null);
    const sendMessageControllerRef = useRef<AbortController | null>(null);

    // Handle URL action parameters
    useEffect(() => {
        const action = searchParams.get('action');
        if (action) {
            let prompt = "";
            switch (action) {
                case 'quiz':
                    prompt = "Generate a practice quiz based on my notes about...";
                    break;
                case 'recall':
                    prompt = "Give me active recall cues for the topic...";
                    break;
                case 'plan':
                    prompt = "Create a personalized study plan for...";
                    break;
                case 'synthesize':
                    prompt = "Summarize my selected documents and find connections.";
                    break;
            }
            if (prompt) {
                setInput(prompt);
            }
        }
    }, [searchParams]);

    // Fetch documents when modal opens
    useEffect(() => {
        if (isDocModalOpen && user) {
            const controller = new AbortController();
            loadDocsControllerRef.current = controller;
            loadAvailableDocs(controller.signal);
            return () => {
                controller.abort();
                loadDocsControllerRef.current = null;
            };
        }
    }, [isDocModalOpen, user]);

    useEffect(() => {
        return () => {
            loadMessagesControllerRef.current?.abort();
            sendMessageControllerRef.current?.abort();
        };
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            
            // Map settings.language to speech recognition codes
            const langMap: Record<string, string> = {
                'en': 'en-US',
                'nl': 'nl-NL',
                'de': 'de-DE',
                'fr': 'fr-FR',
                'es': 'es-ES'
            };
            recognitionRef.current.lang = langMap[settings.language] || 'nl-NL'; 

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(prev => prev ? `${prev} ${transcript}` : transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                ErrorLogger.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            try {
                recognitionRef.current?.start();
                setIsListening(true);
            } catch (err) {
                ErrorLogger.error('Failed to start speech recognition', err);
            }
        }
    };

    const loadAvailableDocs = async (signal?: AbortSignal) => {
        setIsLoadingDocs(true);
        try {
            const { data, error } = await (supabase.from('smart_notes') as any)
                .select('id, title, content')
                .eq('user_id', user?.id)
                .order('updated_at', { ascending: false })
                .abortSignal(signal);

            if (error) {
                if (error.name === 'AbortError') return;
                throw error;
            }
            setAvailableDocs(data || []);
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            ErrorLogger.error('Failed to load documents', err);
        } finally {
            setIsLoadingDocs(false);
        }
    };

    const toggleDocSelection = (doc: { id: string; title: string; content: string }) => {
        setSelectedDocs(prev => {
            const exists = prev.find(d => d.id === doc.id);
            if (exists) {
                return prev.filter(d => d.id !== doc.id);
            } else {
                return [...prev, doc];
            }
        });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    useEffect(() => {
        if (currentChatId) {
            const controller = new AbortController();
            loadMessagesControllerRef.current = controller;
            loadMessages(currentChatId, controller.signal);
            return () => {
                controller.abort();
                loadMessagesControllerRef.current = null;
            };
        } else {
            setMessages([]);
        }
    }, [currentChatId]);

    const loadMessages = async (chatId: string, signal?: AbortSignal) => {
        try {
            const { data, error } = await (supabase.from('ai_messages') as any)
                .select('*')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true })
                .abortSignal(signal);

            if (error) {
                if (error.name === 'AbortError') return;
                console.error('Error fetching messages:', error);
                return;
            }

            if (data) setMessages(data);
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            console.error('Error in loadMessages:', err);
        }
    };

    const handleNewChat = () => {
        setCurrentChatId(null);
        setMessages([]);
        setInput('');
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || !user || isTyping) return;

        const userContent = input.trim();
        setInput('');
        setIsTyping(true);

        try {
            sendMessageControllerRef.current?.abort();
            sendMessageControllerRef.current = new AbortController();
            const signal = sendMessageControllerRef.current.signal;

            let chatId = currentChatId;

            if (!chatId) {
                const { data: newChat, error: chatError } = await (supabase.from('ai_chats') as any)
                    .insert([{
                        user_id: user.id,
                        title: userContent.slice(0, 30) + (userContent.length > 30 ? '...' : '')
                    }])
                    .select()
                    .abortSignal(signal)
                    .single();

                if (chatError) {
                    if (chatError.name === 'AbortError') return;
                    throw chatError;
                }
                chatId = newChat.id;
                setCurrentChatId(chatId);
            }

            const { data: userMsg, error: msgError } = await (supabase.from('ai_messages') as any)
                .insert([{
                    chat_id: chatId,
                    role: 'user',
                    content: userContent
                }])
                .select()
                .abortSignal(signal)
                .single();

            if (msgError) {
                if (msgError.name === 'AbortError') return;
                throw msgError;
            }

            setMessages(prev => [...prev, userMsg]);

            const tempAiMsgId = Date.now().toString();
            setMessages(prev => [...prev, {
                id: tempAiMsgId,
                role: 'assistant',
                content: '',
                created_at: new Date().toISOString()
            } as Message]);

            let fullContent = '';

            let contextMessages: AIMessage[];
            if (chatId && messages.length > 10) {
                const messagesWithSummary = await prepareContextWithSummary(chatId, messages);
                contextMessages = messagesWithSummary.map(m => ({
                    role: m.role,
                    content: m.content
                }));
            } else {
                contextMessages = messages.map(m => ({
                    role: m.role,
                    content: m.content
                }));
            }

            const toneInstruction = aiTone === 'simple'
                ? "You are a 'Simple Explainer'. Explain things in very simple terms, use analogies, and avoid jargon. Keep it friendly and easy to understand for a beginner."
                : "You are a 'Professional Tutor'. Provide detailed, accurate, and academic explanations. Use proper terminology and structure your responses formally.";

            const languageMap: Record<string, string> = {
                'en': 'English',
                'nl': 'Dutch',
                'de': 'German',
                'fr': 'French',
                'es': 'Spanish'
            };
            const languageInstruction = `Please respond in ${languageMap[settings.language] || 'Dutch'}.`;

            contextMessages.unshift({ role: 'system', content: `${toneInstruction}\n\n${languageInstruction}` });

            if (selectedDocs.length > 0) {
                const stripHtml = (html: string) => {
                    return html.replace(/<[^>]*>?/gm, '');
                };

                const docContext = selectedDocs.map(doc => {
                    const cleanContent = stripHtml(doc.content);
                    return `DOCUMENT: ${doc.title}\nCONTENT: ${cleanContent}`;
                }).join('\n\n---\n\n');

                contextMessages.unshift({
                    role: 'system',
                    content: `You are in "Multi-Document Synthesis Mode". You have access to the following documents from the user's library. 
                    
Your task is to:
1. Synthesize information across all provided documents.
2. Identify connections, contradictions, or themes between them.
3. Answer user questions primarily using these documents.
4. If a document is referenced, mention its title.

DOCUMENTS:
${docContext}`
                });
            }

            contextMessages.push({ role: 'user', content: userContent });

            await dub5ai.chat(contextMessages, (chunk) => {
                fullContent += chunk;
                setMessages(prev => prev.map(m =>
                    m.id === tempAiMsgId
                        ? { ...m, content: fullContent }
                        : m
                ));
            });

            const { data: aiMsg, error: aiError } = await (supabase.from('ai_messages') as any)
                .insert([{
                    chat_id: chatId,
                    role: 'assistant',
                    content: fullContent
                }])
                .select()
                .single();

            if (aiError) throw aiError;

            setMessages(prev => prev.map(m =>
                m.id === tempAiMsgId ? aiMsg : m
            ));

        } catch (err: any) {
            ErrorLogger.error('Chat error', err);
            showError(err.message || 'Failed to send message');
            setMessages(prev => prev.filter(m => m.content !== ''));
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <AIChatSidebar
                currentChatId={currentChatId || undefined}
                onSelectChat={setCurrentChatId}
                onNewChat={handleNewChat}
            />

            <main className="flex-1 flex flex-col h-full relative bg-gradient-to-b from-slate-900 to-[#0f172a]">
                <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/80 backdrop-blur-md z-10 sticky top-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 leading-none">AI DUB5 Assistant</h1>
                                {selectedDocs.length > 0 && (
                                    <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-full border border-blue-500/30 font-bold uppercase tracking-wider animate-pulse">
                                        Synthesis Mode
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-medium">Powered by advanced learning models</p>
                        </div>
                    </div>

                    <div className="flex items-center bg-slate-800/50 p-1 rounded-xl border border-white/5">
                        <button
                            onClick={() => setAiTone('professional')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${aiTone === 'professional'
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            <GraduationCap className="w-3.5 h-3.5" />
                            <span>Professional</span>
                        </button>
                        <button
                            onClick={() => setAiTone('simple')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${aiTone === 'simple'
                                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Simple</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/5 flex items-center justify-center mb-6 shadow-xl">
                                <Bot className="w-12 h-12 text-blue-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">How can I help you learn?</h2>
                            <p className="text-slate-400 max-w-md leading-relaxed mb-8">
                                Ask me to explain complex topics, generate practice tests, create study plans, or summarize your notes.
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
                                <button 
                                    onClick={() => setInput("Generate a practice quiz based on my notes about...")}
                                    className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-left group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                        <CheckSquare className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">Generate Quiz</div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mt-0.5">Test your knowledge</div>
                                    </div>
                                </button>
                                
                                <button 
                                    onClick={() => setInput("Create a personalized study plan for...")}
                                    className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-left group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">Study Plan</div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mt-0.5">Stay organized</div>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setInput("Explain this concept in simple terms: ")}
                                    className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-left group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                                        <Lightbulb className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">Explain Concept</div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mt-0.5">Simplify learning</div>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setInput("Give me a summary of: ")}
                                    className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-left group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">Summarize</div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mt-0.5">Get the gist</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    ) : (
                        messages.map((message, index) => (
                            <div
                                key={message.id || index}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                            >
                                <div className={`flex gap-4 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg ${message.role === 'user'
                                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                                        : 'bg-slate-800 text-blue-400 border border-white/5'
                                        }`}>
                                        {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                    </div>
                                    <div className={`space-y-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                                        <div className={`inline-block p-4 rounded-2xl shadow-xl ${message.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-slate-800/80 backdrop-blur-sm text-slate-200 border border-white/5 rounded-tl-none'
                                            }`}>
                                            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900/50 prose-pre:border prose-pre:border-white/5">
                                                {message.content || (
                                                    <div className="flex gap-1 items-center py-2">
                                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-medium uppercase tracking-widest px-1">
                                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 md:p-6 bg-slate-900/50 backdrop-blur-xl border-t border-white/5">
                    <div className="max-w-4xl mx-auto space-y-4">
                        {/* Quick Tools & Selected Docs */}
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={() => setIsDocModalOpen(true)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedDocs.length > 0
                                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                    : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <FileText className="w-4 h-4" />
                                <span>{selectedDocs.length > 0 ? `${selectedDocs.length} Docs Selected` : 'Reference Notes'}</span>
                                {selectedDocs.length > 0 && <X className="w-3 h-3 ml-1 hover:text-white" onClick={(e) => { e.stopPropagation(); setSelectedDocs([]); }} />}
                            </button>

                            <div className="h-4 w-px bg-white/10 mx-1" />

                            <button
                                onClick={() => setInput("Summarize my selected documents and find connections.")}
                                className="px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 text-xs font-bold hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                            >
                                <Brain className="w-3.5 h-3.5" />
                                <span>Synthesize</span>
                            </button>
                        </div>

                        <form onSubmit={handleSendMessage} className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            <div className="relative flex items-end gap-3 p-2 bg-slate-800/80 border border-white/10 rounded-2xl focus-within:border-blue-500/50 transition-all shadow-2xl">
                                <button
                                    type="button"
                                    onClick={toggleListening}
                                    className={`p-3 rounded-xl transition-all ${isListening
                                        ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                </button>

                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="Ask anything..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 py-3 resize-none max-h-32 min-h-[44px]"
                                    rows={1}
                                />

                                <button
                                    type="submit"
                                    disabled={!input.trim() || isTyping}
                                    className={`p-3 rounded-xl transition-all ${input.trim() && !isTyping
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95'
                                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                        }`}
                                >
                                    {isTyping ? <StopCircle className="w-5 h-5 animate-pulse" /> : <Send className="w-5 h-5" />}
                                </button>
                            </div>
                        </form>
                        <p className="text-[10px] text-center text-slate-500 font-medium uppercase tracking-widest">
                            AI can make mistakes. Check important information.
                        </p>
                    </div>
                </div>

                {/* Document Selection Modal */}
                {isDocModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsDocModalOpen(false)} />
                        <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-800/50">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Reference Notes</h3>
                                    <p className="text-xs text-slate-400 mt-1">Select documents for the AI to analyze</p>
                                </div>
                                <button onClick={() => setIsDocModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="relative mb-6">
                                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Search your notes..."
                                        className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:border-blue-500/50 focus:ring-0 transition-all"
                                    />
                                </div>

                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {isLoadingDocs ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                                            <Loader2 className="w-8 h-8 animate-spin mb-4" />
                                            <span className="text-sm font-medium">Loading your notes...</span>
                                        </div>
                                    ) : availableDocs.length === 0 ? (
                                        <div className="py-12 text-center text-slate-500">
                                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                            <p className="text-sm font-medium">No notes found</p>
                                        </div>
                                    ) : (
                                        availableDocs.map(doc => (
                                            <button
                                                key={doc.id}
                                                onClick={() => toggleDocSelection(doc)}
                                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${selectedDocs.find(d => d.id === doc.id)
                                                    ? 'bg-blue-500/10 border-blue-500/30'
                                                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedDocs.find(d => d.id === doc.id) ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="text-sm font-bold text-white">{doc.title}</div>
                                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mt-0.5">Updated recently</div>
                                                    </div>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedDocs.find(d => d.id === doc.id) ? 'bg-blue-500 border-blue-500' : 'border-white/10'}`}>
                                                    {selectedDocs.find(d => d.id === doc.id) && <Plus className="w-4 h-4 text-white rotate-45" />}
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="p-6 bg-slate-800/50 border-t border-white/5 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400">{selectedDocs.length} documents selected</span>
                                <button
                                    onClick={() => setIsDocModalOpen(false)}
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all"
                                >
                                    Confirm Selection
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <Toast toasts={toasts} onHide={hideToast} />
        </div>
    );
}

export default function AIChatPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0f172a]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
            <AIChatContent />
        </Suspense>
    );
}
