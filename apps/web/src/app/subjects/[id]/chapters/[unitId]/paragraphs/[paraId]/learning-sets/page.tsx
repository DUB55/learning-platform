'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Brain, Plus } from 'lucide-react';
import LearningSetBuilder from '@/components/learning-sets/LearningSetBuilder';
import { useAuth } from '@/contexts/AuthContext';

type LearningSet = {
  id: string;
  title: string;
  description: string | null;
  created_at: string | null;
};

export default function ParagraphLearningSetsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const subjectId = params.id as string;
  const unitId = params.unitId as string;
  const paraId = params.paraId as string;
  const action = searchParams.get('action');

  const [learningSets, setLearningSets] = useState<LearningSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(action === 'new');

  useEffect(() => {
    const controller = new AbortController();
    const fetchSets = async (signal?: AbortSignal) => {
      setLoading(true);
      try {
        const { data, error } = await (supabase.from('learning_sets') as any)
          .select('id,title,description,created_at')
          .eq('paragraph_id', paraId)
          .order('created_at', { ascending: false })
          .abortSignal(signal);
        
        if (error) {
          if (error.name === 'AbortError') return;
          console.error('Error fetching learning sets:', error);
          return;
        }
        setLearningSets(data || []);
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        console.error('Error in fetchSets:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSets(controller.signal);
    return () => controller.abort();
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
          <span>{isCreating ? 'Back to Sets' : 'Back to Content'}</span>
        </button>

        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-serif font-bold text-white">
                {isCreating ? 'Create Learning Set' : 'Learning Sets'}
              </h1>
            </div>
            <p className="text-slate-400">
              {isCreating ? 'Add terms and definitions for flashcards and games' : 'Study your flashcards and terms'}
            </p>
          </div>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="glass-button px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>New Set</span>
            </button>
          )}
        </div>

        {isCreating ? (
          <div className="max-w-4xl mx-auto">
            <LearningSetBuilder 
              paragraphId={paraId} 
              subjectId={subjectId}
              userId={user?.id || ''} 
              onCancel={() => setIsCreating(false)} 
            />
          </div>
        ) : learningSets.length === 0 ? (
          <div className="glass-card p-12 text-center border border-white/5">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-white font-bold mb-2">No learning sets yet</h3>
            <p className="text-slate-500 mb-6">Create a learning set to start studying with flashcards and games!</p>
            <button
              onClick={() => setIsCreating(true)}
              className="glass-button px-6 py-2 rounded-xl"
            >
              Create First Set
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {learningSets.map((set) => (
              <div
                key={set.id}
                onClick={() => router.push(`/subjects/${subjectId}/chapters/${unitId}/paragraphs/${paraId}/learning-sets/${set.id}`)}
                className="group glass-card p-5 border border-white/5 hover:border-blue-500/20 hover:bg-white/[0.04] transition-all duration-300 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
                    <Brain className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-white font-bold mb-1 group-hover:text-blue-400 transition-colors line-clamp-1">{set.title}</h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{set.description || 'No description'}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 uppercase tracking-wider font-medium text-[10px]">
                    Flashcards
                  </span>
                  <span>•</span>
                  <span>{new Date(set.created_at || '').toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
