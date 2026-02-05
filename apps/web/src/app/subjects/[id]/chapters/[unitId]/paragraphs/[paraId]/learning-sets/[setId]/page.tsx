'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Brain, ChevronLeft, ChevronRight, RotateCcw, Trophy, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import ErrorLogger from '@/lib/ErrorLogger';

type Term = {
  id: string;
  term: string;
  definition: string;
};

export default function LearningSetStudyPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id as string;
  const unitId = params.unitId as string;
  const paraId = params.paraId as string;
  const setId = params.setId as string;

  const [set, setSet] = useState<any>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [progress, setProgress] = useState(0);
  const fetchControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        fetchControllerRef.current?.abort();
        fetchControllerRef.current = new AbortController();
        const signal = fetchControllerRef.current.signal;

        // Fetch the set details
        const { data: setData, error: setError } = await (supabase.from('learning_sets') as any)
          .select('*')
          .eq('id', setId)
          .abortSignal(signal)
          .single();
        
        if (setError) {
          if (setError.name === 'AbortError') return;
          throw setError;
        }

        if (setData) {
          setSet(setData);
          
          // Fetch terms from leerset_items using the set title to find the leerset
          const { data: leersetData, error: leersetError } = await (supabase.from('leersets') as any)
            .select('id')
            .eq('title', setData.title)
            .eq('subject_id', subjectId)
            .abortSignal(signal)
            .single();
            
          if (leersetError && leersetError.name !== 'AbortError') {
            ErrorLogger.error('Error fetching leerset', leersetError);
          }

          if (leersetData) {
            const { data: itemsData, error: itemsError } = await (supabase.from('leerset_items') as any)
              .select('*')
              .eq('leerset_id', leersetData.id)
              .abortSignal(signal);
              
            if (itemsError) {
              if (itemsError.name === 'AbortError') return;
              throw itemsError;
            }
            if (itemsData) setTerms(itemsData);
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        ErrorLogger.error('Error fetching study data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    return () => {
      fetchControllerRef.current?.abort();
    };
  }, [setId, subjectId]);

  const handleNext = () => {
    if (currentIndex < terms.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setProgress(((currentIndex + 2) / terms.length) * 100);
    } else {
      setIsFinished(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#3b82f6', '#10b981']
      });
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setProgress(((currentIndex) / terms.length) * 100);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
    setProgress((1 / terms.length) * 100);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!set || terms.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <Brain className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No Terms Found</h2>
        <p className="text-slate-400 mb-6">This learning set has no terms to study.</p>
        <button
          onClick={() => router.push(`/subjects/${subjectId}/chapters/${unitId}/paragraphs/${paraId}/learning-sets`)}
          className="glass-button px-6 py-2 rounded-xl"
        >
          Back to Sets
        </button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl font-serif font-bold text-white mb-2">Set Completed!</h2>
        <p className="text-slate-400 text-lg mb-8">You've mastered all {terms.length} terms in this set.</p>
        
        <div className="flex gap-4">
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Study Again</span>
          </button>
          <button
            onClick={() => router.push(`/subjects/${subjectId}/chapters/${unitId}/paragraphs/${paraId}/learning-sets`)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Content</span>
          </button>
        </div>
        
        <div className="mt-12 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-4 animate-bounce">
          <Zap className="w-6 h-6 text-blue-400" />
          <span className="text-blue-400 font-bold">+50 XP Earned!</span>
        </div>
      </div>
    );
  }

  const currentTerm = terms[currentIndex];

  return (
    <div className="h-full p-8 relative overflow-y-auto flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.push(`/subjects/${subjectId}/chapters/${unitId}/paragraphs/${paraId}/learning-sets`)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="text-slate-400 font-medium">
            {currentIndex + 1} / {terms.length}
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">{set.title}</h1>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
              style={{ width: `${progress || (1/terms.length)*100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center py-12">
          {/* Flashcard */}
          <div 
            className="w-full max-w-2xl aspect-[3/2] relative perspective-1000 group cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className={`w-full h-full relative transition-transform duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
              {/* Front */}
              <div className="absolute inset-0 backface-hidden glass-card flex flex-col items-center justify-center p-12 text-center border-2 border-white/10 group-hover:border-purple-500/30 transition-colors">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Term</span>
                <h2 className="text-4xl font-serif font-bold text-white leading-tight">{currentTerm.term}</h2>
                <p className="mt-8 text-slate-500 text-sm animate-pulse">Click to flip</p>
              </div>
              
              {/* Back */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 glass-card flex flex-col items-center justify-center p-12 text-center border-2 border-purple-500/50 bg-purple-500/5">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4">Definition</span>
                <p className="text-2xl text-white leading-relaxed">{currentTerm.definition}</p>
                <p className="mt-8 text-slate-500 text-sm">Click to flip back</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center items-center gap-8 pb-12">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="w-14 h-14 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={handleNext}
            className="px-12 py-4 rounded-2xl bg-purple-600 text-white font-bold text-lg hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20 active:scale-95"
          >
            {currentIndex === terms.length - 1 ? 'Finish' : 'Next Card'}
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex === terms.length - 1 && isFinished}
            className="w-14 h-14 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all disabled:opacity-20"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      <style jsx>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}
