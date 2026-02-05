'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Brain, ChevronLeft, ChevronRight, RotateCcw, Trophy, Zap, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import ErrorLogger from '@/lib/ErrorLogger';

type Term = { 
  id: string;
  term: string;
  definition: string;
  subject_title?: string;
};

function QuickReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setId = searchParams.get('setId');
  const { user } = useAuth();

  const [terms, setTerms] = useState<Term[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [progress, setProgress] = useState(0);
  const fetchControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      
      try {
        fetchControllerRef.current?.abort();
        fetchControllerRef.current = new AbortController();
        const signal = fetchControllerRef.current.signal;

        if (setId) {
          // Fetch terms for a specific leerset
          const { data: items, error: itemsError } = await (supabase.from('leerset_items') as any)
            .select('*, leersets(title, subject_id, subjects(title))')
            .eq('leerset_id', setId)
            .abortSignal(signal);

          if (itemsError) throw itemsError;

          if (items) {
            const enrichedItems = items.map((item: any) => ({
                  ...item,
                  subject_title: (item.leersets as any)?.subjects?.title || (item.leersets as any)?.title || 'Learning Set'
                }));
            const shuffled = [...enrichedItems].sort(() => Math.random() - 0.5);
            setTerms(shuffled);
          }
        } else {
          // Fetch all terms from all leersets for this user
          const { data: subjects, error: subjectsError } = await (supabase.from('subjects') as any)
            .select('id, title')
            .eq('user_id', user.id)
            .abortSignal(signal);

          if (subjectsError) throw subjectsError;

          if (subjects && subjects.length > 0) {
            const subjectIds = subjects.map(s => s.id);
            const subjectMap = subjects.reduce((acc, s) => ({ ...acc, [s.id]: s.title }), {} as any);

            const { data: leersets, error: leersetsError } = await (supabase.from('leersets') as any)
              .select('id, subject_id')
              .in('subject_id', subjectIds)
              .abortSignal(signal);

            if (leersetsError) throw leersetsError;

            if (leersets && leersets.length > 0) {
              const leersetIds = leersets.map(l => l.id);
              const leersetToSubject = leersets.reduce((acc, l) => ({ ...acc, [l.id]: l.subject_id }), {} as any);

              const { data: items, error: itemsError } = await (supabase.from('leerset_items') as any)
                .select('*')
                .in('leerset_id', leersetIds)
                .abortSignal(signal);

              if (itemsError) throw itemsError;

              if (items) {
                const enrichedItems = items.map(item => ({
                  ...item,
                  subject_title: subjectMap[leersetToSubject[item.leerset_id]]
                }));
                const shuffled = [...enrichedItems].sort(() => Math.random() - 0.5);
                setTerms(shuffled);
              }
            }
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        ErrorLogger.error('Error fetching quick review data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      fetchControllerRef.current?.abort();
    };
  }, [user, setId]);

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
        colors: ['#f59e0b', '#ef4444', '#3b82f6']
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
    setTerms(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-yellow-500 mb-4" />
        <p className="text-slate-400 font-medium">Preparing your quick review...</p>
      </div>
    );
  }

  if (terms.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mb-6 border border-yellow-500/20">
          <Zap className="w-10 h-10 text-yellow-500" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">No Cards to Review</h2>
        <p className="text-slate-400 max-w-md mb-8">
          {setId ? "This learning set doesn't have any cards yet." : "You haven't created any learning sets yet. Create some flashcards in your subjects to start a quick review!"}
        </p>
        <button
          onClick={() => router.push(setId ? '/library' : '/library')}
          className="px-8 py-3 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white font-bold transition-all"
        >
          Go to Library
        </button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center mb-8 shadow-2xl shadow-yellow-600/20 rotate-3">
          <Trophy className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-4xl font-serif font-bold text-white mb-2">Quick Review Complete!</h2>
        <p className="text-slate-400 text-lg mb-8">You've powered through {terms.length} cards{setId ? " from this set" : " from across your subjects"}.</p>
        
        <div className="flex gap-4">
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all font-bold"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Review Again</span>
          </button>
          <button
            onClick={() => router.push('/study-modes')}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-yellow-600 text-white hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-600/20 font-bold"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Study Hub</span>
          </button>
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
            onClick={() => router.push('/study-modes')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-medium">Exit Review</span>
          </button>
          <div className="px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-bold text-sm">
            {currentIndex + 1} / {terms.length}
          </div>
        </div>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Quick Review</h1>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{currentTerm.subject_title || 'General'}</div>
            </div>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500 ease-out"
              style={{ width: `${progress || (1/terms.length)*100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center py-8">
          {/* Flashcard */}
          <div 
            className="w-full max-w-2xl aspect-[16/10] relative perspective-1000 group cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className={`w-full h-full relative transition-transform duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
              {/* Front */}
              <div className="absolute inset-0 backface-hidden glass-card flex flex-col items-center justify-center p-12 text-center border-2 border-white/10 group-hover:border-yellow-500/30 transition-colors shadow-2xl">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Question</span>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-white leading-tight">{currentTerm.term}</h2>
                <div className="mt-12 flex items-center gap-2 text-slate-500 text-sm font-medium animate-pulse">
                  <RotateCcw className="w-4 h-4" />
                  <span>Click to reveal answer</span>
                </div>
              </div>
              
              {/* Back */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 glass-card flex flex-col items-center justify-center p-12 text-center border-2 border-yellow-500/50 bg-yellow-500/5 shadow-2xl">
                <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-6">Answer</span>
                <p className="text-2xl md:text-3xl text-white leading-relaxed font-medium">{currentTerm.definition}</p>
                <div className="mt-12 flex items-center gap-2 text-slate-500 text-sm font-medium animate-pulse">
                  <RotateCcw className="w-4 h-4" />
                  <span>Click to show question</span>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-12 flex items-center gap-6">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              disabled={currentIndex === 0}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                currentIndex === 0 
                  ? 'bg-white/5 text-slate-600 cursor-not-allowed' 
                  : 'bg-white/10 text-white hover:bg-white/20 active:scale-95 shadow-lg'
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="px-10 h-14 rounded-2xl bg-yellow-600 text-white font-bold hover:bg-yellow-500 active:scale-95 transition-all shadow-lg shadow-yellow-600/20 flex items-center gap-2"
            >
              <span>{currentIndex === terms.length - 1 ? 'Finish' : 'Next Card'}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuickReviewPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-yellow-500 mb-4" />
        <p className="text-slate-400 font-medium">Loading session...</p>
      </div>
    }>
      <QuickReviewContent />
    </Suspense>
  );
}
