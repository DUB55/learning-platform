'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Trophy, ArrowLeft, Brain, Sparkles, Check, X, Star, FolderOpen, Search, Play, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import ResourceExplorerModal from '../modals/ResourceExplorerModal';
import { supabase } from '@/lib/supabase';
import ErrorLogger from '@/lib/ErrorLogger';
import { useAuth } from '@/contexts/AuthContext';

import { useUISettings } from '@/contexts/UISettingsContext';

interface Term { id: string; term: string; definition: string; }

interface MemoryMatchProps {
    onExit: () => void;
    terms?: Term[];
    focusMode?: boolean;
}

type Card = {
    id: string;
    content: string;
    pairId: string;
    isFlipped: boolean;
    isMatched: boolean;
    type: 'term' | 'definition';
    difficulty?: number;
};

interface GameStats {
    bestTime: number;
    totalMatches: number;
    streak: number;
    accuracy: number;
}

export default function MemoryMatch({ onExit, terms: initialTerms = [], focusMode }: MemoryMatchProps) {
    const { updateXP, user } = useAuth();
    const { settings } = useUISettings();
    const [gameState, setGameState] = useState<'setup' | 'playing' | 'gameOver'>('setup');
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [terms, setTerms] = useState<Term[]>(initialTerms);
    const [cards, setCards] = useState<Card[]>([]);
    const [flipped, setFlipped] = useState<number[]>([]);
    const [score, setScore] = useState(0);
    const [time, setTime] = useState(0);
    const [moves, setMoves] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isExplorerOpen, setIsExplorerOpen] = useState(false);
    const [selectedSetId, setSelectedSetId] = useState<string>('');
    const [selectedSetName, setSelectedSetName] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<GameStats>({ bestTime: 0, totalMatches: 0, streak: 0, accuracy: 100 });

    const translations = {
        nl: {
            title: "Memory Master",
            subtitle: "Het ultieme cognitieve trainingstool. Synchroniseer termen en definities met precisie en snelheid.",
            personalBest: "Persoonlijk Record",
            time: "Tijd",
            accuracy: "Nauwkeurigheid",
            source: "1. Kennisbron",
            chooseSet: "Kies een leerset...",
            intensity: "2. Intensiteitsniveau",
            easy: "Makkelijk",
            medium: "Gemiddeld",
            hard: "Moeilijk",
            protocol: "Spelregels",
            rule1: "Koppel termen aan de juiste definities",
            rule2: "Hogere moeilijkheid = Meer XP",
            rule3: "Snelheid verhoogt je eindscore",
            initiate: "Start Training",
            score: "Score",
            elapsed: "Verstreken Tijd",
            moves: "Zetten",
            abort: "Afbreken",
            neuralSync: "Neurale Sync",
            term: "Term",
            definition: "Definitie",
            gameOver: "Training Voltooid",
            finalScore: "Eindscore",
            xpEarned: "Verdiende XP",
            playAgain: "Opnieuw Spelen",
            trainingSummary: "Trainingsoverzicht"
        },
        en: {
            title: "Memory Master",
            subtitle: "The ultimate cognitive training tool. Synchronize terms and definitions with precision and speed.",
            personalBest: "Personal Best",
            time: "Time",
            accuracy: "Accuracy",
            source: "1. Knowledge Source",
            chooseSet: "Choose learning set...",
            intensity: "2. Intensity Level",
            easy: "Easy",
            medium: "Medium",
            hard: "Hard",
            protocol: "Game Protocol",
            rule1: "Match terms with correct definitions",
            rule2: "Harder difficulty = Exponential XP",
            rule3: "Speed increases your final score",
            initiate: "Initiate Training",
            score: "Combat Score",
            elapsed: "Time Elapsed",
            moves: "Tactical Moves",
            abort: "Abort",
            neuralSync: "Neural Sync",
            term: "Term",
            definition: "Definition",
            gameOver: "Training Complete",
            finalScore: "Final Score",
            xpEarned: "XP Earned",
            playAgain: "Play Again",
            trainingSummary: "Training Summary"
        },
        de: {
            title: "Memory Master",
            subtitle: "Das ultimative kognitive Trainingswerkzeug. Synchronisieren Sie Begriffe und Definitionen mit Präzision und Geschwindigkeit.",
            personalBest: "Persönliche Bestleistung",
            time: "Zeit",
            accuracy: "Genauigkeit",
            source: "1. Wissensquelle",
            chooseSet: "Lernset wählen...",
            intensity: "2. Intensitätsstufe",
            easy: "Einfach",
            medium: "Mittel",
            hard: "Schwer",
            protocol: "Spielregeln",
            rule1: "Begriffe mit den richtigen Definitionen verknüpfen",
            rule2: "Höhere Schwierigkeit = Mehr XP",
            rule3: "Geschwindigkeit erhöht Ihre Endpunktzahl",
            initiate: "Training Starten",
            score: "Punktestand",
            elapsed: "Verstrichene Zeit",
            moves: "Züge",
            abort: "Abbrechen",
            neuralSync: "Neuraler Sync",
            term: "Begriff",
            definition: "Definition",
            gameOver: "Training Abgeschlossen",
            finalScore: "Endpunktzahl",
            xpEarned: "Verdiente XP",
            playAgain: "Nochmal Spielen",
            trainingSummary: "Trainingszusammenfassung"
        },
        fr: {
            title: "Maître de la Mémoire",
            subtitle: "L'outil d'entraînement cognitif ultime. Synchronisez les termes et les définitions avec précision et rapidité.",
            personalBest: "Record Personnel",
            time: "Temps",
            accuracy: "Précision",
            source: "1. Source de Connaissances",
            chooseSet: "Choisir un ensemble...",
            intensity: "2. Niveau d'Intensité",
            easy: "Facile",
            medium: "Moyen",
            hard: "Difficile",
            protocol: "Protocole de Jeu",
            rule1: "Associez les termes aux bonnes définitions",
            rule2: "Difficulté accrue = XP exponentielle",
            rule3: "La vitesse augmente votre score final",
            initiate: "Initier l'Entraînement",
            score: "Score de Combat",
            elapsed: "Temps Écoulé",
            moves: "Mouvements Tactiques",
            abort: "Avorter",
            neuralSync: "Sync Neurale",
            term: "Terme",
            definition: "Définition",
            gameOver: "Entraînement Terminé",
            finalScore: "Score Final",
            xpEarned: "XP Gagnée",
            playAgain: "Rejouer",
            trainingSummary: "Résumé de l'Entraînement"
        },
        es: {
            title: "Maestro de la Memoria",
            subtitle: "La herramienta de entrenamiento cognitivo definitiva. Sincroniza términos y definiciones con precisión y velocidad.",
            personalBest: "Récord Personal",
            time: "Tiempo",
            accuracy: "Precisión",
            source: "1. Fuente de Conocimiento",
            chooseSet: "Elegir conjunto de aprendizaje...",
            intensity: "2. Nivel de Intensidad",
            easy: "Fácil",
            medium: "Medio",
            hard: "Difícil",
            protocol: "Protocolo de Juego",
            rule1: "Empareja términos con definiciones correctas",
            rule2: "Mayor dificultad = XP exponencial",
            rule3: "La velocidad aumenta tu puntuación final",
            initiate: "Iniciar Entrenamiento",
            score: "Puntuación de Combate",
            elapsed: "Tiempo Transcurrido",
            moves: "Movimientos Tácticos",
            abort: "Abortar",
            neuralSync: "Sincronización Neural",
            term: "Término",
            definition: "Definición",
            gameOver: "Entrenamiento Completado",
            finalScore: "Puntuación Final",
            xpEarned: "XP Ganada",
            playAgain: "Jugar de Nuevo",
            trainingSummary: "Resumen del Entrenamiento"
        }
    };

    const t = translations[settings.language as keyof typeof translations] || translations.en;

    const difficultyConfig = {
        easy: { pairs: 4, gridClass: 'grid-cols-2 sm:grid-cols-4' },
        medium: { pairs: 8, gridClass: 'grid-cols-4' },
        hard: { pairs: 12, gridClass: 'grid-cols-4 sm:grid-cols-6' }
    };

    const initGame = useCallback(() => {
        if (terms.length < 4) return;
        const pairCount = difficultyConfig[difficulty].pairs;
        const selectedTerms = [...terms].sort(() => Math.random() - 0.5).slice(0, pairCount);
        const gameCards: Card[] = [];

        selectedTerms.forEach(term => {
            gameCards.push({
                id: `t-${term.id}`,
                content: term.term,
                pairId: term.id,
                isFlipped: false,
                isMatched: false,
                type: 'term'
            });
            gameCards.push({
                id: `d-${term.id}`,
                content: term.definition,
                pairId: term.id,
                isFlipped: false,
                isMatched: false,
                type: 'definition'
            });
        });

        setCards(gameCards.sort(() => Math.random() - 0.5));
        setScore(0);
        setTime(0);
        setMoves(0);
        setGameState('playing');
        setFlipped([]);
    }, [terms, difficulty]);

    const handleSelectResource = (resource: any) => {
        setSelectedSetId(resource.id);
        setSelectedSetName(resource.title);
    };

    const handleStart = async () => {
        if (!selectedSetId) return;

        setLoading(true);
        try {
            const { data: items, error } = await supabase
                .from('leerset_items')
                .select('id, term, definition')
                .eq('leerset_id', selectedSetId);

            if (error) throw error;

            if (items && items.length >= 4) {
                setTerms(items);
                setLoading(false);
                // The useEffect will trigger initGame when terms change
            } else {
                alert('This learning set needs at least 4 terms to play Memory Match. Please choose another one.');
                setLoading(false);
            }
        } catch (err) {
            ErrorLogger.error('Error starting Memory Match', err);
            alert('Failed to load learning set.');
            setLoading(false);
        }
    };

    useEffect(() => {
        if (terms.length >= 4 && gameState === 'setup' && selectedSetId) {
            initGame();
        }
    }, [terms, initGame, gameState, selectedSetId]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (gameState === 'playing') {
            timer = setInterval(() => setTime(t => t + 1), 1000);
        }
        return () => clearInterval(timer);
    }, [gameState]);

    const handleFlip = (index: number) => {
        if (isProcessing || cards[index].isFlipped || cards[index].isMatched || flipped.length === 2) return;

        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);

        const newFlipped = [...flipped, index];
        setFlipped(newFlipped);

        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            setIsProcessing(true);
            const [firstIdx, secondIdx] = newFlipped;
            const first = cards[firstIdx];
            const second = cards[secondIdx];

            if (first.pairId === second.pairId && first.type !== second.type) {
                // Match
                setTimeout(() => {
                    const matchedCards = [...cards];
                    matchedCards[firstIdx].isMatched = true;
                    matchedCards[secondIdx].isMatched = true;
                    setCards(matchedCards);
                    setFlipped([]);
                    
                    // Progressive scoring based on speed and difficulty
                    const basePoints = difficulty === 'easy' ? 100 : difficulty === 'medium' ? 200 : 400;
                    const speedBonus = Math.max(0, 50 - time);
                    setScore(s => s + basePoints + speedBonus);
                    
                    setIsProcessing(false);

                    if (matchedCards.every(c => c.isMatched)) {
                        setGameState('gameOver');
                        confetti({ 
                            particleCount: 200, 
                            spread: 100, 
                            origin: { y: 0.6 },
                            colors: ['#3b82f6', '#8b5cf6', '#ec4899']
                        });
                        
                        const finalXP = Math.floor(score / 10);
                        updateXP(finalXP, `Completed ${difficulty} Memory Match`);
                    }
                }, 600);
            } else {
                // No match
                setTimeout(() => {
                    const resetCards = [...cards];
                    resetCards[firstIdx].isFlipped = false;
                    resetCards[secondIdx].isFlipped = false;
                    setCards(resetCards);
                    setFlipped([]);
                    setIsProcessing(false);
                }, 1000);
            }
        }
    };

    if (gameState === 'setup') {
        return (
            <div className="w-full max-w-4xl p-8 space-y-8 animate-in fade-in zoom-in duration-500 glass-card">
                <div className="flex justify-between items-start">
                    <div className="text-left space-y-2">
                        <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                            <Brain className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">{t.title}</h2>
                        <p className="text-slate-400 max-w-md">{t.subtitle}</p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4">{t.personalBest}</p>
                        <div className="flex gap-6">
                            <div className="text-center">
                                <p className="text-2xl font-black text-white">{stats.bestTime || '--'}s</p>
                                <p className="text-[8px] text-slate-500 uppercase">{t.time}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-emerald-400">{stats.accuracy}%</p>
                                <p className="text-[8px] text-slate-500 uppercase">{t.accuracy}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <FolderOpen className="w-4 h-4" />
                                {t.source}
                            </label>
                            <div 
                                onClick={() => setIsExplorerOpen(true)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-[1.5rem] px-6 py-5 text-white hover:bg-white/5 hover:border-blue-500/30 transition-all cursor-pointer flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <Search className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <span className={selectedSetName ? "text-lg font-bold text-white" : "text-slate-500 font-medium"}>
                                        {selectedSetName || t.chooseSet}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                {t.intensity}
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                                    <button
                                        key={lvl}
                                        onClick={() => setDifficulty(lvl)}
                                        className={`py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all border-2 ${
                                            difficulty === lvl 
                                            ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20 scale-105' 
                                            : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                                        }`}
                                    >
                                        {t[lvl as keyof typeof t]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-600/5 rounded-[2.5rem] p-8 border border-blue-500/10 flex flex-col justify-between">
                        <div className="space-y-4">
                            <h4 className="font-black text-white uppercase tracking-widest text-sm">{t.protocol}</h4>
                            <ul className="space-y-3">
                                {[
                                    { icon: Check, text: t.rule1 },
                                    { icon: Check, text: t.rule2 },
                                    { icon: Check, text: t.rule3 },
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                                        <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                                            <item.icon className="w-3 h-3 text-blue-400" />
                                        </div>
                                        {item.text}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button 
                            onClick={handleStart}
                            disabled={!selectedSetId || loading}
                            className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-[1.5rem] shadow-2xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 text-xl uppercase tracking-tighter group mt-8"
                        >
                            {loading ? (
                                <RefreshCw className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <span>{t.initiate}</span>
                                    <Play className="w-6 h-6 group-hover:translate-x-1 transition-transform fill-current" />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <ResourceExplorerModal 
                    isOpen={isExplorerOpen}
                    onClose={() => setIsExplorerOpen(false)}
                    onSelect={handleSelectResource}
                    title="Knowledge Source"
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center p-6 w-full max-w-6xl mx-auto">
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-10 bg-slate-900/80 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-3xl shadow-2xl sticky top-4 z-40">
                <div className="flex gap-12">
                    <div className="text-left">
                        <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.3em] mb-1">{t.score}</p>
                        <p className="text-4xl font-black text-white tabular-nums">{score}</p>
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] text-purple-500 font-black uppercase tracking-[0.3em] mb-1">{t.elapsed}</p>
                        <p className="text-4xl font-black text-white tabular-nums">
                            {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
                        </p>
                    </div>
                    <div className="hidden sm:block text-left border-l border-white/10 pl-12">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-1">{t.moves}</p>
                        <p className="text-4xl font-black text-slate-300 tabular-nums">{moves}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={initGame} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 group" title="Restart Session">
                        <RefreshCw className="w-6 h-6 text-slate-400 group-active:rotate-180 transition-transform duration-700" />
                    </button>
                    <button onClick={onExit} className="px-8 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all border border-red-500/20 text-xs font-black uppercase tracking-widest active:scale-95">
                        {t.abort}
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className={`grid ${difficultyConfig[difficulty].gridClass} gap-6 w-full perspective-2000`}>
                {cards.map((card, i) => (
                    <button
                        key={card.id}
                        onClick={() => handleFlip(i)}
                        className={`
                            aspect-[4/5] relative preserve-3d transition-all duration-700 cursor-pointer group
                            ${card.isFlipped ? 'rotate-y-180' : 'hover:scale-105 active:scale-95'}
                            ${card.isMatched ? 'opacity-0 scale-90 pointer-events-none' : ''}
                        `}
                    >
                        {/* Front (Back of card) */}
                        <div className="absolute inset-0 backface-hidden bg-[#0f172a] border-2 border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center shadow-2xl overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-600/10 group-hover:opacity-100 opacity-50 transition-opacity" />
                            <div className="p-6 bg-white/5 rounded-3xl mb-4 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-500">
                                <Brain className="w-12 h-12 text-slate-700 group-hover:text-blue-400" />
                            </div>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] group-hover:text-slate-400 transition-colors">{t.neuralSync}</p>
                            
                            {/* Decorative corners */}
                            <div className="absolute top-6 left-6 w-4 h-4 border-t-2 border-l-2 border-slate-800" />
                            <div className="absolute top-6 right-6 w-4 h-4 border-t-2 border-r-2 border-slate-800" />
                            <div className="absolute bottom-6 left-6 w-4 h-4 border-b-2 border-l-2 border-slate-800" />
                            <div className="absolute bottom-6 right-6 w-4 h-4 border-b-2 border-r-2 border-slate-800" />
                        </div>

                        {/* Back (Front of card) */}
                        <div className={`
                            absolute inset-0 backface-hidden rotate-y-180 border-2 rounded-[2.5rem] flex items-center justify-center p-8 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden
                            ${card.type === 'term' ? 'bg-slate-900 border-blue-500/50' : 'bg-slate-900 border-purple-500/50'}
                        `}>
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.type === 'term' ? 'from-blue-500/5' : 'from-purple-500/5'} to-transparent`} />
                            <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${card.type === 'term' ? 'from-blue-500' : 'from-purple-500'} to-transparent`} />
                            
                            <p className="text-sm font-bold text-white leading-relaxed line-clamp-8 z-10">{card.content}</p>
                            
                            <div className="absolute bottom-6 right-6 opacity-5">
                                {card.type === 'term' ? <Sparkles className="w-16 h-16" /> : <Star className="w-16 h-16" />}
                            </div>

                            {/* Type Indicator */}
                            <div className={`absolute top-6 right-8 text-[8px] font-black uppercase tracking-widest ${card.type === 'term' ? 'text-blue-400' : 'text-purple-400'}`}>
                                {card.type === 'term' ? t.term : t.definition}
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Overlays */}
            {gameState === 'gameOver' && (
                <div className="fixed inset-0 bg-[#0a0f1e]/98 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center z-[100] animate-in fade-in zoom-in duration-700">
                    <div className="relative mb-12">
                        <Trophy className="w-32 h-32 text-yellow-500 drop-shadow-[0_0_30px_rgba(234,179,8,0.6)] animate-bounce" />
                        <div className="absolute -top-4 -right-4 bg-emerald-500 text-white p-4 rounded-full font-black animate-pulse">
                            +{Math.floor(score/10)} XP
                        </div>
                    </div>
                    
                    <h2 className="text-7xl font-black text-white mb-2 tracking-tighter uppercase italic">{t.gameOver}</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[1em] mb-12">{t.trainingSummary}</p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-16 w-full max-w-4xl">
                        {[
                            { label: t.time, value: `${Math.floor(time / 60)}m ${time % 60}s`, color: 'text-white' },
                            { label: t.finalScore, value: score, color: 'text-emerald-400' },
                            { label: t.moves, value: moves, color: 'text-blue-400' },
                            { label: t.accuracy, value: `${Math.round((difficultyConfig[difficulty].pairs / moves) * 100)}%`, color: 'text-purple-400' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/5 p-8 rounded-[2rem] border border-white/5 shadow-inner">
                                <p className="text-[10px] text-slate-500 font-black uppercase mb-2 tracking-widest">{stat.label}</p>
                                <p className={`text-3xl font-black ${stat.color} tabular-nums`}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
                        <button
                            onClick={initGame}
                            className="flex-1 bg-white text-black hover:bg-blue-500 hover:text-white font-black px-12 py-6 rounded-3xl transition-all shadow-2xl active:scale-95 uppercase tracking-widest text-xl italic"
                        >
                            {t.playAgain}
                        </button>
                        <button
                            onClick={() => setGameState('setup')}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black px-12 py-6 rounded-3xl transition-all border border-white/10 active:scale-95 uppercase tracking-widest text-xl"
                        >
                            {t.source.split(' ')[1]}
                        </button>
                    </div>
                </div>
            )}

            <div className="mt-16 flex items-center gap-4 text-slate-700 font-black opacity-20 group">
                <Brain className="w-5 h-5 group-hover:text-blue-500 transition-colors" />
                <p className="text-[10px] uppercase tracking-[0.8em]">Deep neural encoding in progress</p>
            </div>

            <style jsx global>{`
                .perspective-2000 { perspective: 2000px; }
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .line-clamp-8 {
                    display: -webkit-box;
                    -webkit-line-clamp: 8;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
}

