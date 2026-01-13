'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Loader2 } from 'lucide-react';
import QuizPlayer from '@/components/quizzes/QuizPlayer';

export default function QuizPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();

    const [quiz, setQuiz] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchQuiz = async () => {
            if (!params?.quizId) return;

            try {
                // Fetch Quiz Details
                const { data: quizData, error: quizError } = await (supabase
                    .from('quizzes') as any)
                    .select('*')
                    .eq('id', params.quizId)
                    .single();

                if (quizError) throw quizError;
                setQuiz(quizData);

                // Fetch Questions
                const { data: questionsData, error: questionsError } = await (supabase
                    .from('quiz_questions') as any)
                    .select('*')
                    .eq('quiz_id', params.quizId);

                if (questionsError) throw questionsError;
                setQuestions(questionsData || []);

            } catch (err: any) {
                console.error('Error fetching quiz:', err);
                setError('Failed to load quiz. ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchQuiz();
    }, [params?.quizId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <button onClick={() => router.back()} className="text-slate-400 hover:text-white">Go Back</button>
            </div>
        );
    }

    if (!quiz) return null;

    return (
        <div className="p-4 md:p-8 pb-32 max-w-5xl mx-auto animate-fade-in">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Exit Quiz</span>
            </button>

            <QuizPlayer
                quiz={quiz}
                questions={questions}
                userId={user?.id || 'anon'}
                onExit={() => router.back()}
            />
        </div>
    );
}
