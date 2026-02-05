'use client';

import React from 'react';
import Link from 'next/link';
import { 
    Sparkles, 
    Zap, 
    FileText, 
    Presentation, 
    Network, 
    StickyNote, 
    Video, 
    PenTool, 
    Mic, 
    Headphones,
    Brain,
    Bot,
    ArrowRight
} from 'lucide-react';

const aiTools = [
    {
        name: 'DUB5 AI Chat',
        description: 'Your personal AI study assistant. Ask questions, clarify concepts, and get instant explanations in any language.',
        href: '/ai-chat',
        icon: Bot,
        color: 'from-purple-600 to-indigo-600',
        borderColor: 'hover:border-purple-500/50'
    },
    {
        name: 'AI Study Modes',
        description: 'Personalized study sessions powered by AI. Choose from Flashcards, Practice Tests, and more.',
        href: '/study-modes',
        icon: Zap,
        color: 'from-yellow-600 to-orange-600',
        borderColor: 'hover:border-yellow-500/50'
    },
    {
        name: 'AI Study Plans',
        description: 'Automatically generate structured study schedules based on your goals, deadlines, and current knowledge.',
        href: '/study-plans',
        icon: FileText,
        color: 'from-blue-600 to-cyan-600',
        borderColor: 'hover:border-blue-500/50'
    },
    {
        name: 'AI PPT Generator',
        description: 'Transform your notes or any topic into professional presentation slides instantly.',
        href: '/ai-ppt',
        icon: Presentation,
        color: 'from-orange-600 to-red-600',
        borderColor: 'hover:border-orange-500/50'
    },
    {
        name: 'AI Mind Maps',
        description: 'Visualize complex topics with AI-generated mind maps. Perfect for understanding relationships between concepts.',
        href: '/ai-mindmap',
        icon: Network,
        color: 'from-purple-600 to-pink-600',
        borderColor: 'hover:border-purple-500/50'
    },
    {
        name: 'AI Smart Notes',
        description: 'Summarize long texts, extract key points, and organize your thoughts with intelligent note-taking.',
        href: '/smart-notes',
        icon: StickyNote,
        color: 'from-teal-600 to-emerald-600',
        borderColor: 'hover:border-teal-500/50'
    },
    {
        name: 'AI Explainer',
        description: 'Get simplified explanations for difficult topics. Like "Explain Like I\'m Five" but for everything.',
        href: '/ai-explainer',
        icon: Video,
        color: 'from-blue-600 to-indigo-600',
        borderColor: 'hover:border-blue-500/50'
    },
    {
        name: 'AI Writing',
        description: 'Improve your essays, reports, and assignments with AI-powered writing assistance and feedback.',
        href: '/ai-writing',
        icon: PenTool,
        color: 'from-amber-600 to-orange-600',
        borderColor: 'hover:border-amber-500/50'
    },
    {
        name: 'AI Lecture Recorder',
        description: 'Record lectures and let AI transcribe and summarize them into organized study notes.',
        href: '/ai-lecture-recorder',
        icon: Mic,
        color: 'from-red-600 to-rose-600',
        borderColor: 'hover:border-red-500/50'
    },
    {
        name: 'AI Audio Recap',
        description: 'Convert your study material into engaging audio summaries you can listen to anywhere.',
        href: '/ai-audio-recap',
        icon: Headphones,
        color: 'from-green-600 to-emerald-600',
        borderColor: 'hover:border-green-500/50'
    }
];

export default function AIToolsPage() {
    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 p-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                            <Sparkles className="w-6 h-6 text-purple-400" />
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight">AI Tools</h1>
                    </div>
                    <p className="text-slate-400 text-lg max-w-2xl">
                        Unlock the full potential of your learning with our suite of advanced AI tools. 
                        Designed to help you study smarter, not harder.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {aiTools.map((tool) => (
                        <Link key={tool.name} href={tool.href}>
                            <div className={`glass-card p-6 h-full transition-all duration-300 cursor-pointer group flex flex-col border border-white/5 ${tool.borderColor} hover:bg-white/[0.02]`}>
                                <div className={`w-14 h-14 bg-gradient-to-br ${tool.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                                    <tool.icon className="w-7 h-7 text-white" />
                                </div>
                                
                                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">
                                    {tool.name}
                                </h3>
                                
                                <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-1">
                                    {tool.description}
                                </p>
                                
                                <div className="flex items-center text-xs font-bold uppercase tracking-wider text-purple-400 group-hover:text-purple-300 transition-colors">
                                    <span>Launch Tool</span>
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <footer className="mt-16 pt-8 border-t border-white/5">
                    <div className="glass-card p-8 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">Need help getting started?</h2>
                                <p className="text-slate-400">Our AI assistant is always ready to help you navigate these tools.</p>
                            </div>
                            <Link href="/ai-chat">
                                <button className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black hover:bg-slate-200 transition-all shadow-xl shadow-white/5 whitespace-nowrap">
                                    Chat with AI
                                </button>
                            </Link>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
