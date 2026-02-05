'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, FileQuestion, Plus, Brain } from 'lucide-react';
import QuizBuilder from '@/components/quizzes/QuizBuilder';
import { useAuth } from '@/contexts/AuthContext';

type Quiz = {
  id: string;
  title: string;
  description: string | null;
  created_at: string | null;
  quiz_type: string | null;
};

export default function ParagraphQuizzesPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const subjectId = params.id as string;
  const unitId = params.unitId as string;
  const paraId = params.paraId as string;
  const action = searchParams.get('action');

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(action === 'new');

  useEffect(() => {
    const controller = new AbortController();

    const fetchQuizzes = async (signal: AbortSignal) => {
      setLoading(true);
      try {
        // We'll use unit_id as the field for paragraph_id since it's the closest one in the schema
        // and we'll filter by the paragraph id.
        const { data, error } = await (supabase.from('quizzes') as any)
          .select('id,title,description,created_at,quiz_type')
          .eq('unit_id', paraId) // Using unit_id to store paragraph reference for now
          .order('created_at', { ascending: false })
          .abortSignal(signal);
        
        if (error) {
          if (error.name === 'AbortError') return;
          console.error('Error fetching quizzes:', error);
          return;
        }

        setQuizzes(data || []);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('Error in fetchQuizzes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes(controller.signal);

    return () => {
      controller.abort();
    };
  }, [paraId]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full p-8 relative overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => isCreating ? setIsCreating(false) : router.push(`/subjects/${subjectId}/chapters/${unitId}/paragraphs/${paraId}/documents`)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isCreating ? 'Back to Quizzes' : 'Back to Content'}</span>
        </button>

        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <FileQuestion className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-serif font-bold text-white">
                {isCreating ? 'Create New Quiz' : 'Quizzes'}
              </h1>
            </div>
            <p className="text-slate-400">
              {isCreating ? 'Design a custom quiz for this paragraph' : 'Test your knowledge with these quizzes'}
            </p>
          </div>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="glass-button px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>New Quiz</span>
            </button>
          )}
        </div>

        {isCreating ? (
          <div className="max-w-4xl mx-auto">
            <QuizBuilder 
              unitId={paraId} 
              userId={user?.id || ''} 
              onCancel={() => setIsCreating(false)} 
            />
          </div>
        ) : quizzes.length === 0 ? (
          <div className="glass-card p-12 text-center border border-white/5">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <FileQuestion className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-white font-bold mb-2">No quizzes yet</h3>
            <p className="text-slate-500 mb-6">Create your first quiz to start testing yourself!</p>
            <button
              onClick={() => setIsCreating(true)}
              className="glass-button px-6 py-2 rounded-xl"
            >
              Create First Quiz
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                onClick={() => router.push(`/subjects/${subjectId}/chapters/${unitId}/paragraphs/${paraId}/quizzes/${quiz.id}`)}
                className="group glass-card p-5 border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 border border-orange-500/20 group-hover:scale-110 transition-transform">
                    <FileQuestion className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-white font-bold mb-1 group-hover:text-orange-400 transition-colors line-clamp-1">{quiz.title}</h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{quiz.description || 'No description'}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 uppercase tracking-wider font-medium text-[10px]">
                    {quiz.quiz_type || 'Custom'}
                  </span>
                  <span>•</span>
                  <span>{new Date(quiz.created_at || '').toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
