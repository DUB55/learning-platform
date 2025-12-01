'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Clock, BookOpen, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { xpService } from '@/lib/xpService';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';

interface Question {
    id: string;
    question_text: string;
    question_type: 'multiple_choice' | 'true_false' | 'short_answer';
    options: string[] | null;
    correct_answer: string;
    explanation: string | null;
    order_index: number;
}

interface Test {
    id: string;
    title: string;
    description: string;
}

export default function TakeTestPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { toasts, showToast, hideToast } = useToast();

    const [test, setTest] = useState<Test | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTest();
    }, [params.testId]);

    const fetchTest = async () => {
        try {
            // Fetch Test Details
            const { data: testData, error: testError } = await supabase
                .from('practice_tests')
                .select('*')
                .eq('id', params.testId)
                .single();

            if (testError) throw testError;
            setTest(testData);

            // Fetch Questions
            const { data: qData, error: qError } = await supabase
                .from('practice_test_questions')
                .select('*')
                .eq('test_id', params.testId)
                .order('order_index');

            if (qError) throw qError;
            setQuestions(qData || []);
        } catch (error) {
            console.error('Error fetching test:', error);
            showToast('Failed to load test', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionId: string, value: string) => {
        if (submitted) return;
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            if (!confirm('You haven\'t answered all questions. Are you sure you want to submit?')) {
                return;
            }
        }

        let correctCount = 0;
        questions.forEach(q => {
            const userAnswer = answers[q.id]?.trim().toLowerCase();
            const correct = q.correct_answer.trim().toLowerCase();
            if (userAnswer === correct) {
                correctCount++;
            }
        });

        const finalScore = Math.round((correctCount / questions.length) * 100);
        setScore(finalScore);
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Award XP and check achievements
        if (user) {
            try {
                // Update daily streak
                await xpService.updateStreak(user.id);

                // Award XP based on score
                const baseXP = 20;
                const bonusXP = Math.round((finalScore / 100) * 30);
                const totalXP = baseXP + bonusXP;

                await xpService.awardXP(user.id, totalXP, 'test_completed', params.testId as string);

                // Check for first test achievement
                await xpService.unlockAchievement(user.id, 'first_test');

                // Perfect score achievement
                if (finalScore === 100) {
                    await xpService.unlockAchievement(user.id, 'perfect_score');
                }

                showToast(`+${totalXP} XP earned!`, 'success');
            } catch (error) {
                console.error('Error awarding XP:', error);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!test) return null;

    return (
        <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto relative p-8">
                <div className="max-w-3xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </button>

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-serif font-bold text-white mb-2">{test.title}</h1>
                        <p className="text-slate-400">{test.description}</p>
                    </div>

                    {/* Score Card */}
                    {submitted && (
                        <div className="glass-card p-8 mb-8 text-center animate-fade-in border-2 border-blue-500/20">
                            <h2 className="text-xl text-slate-300 mb-2">Your Score</h2>
                            <div className="text-5xl font-bold text-white mb-4">
                                <span className={score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400'}>
                                    {score}%
                                </span>
                            </div>
                            <p className="text-slate-400">
                                You got {questions.filter(q => answers[q.id]?.toLowerCase() === q.correct_answer.toLowerCase()).length} out of {questions.length} correct
                            </p>
                        </div>
                    )}

                    {/* Questions */}
                    <div className="space-y-6 mb-8">
                        {questions.map((q, index) => {
                            const isCorrect = submitted && answers[q.id]?.toLowerCase() === q.correct_answer.toLowerCase();
                            const isWrong = submitted && !isCorrect;

                            return (
                                <div
                                    key={q.id}
                                    className={`glass-card p-6 transition-all ${submitted
                                        ? isCorrect
                                            ? 'border-green-500/30 bg-green-500/5'
                                            : 'border-red-500/30 bg-red-500/5'
                                        : ''
                                        }`}
                                >
                                    <div className="flex gap-4">
                                        <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm font-mono text-slate-400 flex-shrink-0">
                                            {index + 1}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-white font-medium mb-4 text-lg">{q.question_text}</p>

                                            {/* Options / Input */}
                                            <div className="space-y-3">
                                                {q.question_type === 'multiple_choice' && q.options?.map((opt, idx) => (
                                                    <label
                                                        key={idx}
                                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${answers[q.id] === opt
                                                            ? 'bg-blue-600/20 border border-blue-500/50'
                                                            : 'bg-slate-900/50 hover:bg-slate-900/80 border border-transparent'
                                                            }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={q.id}
                                                            value={opt}
                                                            checked={answers[q.id] === opt}
                                                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                            disabled={submitted}
                                                            className="w-4 h-4 text-blue-500"
                                                        />
                                                        <span className="text-slate-300">{opt}</span>
                                                    </label>
                                                ))}

                                                {(q.question_type === 'short_answer' || q.question_type === 'true_false') && (
                                                    <input
                                                        type="text"
                                                        value={answers[q.id] || ''}
                                                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                        disabled={submitted}
                                                        placeholder="Type your answer..."
                                                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                    />
                                                )}
                                            </div>

                                            {/* Explanation */}
                                            {submitted && (
                                                <div className="mt-6 pt-4 border-t border-white/5 animate-fade-in">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {isCorrect ? (
                                                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                                                        ) : (
                                                            <XCircle className="w-5 h-5 text-red-400" />
                                                        )}
                                                        <span className={`font-medium ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                                            {isCorrect ? 'Correct!' : `Incorrect. The answer is: ${q.correct_answer}`}
                                                        </span>
                                                    </div>
                                                    {q.explanation && (
                                                        <p className="text-slate-400 text-sm bg-white/5 p-3 rounded-lg">
                                                            <span className="font-medium text-slate-300">Explanation: </span>
                                                            {q.explanation}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {
                        !submitted && (
                            <button
                                onClick={handleSubmit}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium py-4 rounded-xl transition-all shadow-lg shadow-blue-500/25"
                            >
                                Submit Test
                            </button>
                        )
                    }
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
