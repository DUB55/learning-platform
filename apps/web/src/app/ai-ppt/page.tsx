'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Sparkles, FileText, Download, Trash2, Edit3 } from 'lucide-react';
import { dub5ai } from '@/lib/dub5ai';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';

type SavedPowerpointInsert = {
  user_id: string;
  title: string;
  slides: any; // or a more specific type if you know it, e.g. string or object
};


export default function AIPPTGeneratorPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toasts, showToast, hideToast, error: showError } = useToast();

    const [step, setStep] = useState<'input' | 'generating' | 'preview'>('input');
    const [topic, setTopic] = useState('');
    const [context, setContext] = useState('');
    const [generatedPPT, setGeneratedPPT] = useState<any>(null);
    const [editingSlide, setEditingSlide] = useState<number | null>(null);
    const [savedPowerpoints, setSavedPowerpoints] = useState<any[]>([]);
    const [showSavedList, setShowSavedList] = useState(false);

    const handleGenerate = async () => {
        if (!topic.trim()) {
            showError('Please provide a topic for your presentation.');
            return;
        }

        setStep('generating');
        try {
            const ppt = await dub5ai.generatePresentation(topic, context);
            setGeneratedPPT(ppt);
            setStep('preview');
        } catch (err: any) {
            console.error('Generation error:', err);
            showError('Failed to generate presentation. Please try again.');
            setStep('input');
        }
    };

    const handleSavePPT = async () => {
        if (!generatedPPT || !user) return;

        try {
            // Type assertion to bypass Vercel TS strictness
            const { error } = await (supabase
      .from('saved_powerpoints') as any)
      .insert([
        {
          user_id: user.id as string,
          title: String(generatedPPT.title),
          slides: generatedPPT.slides as any,
        },
      ]);

            if (error) throw error;

            showToast('PowerPoint saved successfully!', 'success');
            fetchSavedPowerpoints();
        } catch (err: any) {
            console.error('Save error:', err);
            showError('Failed to save PowerPoint.');
        }
    };


    const handleDownload = async () => {
        if (!generatedPPT) return;

        // Save to database before downloading
        if (user) {
            await handleSavePPT();
        }

        try {
            // Dynamic import to avoid webpack issues with Node.js modules
            const PptxGenJS = (await import('pptxgenjs')).default;
            const pptx = new PptxGenJS();

            generatedPPT.slides.forEach((slide: any) => {
                const pptSlide = pptx.addSlide();

                if (slide.type === 'title') {
                    // Title slide
                    if (slide.title) {
                        pptSlide.addText(slide.title, {
                            x: 0.5,
                            y: 2.0,
                            w: '90%',
                            h: 1.5,
                            fontSize: 44,
                            bold: true,
                            color: '003366',
                            align: 'center'
                        });
                    }
                    if (slide.subtitle) {
                        pptSlide.addText(slide.subtitle, {
                            x: 0.5,
                            y: 3.8,
                            w: '90%',
                            fontSize: 24,
                            color: '666666',
                            align: 'center'
                        });
                    }
                } else if (slide.type === 'section') {
                    // Section divider
                    pptSlide.background = { color: '003366' };
                    if (slide.title) {
                        pptSlide.addText(slide.title, {
                            x: 0.5,
                            y: 2.5,
                            w: '90%',
                            fontSize: 40,
                            bold: true,
                            color: 'FFFFFF',
                            align: 'center'
                        });
                    }
                } else {
                    // Content slide
                    if (slide.title) {
                        pptSlide.addText(slide.title, {
                            x: 0.5,
                            y: 0.5,
                            w: '90%',
                            fontSize: 32,
                            bold: true,
                            color: '003366'
                        });
                    }
                    if (slide.subtitle) {
                        pptSlide.addText(slide.subtitle, {
                            x: 0.5,
                            y: 1.2,
                            w: '90%',
                            fontSize: 18,
                            italic: true,
                            color: '666666'
                        });
                    }
                    if (slide.content && Array.isArray(slide.content)) {
                        pptSlide.addText(
                            slide.content.map((bullet: string) => ({ text: bullet, options: { bullet: true } })),
                            {
                                x: 0.5,
                                y: slide.subtitle ? 2.0 : 1.5,
                                w: '90%',
                                fontSize: 18,
                                color: '000000'
                            }
                        );
                    }
                }
            });

            pptx.writeFile({ fileName: `${generatedPPT.title.replace(/[^a-z0-9]/gi, '_')}.pptx` });
            showToast('Presentation downloaded successfully!', 'success');
        } catch (err: any) {
            console.error('Download error:', err);
            showError('Failed to download presentation. Make sure pptxgenjs is installed.');
        }
    };

    const handleEditSlide = (index: number) => {
        setEditingSlide(index);
    };

    const handleUpdateSlide = (index: number, field: string, value: any) => {
        const updatedSlides = [...generatedPPT.slides];
        updatedSlides[index][field] = value;
        setGeneratedPPT({ ...generatedPPT, slides: updatedSlides });
    };

    const handleDeleteSlide = (index: number) => {
        if (!confirm('Delete this slide?')) return;
        const updatedSlides = generatedPPT.slides.filter((_: any, i: number) => i !== index);
        setGeneratedPPT({ ...generatedPPT, slides: updatedSlides });
        showToast('Slide deleted', 'success');
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto relative p-8">
                <div className="max-w-5xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </button>

                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-3xl font-serif font-bold text-white">AI PowerPoint Generator</h1>
                        </div>
                        <p className="text-slate-400">Create professional presentations instantly with AI.</p>
                    </div>

                    {step === 'input' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="glass-card p-6">
                                <label className="block text-slate-400 text-sm mb-2">What is your presentation about?</label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g., Climate Change, Marketing Strategy, Machine Learning Basics"
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 mb-6"
                                />

                                <label className="block text-slate-400 text-sm mb-2">
                                    Additional context (optional)
                                </label>
                                <textarea
                                    value={context}
                                    onChange={(e) => setContext(e.target.value)}
                                    placeholder="Any specific points you want to cover, audience details, or key messages..."
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white h-32 resize-none focus:outline-none focus:border-orange-500"
                                />
                            </div>

                            <button
                                onClick={handleGenerate}
                                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-medium py-4 rounded-xl transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
                            >
                                <Sparkles className="w-5 h-5" />
                                <span>Generate Presentation</span>
                            </button>
                        </div>
                    )}

                    {step === 'generating' && (
                        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                            <div className="w-20 h-20 relative mb-8">
                                <div className="absolute inset-0 rounded-full border-4 border-orange-500/20"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 animate-spin"></div>
                                <FileText className="absolute inset-0 m-auto w-8 h-8 text-orange-400 animate-pulse" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Creating your slides...</h2>
                            <p className="text-slate-400">Dub5 AI is designing a professional presentation for you.</p>
                        </div>
                    )}

                    {step === 'preview' && generatedPPT && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="glass-card p-8 text-center">
                                <h2 className="text-2xl font-bold text-white mb-2">{generatedPPT.title}</h2>
                                <p className="text-slate-400 mb-6">{generatedPPT.slides.length} slides</p>

                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={() => setStep('input')}
                                        className="px-6 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        Discard & Try Again
                                    </button>
                                    <button
                                        onClick={handleDownload}
                                        className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl transition-all shadow-lg shadow-green-500/25 flex items-center gap-2"
                                    >
                                        <Download className="w-5 h-5" />
                                        <span>Download PowerPoint</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-slate-400 ml-2">Slide Preview</h3>

                                {generatedPPT.slides.map((slide: any, i: number) => (
                                    <div key={i} className="glass-card p-6 group relative">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold flex-shrink-0">
                                                {i + 1}
                                            </div>

                                            <div className="flex-1">
                                                {editingSlide === i ? (
                                                    <div className="space-y-3">
                                                        <input
                                                            type="text"
                                                            value={slide.title}
                                                            onChange={(e) => handleUpdateSlide(i, 'title', e.target.value)}
                                                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-lg font-medium focus:outline-none focus:border-orange-500"
                                                        />
                                                        {slide.subtitle !== undefined && (
                                                            <input
                                                                type="text"
                                                                value={slide.subtitle}
                                                                onChange={(e) => handleUpdateSlide(i, 'subtitle', e.target.value)}
                                                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                                                            />
                                                        )}
                                                        <button
                                                            onClick={() => setEditingSlide(null)}
                                                            className="text-green-400 hover:text-green-300 text-sm font-medium"
                                                        >
                                                            Done Editing
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <h3 className="text-lg font-medium text-white mb-1">{slide.title}</h3>
                                                        {slide.subtitle && (
                                                            <p className="text-sm text-slate-400 italic mb-3">{slide.subtitle}</p>
                                                        )}
                                                        {slide.content && Array.isArray(slide.content) && (
                                                            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                                                                {slide.content.map((bullet: string, idx: number) => (
                                                                    <li key={idx}>{bullet}</li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </>
                                                )}

                                                <div className="flex items-center gap-2 mt-3">
                                                    <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-400">
                                                        {slide.type === 'title' ? 'Title Slide' : slide.type === 'section' ? 'Section' : 'Content'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditSlide(i)}
                                                    className="p-2 text-slate-500 hover:text-blue-400 transition-colors"
                                                    title="Edit slide"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSlide(i)}
                                                    className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                                                    title="Delete slide"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

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
