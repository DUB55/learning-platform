'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { calculateSM2, srsService } from '@/lib/srsService';
import ErrorLogger from '@/lib/ErrorLogger';
import { 
  Brain, Zap, CheckCircle2, XCircle, 
  RotateCcw, Sparkles, ChevronLeft, ChevronRight,
  Trophy, Clock, Save, Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SRSSessionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    mastered: 0,
    relearned: 0
  });

  useEffect(() => {
    if (user) {
      fetchDueItems();
    }
  }, [user]);

  const fetchDueItems = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('srs_items')
        .select('*')
        .eq('user_id', user!.id)
        .lte('next_review', now)
        .order('next_review', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      ErrorLogger.error('Error fetching SRS items', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (quality: number) => {
    if (isSaving) return;
    setIsSaving(true);
    
    const currentItem = items[currentIndex];
    const { interval, repetition, efactor, nextReview } = calculateSM2(
      quality,
      currentItem.interval,
      currentItem.repetition,
      currentItem.efactor
    );

    try {
      const { error } = await supabase
        .from('srs_items')
        .update({
          interval,
          repetition,
          efactor,
          next_review: nextReview,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentItem.id);

      if (error) throw error;

      // Update local state for stats
      setSessionStats(prev => ({
        ...prev,
        reviewed: prev.reviewed + 1,
        mastered: quality >= 4 ? prev.mastered + 1 : prev.mastered,
        relearned: quality < 3 ? prev.relearned + 1 : prev.relearned
      }));

      // Move to next card or finish
      if (currentIndex < items.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
      } else {
        // Session complete
        setItems([]);
      }
    } catch (error) {
      ErrorLogger.error('Error updating SRS item', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-slate-400">Loading your review session...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20">
          <Trophy className="w-10 h-10 text-emerald-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">You're All Caught Up!</h1>
        <p className="text-slate-400 max-w-md mb-8">
          You've reviewed all your due cards. Your brain is in top shape! 
          Check back later for more reviews.
        </p>
        
        <div className="grid grid-cols-3 gap-8 mb-10 w-full max-w-lg">
          <div className="glass-card p-4">
            <div className="text-2xl font-bold text-white">{sessionStats.reviewed}</div>
            <div className="text-xs text-slate-500 uppercase font-bold">Reviewed</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-bold text-emerald-400">{sessionStats.mastered}</div>
            <div className="text-xs text-slate-500 uppercase font-bold">Mastered</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-bold text-amber-400">{sessionStats.relearned}</div>
            <div className="text-xs text-slate-500 uppercase font-bold">Relearned</div>
          </div>
        </div>

        <button 
          onClick={() => router.push('/study')}
          className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all"
        >
          Back to Study Hub
        </button>
      </div>
    );
  }

  const currentItem = items[currentIndex];

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto p-6 md:p-10">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            Spaced Repetition
          </h1>
          <p className="text-slate-500 text-sm">
            Card {currentIndex + 1} of {items.length}
          </p>
        </div>
        <button 
          onClick={() => router.push('/study')}
          className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
        >
          Exit
        </button>
      </header>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-white/5 rounded-full mb-12 overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
        />
      </div>

      {/* Flashcard */}
      <div className="flex-1 flex flex-col perspective-1000">
        <div 
          className={`relative w-full h-full min-h-[400px] transition-all duration-500 preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden glass-card p-10 flex flex-col items-center justify-center text-center border-white/10 bg-white/[0.02]">
            <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-6">Question</div>
            <div className="text-2xl md:text-3xl font-medium text-white leading-relaxed">
              {currentItem.front}
            </div>
            <div className="mt-12 text-slate-500 text-sm flex items-center gap-2 animate-pulse">
              <RotateCcw className="w-4 h-4" />
              Click to reveal answer
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 glass-card p-10 flex flex-col items-center justify-center text-center border-blue-500/30 bg-blue-500/5">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-6">Answer</div>
            <div className="text-2xl md:text-3xl font-medium text-white leading-relaxed">
              {currentItem.back}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={`mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); handleRate(1); }}
          className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 transition-all group"
        >
          <div className="font-bold mb-1">Again</div>
          <div className="text-[10px] uppercase opacity-50 font-bold tracking-tighter">Forgotten</div>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleRate(3); }}
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 transition-all"
        >
          <div className="font-bold mb-1">Hard</div>
          <div className="text-[10px] uppercase opacity-50 font-bold tracking-tighter">Barely recalled</div>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleRate(4); }}
          className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 transition-all"
        >
          <div className="font-bold mb-1">Good</div>
          <div className="text-[10px] uppercase opacity-50 font-bold tracking-tighter">Recalled well</div>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleRate(5); }}
          className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 transition-all"
        >
          <div className="font-bold mb-1">Easy</div>
          <div className="text-[10px] uppercase opacity-50 font-bold tracking-tighter">Mastered</div>
        </button>
      </div>

      {/* Hints */}
      {!isFlipped && (
        <div className="mt-10 flex justify-center text-slate-500 text-xs font-medium uppercase tracking-widest gap-8">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded border border-white/20">Space</span>
            Flip Card
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded border border-white/20">1-4</span>
            Rate Answer
          </div>
        </div>
      )}
    </div>
  );
}
