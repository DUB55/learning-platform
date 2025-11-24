'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import AIChatSidebar from '@/components/AIChatSidebar';
import { Send, Bot, User, Sparkles, StopCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { dub5ai, AIMessage } from '@/lib/dub5ai';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    created_at: string;
}

export default function AIChatPage() {
    const { user } = useAuth();
    const { toasts, hideToast, error: showError } = useToast();

    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Load messages when chat changes
    useEffect(() => {
        if (currentChatId) {
            loadMessages(currentChatId);
        } else {
            setMessages([]);
        }
    }, [currentChatId]);

    const loadMessages = async (chatId: string) => {
        const { data } = await supabase
            .from('ai_messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });

        if (data) setMessages(data);
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
            let chatId = currentChatId;

            // Create new chat if none exists
            if (!chatId) {
                const { data: newChat, error: chatError } = await supabase
                    .from('ai_chats')
                    .insert([{
                        user_id: user.id,
                        title: userContent.slice(0, 30) + (userContent.length > 30 ? '...' : '')
                    }])
                    .select()
                    .single();

                if (chatError) throw chatError;
                chatId = newChat.id;
                setCurrentChatId(chatId);
            }

            // Save user message
            const { data: userMsg, error: msgError } = await supabase
                .from('ai_messages')
                .insert([{
                    chat_id: chatId,
                    role: 'user',
                    content: userContent
                }])
                .select()
                .single();

            if (msgError) throw msgError;

            // Optimistically update UI
            setMessages(prev => [...prev, userMsg]);

            // Create placeholder for AI response
            const tempAiMsgId = Date.now().toString();
            setMessages(prev => [...prev, {
                id: tempAiMsgId,
                role: 'assistant',
                content: '',
                created_at: new Date().toISOString()
            } as Message]);

            let fullContent = '';

            // Get AI response with streaming
            const contextMessages: AIMessage[] = messages.map(m => ({
                role: m.role,
                content: m.content
            }));
            contextMessages.push({ role: 'user', content: userContent });

            await dub5ai.chat(contextMessages, (chunk) => {
                fullContent += chunk;
                setMessages(prev => prev.map(m =>
                    m.id === tempAiMsgId
                        ? { ...m, content: fullContent }
                        : m
                ));
            });

            // Save AI message to DB
            const { data: aiMsg, error: aiError } = await supabase
                .from('ai_messages')
                .insert([{
                    chat_id: chatId,
                    role: 'assistant',
                    content: fullContent
                }])
                .select()
                .single();

            if (aiError) throw aiError;

            // Replace temp message with real one
            setMessages(prev => prev.map(m =>
                m.id === tempAiMsgId ? aiMsg : m
            ));

        } catch (err: any) {
            console.error('Chat error:', err);
            showError(err.message || 'Failed to send message');
            // Remove temp message if error
            setMessages(prev => prev.filter(m => m.content !== ''));
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex h-screen bg-[#0f172a] overflow-hidden">
            {/* Main Navigation Sidebar */}
            <Sidebar />

            {/* Chat History Sidebar */}
            <AIChatSidebar
                currentChatId={currentChatId || undefined}
                onSelectChat={setCurrentChatId}
                onNewChat={handleNewChat}
            />

            {/* Chat Area */}
            <main className="flex-1 flex flex-col relative">
                {/* Header */}
                <div className="h-16 border-b border-white/10 flex items-center px-6 bg-slate-900/50 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-white">Dub5 AI Assistant</h1>
                            <p className="text-xs text-slate-400">Powered by advanced learning models</p>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                                <Bot className="w-10 h-10 text-blue-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">How can I help you learn?</h2>
                            <p className="text-slate-400 max-w-md">
                                Ask me to explain complex topics, generate practice tests, create study plans, or summarize your notes.
                            </p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-4 max-w-3xl mx-auto ${msg.role === 'assistant' ? 'bg-white/5 p-6 rounded-2xl' : ''
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant'
                                    ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                                    : 'bg-slate-700'
                                    }`}>
                                    {msg.role === 'assistant' ? (
                                        <Bot className="w-5 h-5 text-white" />
                                    ) : (
                                        <User className="w-5 h-5 text-white" />
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <p className="text-sm font-medium text-slate-400">
                                        {msg.role === 'assistant' ? 'Dub5 AI' : 'You'}
                                    </p>
                                    <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {isTyping && (
                        <div className="flex gap-4 max-w-3xl mx-auto bg-white/5 p-6 rounded-2xl animate-pulse">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <p className="text-sm font-medium text-slate-400">Dub5 AI</p>
                                <div className="flex gap-1 items-center h-6">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 bg-slate-900/50 backdrop-blur-sm border-t border-white/10">
                    <div className="max-w-3xl mx-auto relative">
                        <form onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Message Dub5 AI..."
                                className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-4 pl-6 pr-14 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-lg"
                                disabled={isTyping}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-blue-600"
                            >
                                {isTyping ? (
                                    <StopCircle className="w-5 h-5 animate-pulse" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </form>
                        <p className="text-center text-[10px] text-slate-600 mt-3">
                            Dub5 AI can make mistakes. Consider checking important information.
                        </p>
                    </div>
                </div>

                {/* Toast Notifications */}
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => hideToast(toast.id)}
                    />
                ))}
            </main>
        </div>
    );
}
