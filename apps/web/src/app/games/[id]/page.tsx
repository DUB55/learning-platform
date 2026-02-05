'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, Suspense } from 'react';
import { Maximize2, Focus, X, BookOpen, Sparkles, Loader2, ArrowLeft, Gamepad2, Trophy, Clock, Info } from 'lucide-react';
import dynamic from 'next/dynamic';
import LearningSetSelectorModal from '@/components/games/LearningSetSelectorModal';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
const Minesweeper = dynamic(() => import('@/components/games/Minesweeper'), { ssr: false });
const NeonDash = dynamic(() => import('@/components/games/NeonDash'), { ssr: false });
const AimTrainer3D = dynamic(() => import('@/components/games/AimTrainer3D'), { ssr: false });
const StudySurfers = dynamic(() => import('@/components/games/StudySurfers'), { ssr: false });
const ClassicMario = dynamic(() => import('@/components/games/ClassicMario'), { ssr: false });
const BlockBlast = dynamic(() => import('@/components/games/BlockBlast'), { ssr: false });
const CrossyRoad = dynamic(() => import('@/components/games/CrossyRoad'), { ssr: false });
const FlappyBird = dynamic(() => import('@/components/games/FlappyBird'), { ssr: false });
const Match3 = dynamic(() => import('@/components/games/Match3'), { ssr: false });
const MeteorStrike = dynamic(() => import('@/components/games/MeteorStrike'), { ssr: false });
const NeonSnake = dynamic(() => import('@/components/games/NeonSnake'), { ssr: false });
const BlockDrop = dynamic(() => import('@/components/games/BlockDrop'), { ssr: false });
const LogicGrid = dynamic(() => import('@/components/games/LogicGrid'), { ssr: false });
const CloudJump = dynamic(() => import('@/components/games/CloudJump'), { ssr: false });
const WordScramble = dynamic(() => import('@/components/games/WordScramble'), { ssr: false });
const MemoryMatch = dynamic(() => import('@/components/games/MemoryMatch'), { ssr: false });
const MathSprint = dynamic(() => import('@/components/games/MathSprint'), { ssr: false });
const StudyCity3D = dynamic(() => import('@/components/games/StudyCity3D'), { ssr: false });
const BattleTactics = dynamic(() => import('@/components/games/BattleTactics'), { ssr: false });
const CityBuilder = dynamic(() => import('@/components/games/CityBuilder'), { ssr: false });
const RetroRacer = dynamic(() => import('@/components/games/RetroRacer'), { ssr: false });
const TacticalBreach = dynamic(() => import('@/components/games/TacticalBreach'), { ssr: false });
const Puzzle2048 = dynamic(() => import('@/components/games/Puzzle2048'), { ssr: false });

const GAME_COMPONENTS: Record<string, React.ComponentType<any>> = {
    'minesweeper': Minesweeper,
    'neon-dash': NeonDash,
    'csgo': AimTrainer3D,
    'subway-surfers': StudySurfers,
    'mario': ClassicMario,
    'block-blast': BlockBlast,
    'crossy-road': CrossyRoad,
    'flappy-bird': FlappyBird,
    'match': Match3,
    'meteor': MeteorStrike,
    'snake': NeonSnake,
    'tetris': BlockDrop,
    'sudoku': LogicGrid,
    'cloud-jump': CloudJump,
    'word-scramble': WordScramble,
    'memory-match': MemoryMatch,
    'math-sprint': MathSprint,
    'study-city-3d': StudyCity3D,
    'battle-tactics': BattleTactics,
    'city-builder': CityBuilder,
    'retro-racer': RetroRacer,
    'tactical-breach': TacticalBreach,
    '2048': Puzzle2048,
};

