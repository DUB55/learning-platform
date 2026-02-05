'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Trophy, ArrowLeft, Star, Sparkles, X, Check, Zap, Brain } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/contexts/AuthContext';
import { useUISettings } from '@/contexts/UISettingsContext';

interface Term { id: string; term: string; definition: string; }

interface MatchGameProps {
    onExit: () => void;
    terms?: Term[];
    focusMode?: boolean;
}

const GRID_SIZE = 8;
const CANDY_TYPES = [
    { color: 'bg-rose-500', icon: '💎', gradient: 'from-rose-400 to-rose-600', effect: 'fire' },
    { color: 'bg-blue-500', icon: '🌀', gradient: 'from-blue-400 to-blue-600', effect: 'water' },
    { color: 'bg-orange-500', icon: '⚡', gradient: 'from-orange-400 to-orange-600', effect: 'electric' },
    { color: 'bg-emerald-500', icon: '🌿', gradient: 'from-emerald-400 to-emerald-600', effect: 'nature' },
    { color: 'bg-purple-500', icon: '🔮', gradient: 'from-purple-400 to-purple-600', effect: 'void' },
    { color: 'bg-yellow-500', icon: '☀️', gradient: 'from-yellow-400 to-yellow-600', effect: 'light' },
];

type Candy = {
    id: string;
    typeIdx: number;
    color: string;
    icon: string;
    gradient: string;
    isSpecial?: boolean;
    scale?: number;
};

