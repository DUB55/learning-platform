'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Send, Bot, User, Sparkles,
    BookOpen, Brain, Lightbulb, HelpCircle, Loader2
} from 'lucide-react';
import { dub5ai } from '@/lib/dub5ai';
import ErrorLogger from '@/lib/ErrorLogger';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const QUICK_PROMPTS = [
    { icon: Lightbulb, label: 'Explain a concept', prompt: 'Explain this concept in simple terms: ' },
    { icon: Brain, label: 'Quiz me', prompt: 'Quiz me on this topic: ' },
    { icon: BookOpen, label: 'Summarize', prompt: 'Give me a summary of: ' },
    { icon: HelpCircle, label: 'Help me understand', prompt: 'Help me understand: ' },
];

export default function AITutorPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hi! I'm your AI Tutor powered by DUB5 AI. I can help you understand concepts, quiz you on topics, explain things in simple terms, and much more. What would you like to learn today?",
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (content: string) => {
        if (!content.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const systemPrompt = `You are a friendly and knowledgeable AI tutor. Your goal is to help students learn and understand concepts clearly.

Guidelines:
- Explain things in simple, easy-to-understand terms
- Use examples and analogies when helpful
- Be encouraging and supportive
- If asked to quiz, create thoughtful questions and provide feedback
- Format your responses with markdown for better readability
- Keep responses concise but comprehensive
- If you don't know something, admit it honestly`;

            const response = await dub5ai.streamRequest(content, {
                task: 'tutor',
                context: [
                    { role: 'system', content: systemPrompt },
                    ...messages.slice(-10).map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                ]
            });

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            ErrorLogger.error('AI Tutor error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm sorry, I encountered an error. Please try again.",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    const handleQuickPrompt = (prompt: string) => {
        setInput(prompt);
        inputRef.current?.focus();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col">
            {/* Header */}
            <div className="h-20 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white border border-transparent hover:border-white/10"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 leading-none">AI Tutor</h1>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-medium">Personalized Learning Assistant</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-4xl mx-auto space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                                    ? 'bg-blue-500'
                                    : 'bg-gradient-to-br from-purple-500 to-blue-500'
                                }`}>
                                {message.role === 'user' ? (
                                    <User className="w-4 h-4 text-white" />
                                ) : (
                                    <Bot className="w-4 h-4 text-white" />
                                )}
                            </div>
                            <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                                <div className={`rounded-2xl p-4 ${message.role === 'user'
                                        ? 'bg-blue-500 text-white rounded-tr-none'
                                        : 'bg-slate-800 text-slate-200 rounded-tl-none'
                                    }`}>
                                    <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                                        {message.content}
                                    </div>
                                </div>
                                <span className="text-xs text-slate-500 mt-1 inline-block">
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-slate-800 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                                <span className="text-slate-400 text-sm">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Quick Prompts */}
            {messages.length === 1 && (
                <div className="p-4 max-w-4xl mx-auto w-full">
                    <p className="text-sm text-slate-400 mb-3">Quick actions:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {QUICK_PROMPTS.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => handleQuickPrompt(item.prompt)}
                                className="glass-card p-3 text-left hover:bg-white/10 transition-colors group"
                            >
                                <item.icon className="w-5 h-5 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-sm text-slate-300">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-white/10">
                <div className="max-w-4xl mx-auto">
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask me anything..."
                                rows={1}
                                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 resize-none min-h-[48px] max-h-[200px]"
                                style={{ height: 'auto' }}
                            />
                        </div>
                        <button
                            onClick={() => sendMessage(input)}
                            disabled={!input.trim() || isLoading}
                            className="px-4 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 text-center mt-2">
                        Press Enter to send, Shift+Enter for new line
                    </p>
                </div>
            </div>
        </div>
    );
}