const GAME_METADATA: Record<string, { title: string, description: string, category: string }> = {
    'study-city-3d': { title: '3D Study City', description: 'Roblox-style exploration. Enter buildings to solve AI-generated study quests.', category: 'study' },
    'cloud-jump': { title: 'Cloud Jump', description: 'Jump through the right clouds to answer questions and master your study material.', category: 'study' },
    'word-scramble': { title: 'Word Scramble', description: 'Unscramble terms from your learning set.', category: 'study' },
    'memory-match': { title: 'Memory Match', description: 'Match terms with their definitions.', category: 'study' },
    'math-sprint': { title: 'Math Sprint', description: 'Solve math problems as fast as you can.', category: 'study' },
    'minesweeper': { title: 'Minesweeper', description: 'Classic puzzle game. Clear the grid without detonating mines.', category: 'relax' },
    'neon-dash': { title: 'Neon Dash', description: 'Rhythm-based platformer. Jump over spikes to the beat.', category: 'relax' },
    'csgo': { title: 'Aim Trainer 3D', description: 'Train your reflexes and accuracy in this 3D simulation.', category: 'relax' },
    'subway-surfers': { title: 'Study Surfers', description: 'Fast-paced runner. Dodge obstacles and collect study boosters.', category: 'relax' },
    'mario': { title: 'Classic Mario', description: 'The ultimate platformer experience.', category: 'relax' },
    'block-blast': { title: 'Block Blast', description: 'Clear lines by placing blocks.', category: 'relax' },
    'crossy-road': { title: 'Crossy Road', description: 'Cross the road without getting hit.', category: 'relax' },
    'flappy-bird': { title: 'Flappy Bird', description: 'Fly through the pipes.', category: 'relax' },
    'match': { title: 'Match 3', description: 'Match three or more items.', category: 'relax' },
    'meteor': { title: 'Meteor Strike', description: 'Protect your base from falling meteors.', category: 'relax' },
    'snake': { title: 'Neon Snake', description: 'Classic snake with a modern neon twist.', category: 'relax' },
    'tetris': { title: 'Block Drop', description: 'Clear lines by dropping blocks.', category: 'relax' },
    'sudoku': { title: 'Logic Grid', description: 'A classic logic-based number puzzle.', category: 'relax' },
    'battle-tactics': { title: 'Battle Tactics', description: 'Strategy game with units and towers.', category: 'relax' },
    'city-builder': { title: 'City Builder', description: 'Build and manage your own city.', category: 'relax' },
    'retro-racer': { title: 'Retro Racer', description: '3D arcade racing experience.', category: 'relax' },
    'tactical-breach': { title: 'Tactical Breach', description: 'Tactical FPS simulation.', category: 'relax' },
    '2048': { title: '2048', description: 'Classic tile-merging puzzle game.', category: 'relax' },
};