export default function Match3({ onExit, terms = [], focusMode }: MatchGameProps) {
    const { updateXP } = useAuth();
    const { settings } = useUISettings();
    const [grid, setGrid] = useState<(Candy | null)[][]>([]);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [combo, setCombo] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [energy, setEnergy] = useState(100);

    const translations = {
        nl: {
            level: "Niveau",
            energy: "Energie",
            mastery: "Beheersing Voortgang",
            abort: "Missie Afbreken",
            score: "Score",
            best: "Beste",
            strategy: "Strategie",
            tip1: "Maak matches van 4 voor Elemental Bursts.",
            tip2: "Juiste antwoorden tijdens Combo Fasen geven XP multipliers.",
            combo: "Combo Multiplier",
            synapticBurst: "Synaptische Burst!",
            syncBonus: "Kennis synchroniseren voor bonuspunten",
            identify: "Identificeer definitie voor",
            gameTitle: "Elemental Match"
        },
        en: {
            level: "Level",
            energy: "Energy",
            mastery: "Mastery Progress",
            abort: "Abort Mission",
            score: "Score",
            best: "Best",
            strategy: "Strategy",
            tip1: "Create matches of 4 to unlock Elemental Bursts.",
            tip2: "Correct answers during Combo Phases grant massive XP multipliers.",
            combo: "Combo Multiplier",
            synapticBurst: "Synaptic Burst!",
            syncBonus: "Syncing Knowledge for Bonus Points",
            identify: "Identify Definition For",
            gameTitle: "Elemental Match"
        },
        de: {
            level: "Ebene",
            energy: "Energie",
            mastery: "Meisterschaftsfortschritt",
            abort: "Mission Abbrechen",
            score: "Punktestand",
            best: "Bestleistung",
            strategy: "Strategie",
            tip1: "Erstellen Sie 4er-Matches für Elemental Bursts.",
            tip2: "Richtige Antworten während Combo-Phasen geben XP-Multiplikatoren.",
            combo: "Combo-Multiplikator",
            synapticBurst: "Synaptischer Burst!",
            syncBonus: "Wissen synchronisieren für Bonuspunkte",
            identify: "Definition identifizieren für",
            gameTitle: "Elemental Match"
        },
        fr: {
            level: "Niveau",
            energy: "Énergie",
            mastery: "Progrès de Maîtrise",
            abort: "Abandonner la Mission",
            score: "Score",
            best: "Meilleur",
            strategy: "Stratégie",
            tip1: "Créez des matchs de 4 pour les Bursts Élémentaires.",
            tip2: "Les bonnes réponses pendant les phases Combo donnent des multiplicateurs d'XP.",
            combo: "Multiplicateur Combo",
            synapticBurst: "Rafale Synaptique !",
            syncBonus: "Synchronisation des connaissances pour points bonus",
            identify: "Identifier la définition pour",
            gameTitle: "Match Élémentaire"
        },
        es: {
            level: "Nivel",
            energy: "Energía",
            mastery: "Progreso de Maestría",
            abort: "Abortar Misión",
            score: "Puntuación",
            best: "Mejor",
            strategy: "Estrategia",
            tip1: "Crea combinaciones de 4 para Bursts Elementales.",
            tip2: "Respuestas correctas en fases Combo dan multiplicadores de XP.",
            combo: "Multiplicador Combo",
            synapticBurst: "¡Ráfaga Sináptica!",
            syncBonus: "Sincronizando conocimiento para puntos extra",
            identify: "Identificar definición para",
            gameTitle: "Fósforo Elemental"
        }
    };

    const t = translations[settings.language as keyof typeof translations] || translations.en;

    // Quiz state
    const [showQuiz, setShowQuiz] = useState(false);
    const [currentTerm, setCurrentTerm] = useState<Term | null>(null);
    const [options, setOptions] = useState<string[]>([]);
    const [pendingCombo, setPendingCombo] = useState(0);

    const createCandy = useCallback((r: number, c: number) => {
        const typeIdx = Math.floor(Math.random() * CANDY_TYPES.length);
        return {
            id: `${r}-${c}-${Math.random()}`,
            typeIdx,
            ...CANDY_TYPES[typeIdx],
            scale: 1
        };
    }, []);

    const initGrid = useCallback(() => {
        let newGrid: (Candy | null)[][] = [];
        let hasInitialMatch = true;

        while (hasInitialMatch) {
            newGrid = Array(GRID_SIZE).fill(null).map((_, r) =>
                Array(GRID_SIZE).fill(null).map((_, c) => createCandy(r, c))
            );
            hasInitialMatch = findMatches(newGrid).length > 0;
        }
        setGrid(newGrid);
        setScore(0);
        setLevel(1);
        setEnergy(100);
    }, [createCandy]);

    useEffect(() => {
        const saved = localStorage.getItem('match3_highscore');
        if (saved) setHighScore(parseInt(saved));
        initGrid();
    }, [initGrid]);

    const findMatches = (currentGrid: (Candy | null)[][]) => {
        const matches = new Set<string>();

        // Horizontal
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE - 2; c++) {
                const type = currentGrid[r][c]?.typeIdx;
                if (type !== undefined && currentGrid[r][c + 1]?.typeIdx === type && currentGrid[r][c + 2]?.typeIdx === type) {
                    matches.add(`${r}-${c}`);
                    matches.add(`${r}-${c + 1}`);
                    matches.add(`${r}-${c + 2}`);
                    let nextC = c + 3;
                    while (nextC < GRID_SIZE && currentGrid[r][nextC]?.typeIdx === type) {
                        matches.add(`${r}-${nextC}`);
                        nextC++;
                    }
                }
            }
        }

        // Vertical
        for (let c = 0; c < GRID_SIZE; c++) {
            for (let r = 0; r < GRID_SIZE - 2; r++) {
                const type = currentGrid[r][c]?.typeIdx;
                if (type !== undefined && currentGrid[r + 1][c]?.typeIdx === type && currentGrid[r + 2][c]?.typeIdx === type) {
                    matches.add(`${r}-${c}`);
                    matches.add(`${r + 1}-${c}`);
                    matches.add(`${r + 2}-${c}`);
                    let nextR = r + 3;
                    while (nextR < GRID_SIZE && currentGrid[nextR][c]?.typeIdx === type) {
                        matches.add(`${nextR}-${c}`);
                        nextR++;
                    }
                }
            }
        }

        return Array.from(matches).map(m => {
            const [r, c] = m.split('-').map(Number);
            return { r, c };
        });
    };

    const triggerQuiz = (comboSize: number) => {
        if (terms.length < 4) return;
        const randomTerm = terms[Math.floor(Math.random() * terms.length)];
        const wrongOptions = terms
            .filter(t => t.id !== randomTerm.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(t => t.definition);

        setCurrentTerm(randomTerm);
        setOptions([randomTerm.definition, ...wrongOptions].sort(() => Math.random() - 0.5));
        setPendingCombo(comboSize);
        setShowQuiz(true);
    };

    const processMatches = useCallback(async (currentGrid: (Candy | null)[][], combo = 0) => {
        const matches = findMatches(currentGrid);
        if (matches.length === 0) {
            setIsProcessing(false);
            return;
        }

        setIsProcessing(true);
        const newGrid = currentGrid.map(row => [...row]);
        matches.forEach(({ r, c }) => { newGrid[r][c] = null; });

        setGrid([...newGrid]);
        const addedScore = matches.length * 10 * (combo + 1);
        setScore(s => s + addedScore);

        // Award XP for significant matches/combos
        if (matches.length >= 5) {
            updateXP(5, `Match 3 - Big Combo! (${matches.length} items)`);
        } else if (score + addedScore > 0 && (score + addedScore) % 500 === 0) {
            updateXP(10, `Match 3 - Milestone reached: ${score + addedScore}`);
        }

        if (matches.length >= 4 && terms.length >= 4) {
            setTimeout(() => triggerQuiz(matches.length), 500);
        }

        await new Promise(resolve => setTimeout(resolve, 300));

        // Let candies fall
        for (let c = 0; c < GRID_SIZE; c++) {
            let emptySpaces = 0;
            for (let r = GRID_SIZE - 1; r >= 0; r--) {
                if (newGrid[r][c] === null) {
                    emptySpaces++;
                } else if (emptySpaces > 0) {
                    newGrid[r + emptySpaces][c] = newGrid[r][c];
                    newGrid[r][c] = null;
                }
            }
            for (let r = 0; r < emptySpaces; r++) {
                newGrid[r][c] = createCandy(r, c);
            }
        }

        setGrid([...newGrid]);
        setTimeout(() => processMatches(newGrid, combo + 1), 300);
    }, [createCandy, terms.length]);

    const swap = async (r1: number, c1: number, r2: number, c2: number) => {
        const newGrid = grid.map(row => [...row]);
        const temp = newGrid[r1][c1];
        newGrid[r1][c1] = newGrid[r2][c2];
        newGrid[r2][c2] = temp;

        setGrid([...newGrid]);

        const matches = findMatches(newGrid);
        if (matches.length > 0) {
            processMatches(newGrid);
        } else {
            // Swap back if no matches
            await new Promise(resolve => setTimeout(resolve, 300));
            newGrid[r2][c2] = newGrid[r1][c1];
            newGrid[r1][c1] = temp;
            setGrid([...newGrid]);
        }
    };

    const handleClick = (r: number, c: number) => {
        if (isProcessing || showQuiz) return;
        if (!selected) {
            setSelected({ r, c });
        } else {
            const dr = Math.abs(r - selected.r);
            const dc = Math.abs(c - selected.c);
            if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
                swap(selected.r, selected.c, r, c);
                setSelected(null);
            } else {
                setSelected({ r, c });
            }
        }
    };

    const handleQuizAnswer = (answer: string) => {
        if (answer === currentTerm?.definition) {
            setScore(s => s + (pendingCombo * 50));
            updateXP(15, `Match 3 - Concept Combo Mastery!`);
            confetti({ particleCount: 100, spread: 70 });
        }
        setShowQuiz(false);
    };

    return (
        <div className="flex flex-col items-center p-4 w-full max-w-6xl mx-auto lg:flex-row lg:items-start lg:gap-12 overflow-hidden min-h-[800px]">
            {/* Left Panel: Stats & Level */}
            <div className="w-full lg:w-72 space-y-6 order-2 lg:order-1 mt-8 lg:mt-0">
                <div className="glass-card p-6 rounded-[2.5rem] border border-white/5 bg-slate-900/40 backdrop-blur-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] mb-1">{t.level}</p>
                            <p className="text-4xl font-black text-white">{level}</p>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-2xl">
                            <Zap className="w-6 h-6 text-blue-400" />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <span>{t.energy}</span>
                            <span>{Math.round(energy)}%</span>
                        </div>
                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                            <div 
                                className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 transition-all duration-500"
                                style={{ width: `${energy}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-[2.5rem] border border-white/5 bg-slate-900/40">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4">{t.mastery}</p>
                    <div className="grid grid-cols-4 gap-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className={`aspect-square rounded-xl border flex items-center justify-center transition-all ${
                                i < Math.floor(score / 1000) 
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                                : 'bg-white/5 border-white/5 text-slate-700'
                            }`}>
                                <Star className={`w-4 h-4 ${i < Math.floor(score / 1000) ? 'fill-current' : ''}`} />
                            </div>
                        ))}
                    </div>
                </div>

                <button onClick={onExit} className="w-full py-5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-[1.5rem] transition-all font-black text-xs tracking-[0.2em] uppercase border border-red-500/20 active:scale-95">
                    {t.abort}
                </button>
            </div>

            {/* Middle: Game Board */}
            <div className="flex-1 w-full max-w-[500px] order-1 lg:order-2">
                <div className="w-full flex justify-between items-center mb-8 bg-slate-900/60 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-3xl shadow-2xl">
                    <div className="flex gap-10">
                        <div className="flex flex-col">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">{t.score}</p>
                            <p className="text-4xl font-black text-white tabular-nums">{score}</p>
                        </div>
                        <div className="flex flex-col">
                            <p className="text-[10px] text-yellow-500 font-black uppercase tracking-[0.2em] mb-1">{t.best}</p>
                            <p className="text-4xl font-black text-white tabular-nums opacity-50">{highScore}</p>
                        </div>
                    </div>
                    <button onClick={initGrid} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 group">
                        <RefreshCw className="w-6 h-6 text-slate-400 group-hover:text-white group-hover:rotate-180 transition-all duration-700" />
                    </button>
                </div>

                <div
                    className="bg-slate-950/80 p-4 rounded-[3rem] border-8 border-slate-900 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden"
                    style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gap: '8px' }}
                >
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-5 pointer-events-none">
                        {Array.from({ length: 64 }).map((_, i) => (
                            <div key={i} className="border border-white" />
                        ))}
                    </div>

                    {grid.map((row, r) =>
                        row.map((candy, c) => {
                            const isSelected = selected?.r === r && selected?.c === c;
                            return (
                                <button
                                    key={candy?.id || `${r}-${c}`}
                                    onClick={() => handleClick(r, c)}
                                    className={`
                                        aspect-square rounded-2xl transition-all duration-500 relative group
                                        ${candy ? `bg-gradient-to-br ${candy.gradient} shadow-2xl` : 'bg-transparent'}
                                        ${isSelected ? 'scale-110 ring-4 ring-white ring-offset-8 ring-offset-slate-950 z-20 shadow-[0_0_30px_rgba(255,255,255,0.3)]' : 'hover:scale-105 active:scale-90'}
                                    `}
                                >
                                    {candy && (
                                        <div className="w-full h-full flex items-center justify-center text-3xl transform group-hover:scale-110 transition-transform duration-300 select-none">
                                            {candy.icon}
                                            {/* Glossy Overlay */}
                                            <div className="absolute inset-2 bg-gradient-to-tr from-white/20 to-transparent rounded-xl opacity-40 mix-blend-overlay" />
                                            {/* Sparkle Effect */}
                                            <div className="absolute top-2 left-2 w-2 h-2 bg-white rounded-full blur-[1px] opacity-60 animate-pulse" />
                                        </div>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Right Panel: Tips & Combo */}
            <div className="w-full lg:w-72 space-y-6 order-3 mt-8 lg:mt-0">
                <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-blue-600/10 to-transparent">
                    <div className="flex items-center gap-4 mb-6 text-blue-400">
                        <Sparkles className="w-8 h-8" />
                        <h3 className="font-black text-sm uppercase tracking-[0.2em]">{t.strategy}</h3>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed font-bold">
                        {t.tip1}
                        <br/><br/>
                        {t.tip2}
                    </p>
                </div>

                <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-xl">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-6">{t.combo}</p>
                    <div className="flex flex-col items-center gap-4">
                        <div className="text-6xl font-black text-white italic tracking-tighter">x{combo > 1 ? combo : 1}</div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full bg-blue-500 transition-all duration-300 ${combo > 0 ? 'opacity-100' : 'opacity-0'}`} style={{ width: `${Math.min(combo * 20, 100)}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quiz Modal: Professionalized */}
            {showQuiz && (
                <div className="fixed inset-0 bg-[#0a0f1e]/95 backdrop-blur-3xl flex items-center justify-center z-[200] p-6 animate-in fade-in duration-500">
                    <div className="bg-slate-900 max-w-xl w-full rounded-[3.5rem] border border-white/10 shadow-[0_0_120px_rgba(59,130,246,0.15)] overflow-hidden relative">
                        {/* Modal Header */}
                        <div className="bg-blue-600 p-10 flex items-center gap-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                            <div className="p-6 bg-white/20 rounded-[2rem] backdrop-blur-xl relative z-10">
                                <Brain className="w-10 h-10 text-white" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">{t.synapticBurst}</h3>
                                <p className="text-blue-100 font-bold text-xs uppercase tracking-widest opacity-80">{t.syncBonus}</p>
                            </div>
                        </div>

                        <div className="p-12 space-y-10">
                            <div className="text-center space-y-4">
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">{t.identify}</p>
                                <p className="text-4xl font-black text-white bg-white/5 py-10 px-6 rounded-[2.5rem] border border-white/5 shadow-inner italic">
                                    "{currentTerm?.term}"
                                </p>
                            </div>

                            <div className="grid gap-4">
                                {options.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleQuizAnswer(opt)}
                                        className="w-full p-6 rounded-[1.8rem] bg-slate-800 border-2 border-transparent text-slate-300 hover:bg-slate-700 hover:border-blue-500/50 hover:text-white transition-all text-left group flex items-center justify-between shadow-lg"
                                    >
                                        <span className="font-bold text-lg group-hover:translate-x-2 transition-transform duration-300 pr-8">{opt}</span>
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                                            <Check className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
