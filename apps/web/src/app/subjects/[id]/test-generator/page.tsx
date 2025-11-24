'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Sparkles, BookOpen, Clock, HelpCircle, CheckCircle2 } from 'lucide-react';
import { dub5ai } from '@/lib/dub5ai';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';

export default function TestGeneratorPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { toasts, showToast, hideToast, error: showError } = useToast();

    const [step, setStep] = useState<'input' | 'generating' | 'preview'>('input');
    const [topic, setTopic] = useState('');
    const [context, setContext] = useState('');
    const [generatedTest, setGeneratedTest] = useState<any>(null);

    const handleGenerate = async () => {
        if (!topic.trim() || !context.trim()) {
            showError('Please provide both a topic and some context text.');
            return;
        }

        setStep('generating');
        try {
            const test = await dub5ai.generatePracticeTest(context, topic);
            setGeneratedTest(test);
            setStep('preview');
        } catch (err: any) {
            console.error('Generation error:', err);
            showError('Failed to generate test. Please try again.');
            setStep('input');
        }
    };

    const handleSave = async () => {
        if (!user || !generatedTest) return;

        try {
            // 1. Create Test Record
            const { data: testData, error: testError } = await supabase
                .from('practice_tests')
                .insert([{
                    user_id: user.id,
                    subject_id: params.id,
                    title: generatedTest.title,
                    description: `Generated from topic: ${topic}`
                }])
                .select()
                .single();

            if (testError) throw testError;

            // 2. Create Questions
            const questions = generatedTest.questions.map((q: any, index: number) => ({
                test_id: testData.id,
                question_text: q.question_text,
                question_type: q.question_type,
                options: q.options || null,
                correct_answer: q.correct_answer,
                explanation: q.explanation,
                order_index: index
            }));

            const { error: qError } = await supabase
                .from('practice_test_questions')
                .insert(questions);

            if (qError) throw qError;

            showToast('Test saved successfully!', 'success');
            setTimeout(() => {
                router.push(`/subjects/${params.id}/tests/${testData.id}`);
            }, 1000);

        } catch (err: any) {
            console.error('Save error:', err);
            showError('Failed to save test.');
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto relative p-8">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Subject</span>
                    </button>

                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-3xl font-serif font-bold text-white">AI Test Generator</h1>
                        </div>
                        <p className="text-slate-400">Create custom practice tests instantly from your study materials.</p>
                    </div>

                    {step === 'input' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="glass-card p-6">
                                <label className="block text-slate-400 text-sm mb-2">What is this test about?</label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g., Photosynthesis, World War II, Calculus Limits"
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 mb-6"
                                />

                                <label className="block text-slate-400 text-sm mb-2">Paste your study material (notes, article, text)</label>
                                <textarea
                                    value={context}
                                    onChange={(e) => setContext(e.target.value)}
                                    placeholder="Paste text here..."
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white h-64 resize-none focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <button
                                onClick={handleGenerate}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium py-4 rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                            >
                                <Sparkles className="w-5 h-5" />
                                <span>Generate Practice Test</span>
                            </button>
                        </div>
                    )}

                    {step === 'generating' && (
                        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                            <div className="w-20 h-20 relative mb-8">
                                <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
                                <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-blue-400 animate-pulse" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Generating your test...</h2>
                            <p className="text-slate-400">Dub5 AI is analyzing your text and crafting questions.</p>
                        </div>
                    )}

                    {step === 'preview' && generatedTest && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="glass-card p-8 text-center">
                                <h2 className="text-2xl font-bold text-white mb-2">{generatedTest.title}</h2>
                                <p className="text-slate-400 mb-6">Generated from topic: {topic}</p>

                                <div className="flex justify-center gap-8 text-sm text-slate-400 mb-8">
                                    <div className="flex items-center gap-2">
                                        <HelpCircle className="w-4 h-4 text-blue-400" />
                                        <span>{generatedTest.questions.length} Questions</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-purple-400" />
                                        <span>~{generatedTest.questions.length * 2} Minutes</span>
                                    </div>
                                </div>

                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={() => setStep('input')}
                                        className="px-6 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        Discard & Try Again
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl transition-all shadow-lg shadow-green-500/25 flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        <span>Save & Start Test</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-slate-400 ml-2">Preview Questions</h3>
                                {generatedTest.questions.map((q: any, i: number) => (
                                    <div key={i} className="glass-card p-6 opacity-75">
                                        <div className="flex gap-4">
                                            <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm font-mono text-slate-400 flex-shrink-0">
                                                {i + 1}
                                            </span>
                                            <div>
                                                <p className="text-white font-medium mb-3">{q.question_text}</p>
                                                {q.question_type === 'multiple_choice' && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {q.options.map((opt: string, idx: number) => (
                                                            <div key={idx} className="bg-slate-900/50 px-4 py-2 rounded-lg text-sm text-slate-400">
                                                                {opt}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="mt-3 text-xs text-green-400/70">
                                                    Answer: {q.correct_answer}
                                                </div>
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
