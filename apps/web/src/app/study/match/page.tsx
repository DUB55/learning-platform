'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Brain, RotateCcw, Trophy, Timer, Zap, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import ErrorLogger from '@/lib/ErrorLogger';
import { motion, AnimatePresence } from 'framer-motion';

type Term = { 
  id: string;
  term: string;
  definition: string;
};

type Card = {
  id: string;
  content: string;
  type: 'term' | 'definition';
  originalId: string;
  isMatched: boolean;
  isSelected: boolean;
  isError: boolean;
};

function MatchGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setId = searchParams.get('setId');
  const { user } = useAuth();

  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [time, setTime] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [matches, setMatches] = useState(0);
  const [totalPairs, setTotalPairs] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fetchControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        fetchControllerRef.current?.abort();
        fetchControllerRef.current = new AbortController();
        const signal = fetchControllerRef.current.signal;

        let query = (supabase.from('leerset_items') as any).select('*');
        
        if (setId) {
          query = query.eq('leerset_id', setId);
        } else {
          // Fallback to latest items if no setId provided
          const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();
          if (profile) {
            const { data: leersets } = await (supabase.from('leersets') as any)
              .select('id')
              .eq('user_id', user.id)
              .limit(5);
            
            if (leersets && leersets.length > 0) {
              query = query.in('leerset_id', leersets.map((l: any) => l.id));
            }
          }
        }

        const { data: items, error: itemsError } = await query.limit(6).abortSignal(signal);

        if (itemsError) throw itemsError;

        if (items && items.length > 0) {
          initializeGame(items);
        } else {
          setLoading(false);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        ErrorLogger.error('Error fetching match game data', error);
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      fetchControllerRef.current?.abort();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user, setId]);

  useEffect(() => {
    if (startTime && !isFinished) {
      timerRef.current = setInterval(() => {
        setTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTime, isFinished]);

  const initializeGame = (items: Term[]) => {
    const gameCards: Card[] = [];
    items.forEach(item => {
      gameCards.push({
        id: `term-${item.id}`,
        content: item.term,
        type: 'term',
        originalId: item.id,
        isMatched: false,
        isSelected: false,
        isError: false,
      });
      gameCards.push({
        id: `def-${item.id}`,
        content: item.definition,
        type: 'definition',
        originalId: item.id,
        isMatched: false,
        isSelected: false,
        isError: false,
      });
    });

    const shuffled = [...gameCards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setTotalPairs(items.length);
    setMatches(0);
    setTime(0);
    setStartTime(Date.now());
    setIsFinished(false);
    setLoading(false);
  };

  const handleCardClick = (index: number) => {
    if (cards[index].isMatched || cards[index].isSelected || selectedCards.length >= 2) return;

    const newCards = [...cards];
    newCards[index].isSelected = true;
    setCards(newCards);

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      const first = cards[newSelected[0]];
      const second = cards[newSelected[1]];

      if (first.originalId === second.originalId && first.type !== second.type) {
        // Match!
        setTimeout(() => {
          setCards(prev => {
            const updated = [...prev];
            updated[newSelected[0]].isMatched = true;
            updated[newSelected[1]].isMatched = true;
            updated[newSelected[0]].isSelected = false;
            updated[newSelected[1]].isSelected = false;
            return updated;
          });
          setSelectedCards([]);
          setMatches(m => {
            const newMatches = m + 1;
            if (newMatches === totalPairs) {
              finishGame();
            }
            return newMatches;
          });
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => {
            const updated = [...prev];
            updated[newSelected[0]].isError = true;
            updated[newSelected[1]].isError = true;
            return updated;
          });
          
          setTimeout(() => {
            setCards(prev => {
              const updated = [...prev];
              updated[newSelected[0]].isSelected = false;
              updated[newSelected[0]].isError = false;
              updated[newSelected[1]].isSelected = false;
              updated[newSelected[1]].isError = false;
              return updated;
            });
            setSelectedCards([]);
          }, 500);
        }, 500);
      }
    }
  };

  const finishGame = () => {
    setIsFinished(true);
    const finalTime = Math.floor((Date.now() - (startTime || 0)) / 1000);
    setTime(finalTime);
    
    if (!bestTime || finalTime < bestTime) {
      setBestTime(finalTime);
    }

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#8b5cf6', '#d946ef']
    });

    // Award XP (example: 50 XP for finishing, extra for speed)
    awardXP(50 + Math.max(0, 60 - finalTime));
  };

  const awardXP = async (amount: number) => {
    try {
      // Get current XP
      const { data: profile } = await supabase.from('profiles').select('xp').eq('id', user?.id).single();
      if (profile) {
        const newXp = (profile.xp || 0) + amount;
        await supabase.from('profiles').update({ xp: newXp }).eq('id', user?.id);
      }
    } catch (e) {
      console.error('Failed to award XP', e);
    }
  };

  const handleRestart = () => {
    setLoading(true);
    // Refetch or just reshuffle existing
    const resetCards = cards.map(c => ({
      ...c,
      isMatched: false,
      isSelected: false,
      isError: false
    }));
    setCards([...resetCards].sort(() => Math.random() - 0.5));
    setMatches(0);
    setTime(0);
    setStartTime(Date.now());
    setIsFinished(false);
    setLoading(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-slate-400 font-medium">Preparing the match board...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
          <Brain className="w-10 h-10 text-blue-500" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Not Enough Cards</h2>
        <p className="text-slate-400 max-w-md mb-8">
          You need at least 2 cards in a learning set to play the Match Game.
        </p>
        <button
          onClick={() => router.back()}
          className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center mb-8 shadow-2xl shadow-blue-600/20 rotate-3"
        >
          <Trophy className="w-12 h-12 text-white" />
        </motion.div>
        <h2 className="text-4xl font-serif font-bold text-white mb-2">Fantastic Matching!</h2>
        <p className="text-slate-400 text-lg mb-8">You matched all {totalPairs} pairs in {formatTime(time)}.</p>
        
        <div className="grid grid-cols-2 gap-4 mb-10 w-full max-w-sm">
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Time</p>
            <p className="text-2xl font-bold text-white">{formatTime(time)}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Best</p>
            <p className="text-2xl font-bold text-blue-400">{bestTime ? formatTime(bestTime) : '--'}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all font-bold"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Play Again</span>
          </button>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 font-bold"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-white/5 text-slate-400 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-white font-mono text-xl bg-white/5 px-4 py-2 rounded-xl border border-white/10">
            <Timer className="w-5 h-5 text-blue-400" />
            {formatTime(time)}
          </div>
          <div className="text-slate-400 font-medium">
            <span className="text-white">{matches}</span> / {totalPairs} pairs
          </div>
        </div>
        
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-fr">
        <AnimatePresence>
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: card.isMatched ? 0 : 1, 
                scale: card.isMatched ? 0.8 : 1,
                y: card.isMatched ? -20 : 0
              }}
              whileHover={{ scale: card.isMatched ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCardClick(index)}
              className={`
                relative flex items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 rounded-2xl border-2
                ${card.isSelected 
                  ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                  : card.isError
                    ? 'bg-red-500/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                    : 'glass-card border-white/10 hover:border-white/20'
                }
                ${card.isMatched ? 'pointer-events-none opacity-0' : ''}
              `}
            >
              <p className={`text-sm md:text-base font-medium ${card.isSelected ? 'text-white' : 'text-slate-200'}`}>
                {card.content}
              </p>
              
              {card.isSelected && !card.isError && (
                <div className="absolute top-2 right-2">
                  <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-8 text-center text-slate-500 text-sm italic">
        Match the term with its corresponding definition as fast as you can!
      </div>
    </div>
  );
}

export default function MatchGamePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200">
      <Suspense fallback={
        <div className="h-screen flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        </div>
      }>
        <MatchGameContent />
      </Suspense>
    </div>
  );
}