export default function GamePage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const GameComponent = GAME_COMPONENTS[id];
    const metadata = GAME_METADATA[id];
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [selectedTerms, setSelectedTerms] = useState<any[]>([]);
    const [isLoadingContent, setIsLoadingContent] = useState(false);
    const [selectedSetName, setSelectedSetName] = useState<string | null>(null);

    const handleSetSelect = async (setId: string) => {
        setIsLoadingContent(true);
        setIsSelectorOpen(false);
        try {
            const { data: terms, error } = await supabase
                .from('learning_set_terms')
                .select('term, definition')
                .eq('learning_set_id', setId);

            if (error) throw error;

            setSelectedTerms(terms || []);
            const { data: setData } = await supabase
                .from('learning_sets')
                .select('title')
                .eq('id', setId)
                .single();

            setSelectedSetName(setData?.title || 'Learning Set');
            toast.success(`Loaded ${terms?.length} terms from "${setData?.title}"`);
        } catch (error) {
            console.error('Error loading terms:', error);
            toast.error('Failed to load learning set');
        } finally {
            // Simulate AI/Loading delay if needed for better UX
            setTimeout(() => setIsLoadingContent(false), 800);
        }
    };

    const generateAIContent = async () => {
        setIsLoadingContent(true);
        try {
            // In a real app, this would call an AI endpoint
            // For now, we simulate AI generation
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Mock AI generated content
            const mockTerms = [
                { term: 'Photosynthesis', definition: 'The process by which green plants and some other organisms use sunlight to synthesize foods with the help of chlorophyll pigments.' },
                { term: 'Mitochondria', definition: 'An organelle found in large numbers in most cells, in which the biochemical processes of respiration and energy production occur.' },
                { term: 'Cell Membrane', definition: 'The semipermeable membrane surrounding the cytoplasm of a cell.' }
            ];
            
            setSelectedTerms(mockTerms);
            setSelectedSetName('AI Generated Content');
            toast.success('AI content generated successfully!');
        } catch (error) {
            toast.error('Failed to generate AI content');
        } finally {
            setIsLoadingContent(false);
        }
    };

    useEffect(() => {
        const onFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isFocusMode) setIsFocusMode(false);
                if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isFocusMode]);

    const enterFullscreen = () => {
        const el = containerRef.current;
        if (!el) return;
        if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
    };

    const exitFullscreen = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
    };

    const toggleFocusMode = () => {
        setIsFocusMode((v) => !v);
    };

    if (!GameComponent) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-white p-8">
                <Gamepad2 className="w-16 h-16 text-slate-700 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Game Not Found</h1>
                <p className="text-slate-400 mb-6">The game you are looking for does not exist or hasn't been implemented yet.</p>
                <button
                    onClick={() => router.push('/games')}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                >
                    Back to Arcade
                </button>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-[#0a0f1e] text-white">
            <div className="max-w-6xl mx-auto p-8">
                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => router.push('/games')}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black italic mb-1 uppercase tracking-tight">{metadata?.title || 'Game'}</h1>
                            <p className="text-slate-400 text-sm font-medium">{metadata?.description || 'Build your skills while having fun.'}</p>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <span className={`px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest ${
                            metadata?.category === 'study' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}>
                            {metadata?.category || 'RELAX'} MODE
                        </span>
                    </div>
                </header>

                {/* Game Container */}
                <div
                    ref={containerRef}
                    className={`glass-card overflow-hidden min-h-[700px] flex items-center justify-center relative bg-black/40 border-white/5 rounded-[2.5rem] shadow-2xl ${isFocusMode ? 'outline outline-4 outline-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.2)]' : ''}`}
                >
                    {isLoadingContent ? (
                        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full border-4 border-white/5"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
                                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-400 animate-pulse" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-white mb-1">Generating Study Content</h3>
                                <p className="text-slate-400 text-sm">AI is preparing your game material...</p>
                            </div>
                        </div>
                    ) : (
                        <Suspense
                            fallback={
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-16 h-16 relative">
                                        <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
                                        <div className="absolute inset-0 rounded-full border-4 border-t-white/40 animate-spin"></div>
                                    </div>
                                </div>
                            }
                        >
                            <GameComponent 
                                onExit={() => router.push('/games')} 
                                terms={selectedTerms} 
                                focusMode={isFocusMode} 
                            />
                        </Suspense>
                    )}

                    {/* Game UI Background Decorations */}
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>

                    {/* Controls */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
                        {metadata?.category === 'study' && (
                            <>
                                <button
                                    onClick={() => setIsSelectorOpen(true)}
                                    className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/20 backdrop-blur flex items-center gap-2 transition-all hover:scale-105"
                                    title="Select Learning Set"
                                >
                                    <BookOpen className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Learning Set</span>
                                </button>
                                <button
                                    onClick={generateAIContent}
                                    className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-xl border border-purple-500/20 backdrop-blur flex items-center gap-2 transition-all hover:scale-105"
                                    title="AI Generate Terms"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">AI Generate</span>
                                </button>
                            </>
                        )}
                        {selectedSetName && (
                            <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 backdrop-blur flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-bold text-slate-300 truncate max-w-[150px]">{selectedSetName}</span>
                            </div>
                        )}
                    </div>

                    <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                        {!isFullscreen ? (
                            <button
                                onClick={enterFullscreen}
                                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/10 backdrop-blur"
                                title="Enter fullscreen (Esc to exit)"
                            >
                                <Maximize2 className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={exitFullscreen}
                                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/10 backdrop-blur"
                                title="Exit fullscreen"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={toggleFocusMode}
                            className={`px-3 py-2 rounded-lg border border-white/10 backdrop-blur ${isFocusMode ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                            title="Toggle focus mode (Esc to exit)"
                        >
                            <Focus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Info Section */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-6 border border-white/5">
                        <div className="flex items-center gap-2 mb-4 text-blue-400">
                            <Info className="w-5 h-5" />
                            <h2 className="font-bold">How to Play</h2>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Use your mouse or keyboard controls to play. Each game is designed to help you maintain focus and improve cognitive skills during study breaks.
                        </p>
                    </div>
                    <div className="glass-card p-6 border border-white/5">
                        <div className="flex items-center gap-2 mb-4 text-purple-400">
                            <Trophy className="w-5 h-5" />
                            <h2 className="font-bold">Rewards</h2>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Completing levels or achieving high scores awards you XP that goes towards your overall level in the learning platform.
                        </p>
                    </div>
                </div>
            </div>

            <LearningSetSelectorModal 
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                onSelect={handleSetSelect}
                gameTitle={metadata?.title || 'Game'}
            />
        </div>
    );
}
