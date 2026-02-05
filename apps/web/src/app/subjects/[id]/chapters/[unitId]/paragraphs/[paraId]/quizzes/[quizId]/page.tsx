'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, FileQuestion } from 'lucide-react';
import QuizPlayer from '@/components/quizzes/QuizPlayer';
import ErrorLogger from '@/lib/ErrorLogger';

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id as string;
  const unitId = params.unitId as string;
  const paraId = params.paraId as string;
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetchControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      try {
        fetchControllerRef.current?.abort();
        fetchControllerRef.current = new AbortController();
        const signal = fetchControllerRef.current.signal;

        const { data, error } = await (supabase.from('quizzes') as any)
          .select('*')
          .eq('id', quizId)
          .abortSignal(signal)
          .single();
        
        if (error) {
          if (error.name === 'AbortError') return;
          throw error;
        }
        if (data) setQuiz(data);
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        ErrorLogger.error('Error fetching quiz', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();

    return () => {
      fetchControllerRef.current?.abort();
    };
  }, [quizId]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <FileQuestion className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Quiz Not Found</h2>
        <p className="text-slate-400 mb-6">The quiz you are looking for does not exist or has been deleted.</p>
        <button
          onClick={() => router.push(`/subjects/${subjectId}/chapters/${unitId}/paragraphs/${paraId}/quizzes`)}
          className="glass-button px-6 py-2 rounded-xl"
        >
          Back to Quizzes
        </button>
      </div>
    );
  }

  return (
    <div className="h-full p-8 relative overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push(`/subjects/${subjectId}/chapters/${unitId}/paragraphs/${paraId}/quizzes`)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quizzes</span>
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <FileQuestion className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-white">{quiz.title}</h1>
          </div>
          <p className="text-slate-400">{quiz.description || 'Test your knowledge on this topic'}</p>
        </div>

        <div className="glass-card p-8 border border-white/5">
          <QuizPlayer 
            quiz={quiz}
            questions={quiz.questions || []}
            userId="placeholder-user-id"
            onExit={() => router.push(`/subjects/${subjectId}/chapters/${unitId}/paragraphs/${paraId}/quizzes`)}
          />
        </div>
      </div>
    </div>
  );
}
