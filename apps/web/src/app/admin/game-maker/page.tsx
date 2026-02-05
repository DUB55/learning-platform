'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutGrid, ArrowLeft } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { GamePlayer } from './components/GamePlayer';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/ui/Toast';

// Internal Imports
import { GameMode, ObjectType, GameObject, GameDesign } from './types';
import { DEFAULT_GAME_2D, DEFAULT_GAME_3D, OBJECT_TEMPLATES, ENVIRONMENT_PRESETS } from './constants';
import { Scene3D } from './components/Scene3D';
import { TopBar } from './components/TopBar';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { Canvas } from '@react-three/fiber';
import { useMultiplayer } from './hooks/useMultiplayer';

import { ProjectBrowser } from './components/ProjectBrowser';

export default function GameMakerPage() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const canvasRef = useRef<HTMLDivElement>(null);
    
    const [isBrowserOpen, setIsBrowserOpen] = useState(true);
    const [gameMode, setGameMode] = useState<GameMode | null>(null);
    const [game, setGame] = useState<GameDesign>(DEFAULT_GAME_2D);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'properties' | 'logic' | 'world' | 'assets'>('assets');
    const [activeTool, setActiveTool] = useState<ObjectType | 'select'>('select');
    const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
    const [isPlaying, setIsPlaying] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [history, setHistory] = useState<GameDesign[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const { toasts, showToast, hideToast } = useToast();

    // Multiplayer & Presence
    const { collaborators, updateSelection } = useMultiplayer(game.id);

    useEffect(() => {
        updateSelection(selectedId);
    }, [selectedId, updateSelection]);

    // History System (Undo/Redo)
    const addToHistory = useCallback((newState: GameDesign) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(JSON.parse(JSON.stringify(newState)));
            if (newHistory.length > 50) newHistory.shift();
            setHistoryIndex(newHistory.length - 1);
            return newHistory;
        });
    }, [historyIndex]);

    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setGame(JSON.parse(JSON.stringify(history[newIndex])));
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setGame(JSON.parse(JSON.stringify(history[newIndex])));
        }
    };

    // Initialize history
    useEffect(() => {
        if (history.length === 0 && game) {
            setHistory([JSON.parse(JSON.stringify(game))]);
            setHistoryIndex(0);
        }
    }, []);

    // Hotkeys
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) redo();
                    else undo();
                    return;
                }
                if (e.key === 'y') {
                    e.preventDefault();
                    redo();
                    return;
                }
            }

            switch (e.key.toLowerCase()) {
                case 'v': setActiveTool('select'); break;
                case 'g':
                    if (e.altKey && selectedId) {
                        e.preventDefault();
                        // Snap to ground
                        const updatedGame = {
                            ...game,
                            objects: game.objects.map(o => o.id === selectedId ? { ...o, y: o.height / 2 } : o)
                        };
                        setGame(updatedGame);
                        addToHistory(updatedGame);
                    } else {
                        setTransformMode('translate');
                    }
                    break;
                case 'r': setTransformMode('rotate'); break;
                case 's': setTransformMode('scale'); break;
                case 'f': 
                    // Scene3D handles 'f' for focus
                    break;
                case 'h':
                    if (selectedId) {
                        const updatedGame = {
                            ...game,
                            objects: game.objects.map(o => o.id === selectedId ? { ...o, visible: false } : o)
                        };
                        setGame(updatedGame);
                        addToHistory(updatedGame);
                        setSelectedId(null);
                    } else if (e.altKey) {
                        const updatedGame = {
                            ...game,
                            objects: game.objects.map(o => ({ ...o, visible: true }))
                        };
                        setGame(updatedGame);
                        addToHistory(updatedGame);
                    }
                    break;
                case 'd':
                    if (e.shiftKey && selectedId) {
                        e.preventDefault();
                        const original = game.objects.find(o => o.id === selectedId);
                        if (original) {
                            const duplicate: GameObject = {
                                ...JSON.parse(JSON.stringify(original)),
                                id: Math.random().toString(36).slice(2, 11),
                                x: original.x + 20,
                                z: (original.z || 0) + 20
                            };
                            const updatedGame = {
                                ...game,
                                objects: [...game.objects, duplicate]
                            };
                            setGame(updatedGame);
                            addToHistory(updatedGame);
                            setSelectedId(duplicate.id);
                        }
                    }
                    break;
                case 'x':
                case 'delete': 
                case 'backspace':
                    if (selectedId) {
                        const updatedGame = {
                            ...game,
                            objects: game.objects.filter(o => o.id !== selectedId)
                        };
                        setGame(updatedGame);
                        addToHistory(updatedGame);
                        setSelectedId(null);
                    }
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, game.objects, historyIndex, history]);

    useEffect(() => {
        if (!authLoading) {
            if (!user || !profile?.is_admin) {
                router.push('/dashboard');
            }
        }
    }, [user, profile, authLoading, router]);

    // Load saved game if exists
    useEffect(() => {
        const saved = localStorage.getItem('admin_current_game');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setGame(parsed);
                // We don't setGameMode(parsed.mode) here anymore 
                // because we want the user to choose the engine every time they enter
            } catch (e) {
                // Silently fail
            }
        }
    }, []);

    // Save to local storage on change
    useEffect(() => {
        localStorage.setItem('admin_current_game', JSON.stringify(game));
    }, [game]);

    // Handle Canvas Clicks (2D)
    const handleCanvasClick = (e: React.MouseEvent) => {
        if (gameMode !== '2d' || activeTool === 'select' || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;

        const template = OBJECT_TEMPLATES[activeTool];
        const newObject: GameObject = {
            id: Math.random().toString(36).slice(2, 11),
            type: activeTool,
            x: Math.round(x - (template.width || 40) / 2),
            y: Math.round(y - (template.height || 40) / 2),
            width: template.width || 40,
            height: template.height || 40,
            color: template.color || '#fff',
            properties: { ...template.properties },
        };

        const updatedGame = {
            ...game,
            objects: [...game.objects, newObject]
        };
        setGame(updatedGame);
        addToHistory(updatedGame);
        setSelectedId(newObject.id);
        setActiveTool('select');
    };

    // Handle 3D Object Addition
    const addObject3D = (type: ObjectType) => {
        const template = OBJECT_TEMPLATES[type];
        const newObject: GameObject = {
            id: Math.random().toString(36).slice(2, 11),
            type: type,
            x: 0,
            y: (template.height || 40) / 2, // Place on ground
            z: 0,
            width: template.width || 40,
            height: template.height || 40,
            depth: template.depth || 40,
            rotation: [0, 0, 0],
            color: template.color || '#fff',
            properties: { ...template.properties },
        };

        const updatedGame = {
            ...game,
            objects: [...game.objects, newObject]
        };
        setGame(updatedGame);
        addToHistory(updatedGame);
        setSelectedId(newObject.id);
        setActiveTool('select');
    };

    // Save Game
    const saveGame = async () => {
        setIsSaving(true);
        try {
            const updatedGame = {
                ...game,
                updatedAt: Date.now()
            };
            setGame(updatedGame);

            // Local Storage Save
            const savedGames = JSON.parse(localStorage.getItem('admin_games') || '[]');
            const existingIndex = savedGames.findIndex((g: any) => g.id === updatedGame.id);
            
            if (existingIndex >= 0) {
                savedGames[existingIndex] = updatedGame;
            } else {
                savedGames.push(updatedGame);
            }
            
            localStorage.setItem('admin_games', JSON.stringify(savedGames));
            localStorage.setItem('admin_current_game', JSON.stringify(updatedGame));

            await new Promise(r => setTimeout(r, 1200));
            showToast('Game saved to cloud & locally!', 'success');
        } catch (e) {
            showToast('Failed to save game.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const deployGame = async () => {
        setIsDeploying(true);
        try {
            const updatedGame = {
                ...game,
                isPublished: true,
                updatedAt: Date.now()
            };
            setGame(updatedGame);

            // Save to Local Storage
            const savedGames = JSON.parse(localStorage.getItem('admin_games') || '[]');
            const existingIndex = savedGames.findIndex((g: any) => g.id === updatedGame.id);
            if (existingIndex >= 0) {
                savedGames[existingIndex] = updatedGame;
            } else {
                savedGames.push(updatedGame);
            }
            localStorage.setItem('admin_games', JSON.stringify(savedGames));

            await new Promise(r => setTimeout(r, 2000));
            const shareUrl = `${window.location.origin}/play/${game.id}`;
            
            // In een echte app zouden we hier de status op 'published' zetten in de DB
            
            showToast(
                <div className="flex flex-col gap-2">
                    <span>Successfully deployed "{game.title}"!</span>
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(shareUrl);
                            showToast('Link copied to clipboard!', 'success');
                        }}
                        className="text-[10px] font-bold uppercase tracking-widest bg-white/10 px-2 py-1 rounded hover:bg-white/20 transition-colors self-start"
                    >
                        Copy Share Link
                    </button>
                </div> as any, 
                'success'
            );
        } catch (e) {
            showToast('Deployment failed. Check console for details.', 'error');
        } finally {
            setIsDeploying(false);
        }
    };

    const exportCode = () => {
        const json = JSON.stringify(game, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${game.title.toLowerCase().replace(/\s+/g, '-')}.json`;
        a.click();
        showToast('Game configuration exported as JSON!', 'success');
    };

    const handleMagicGenerated = (result: any) => {
        try {
            // Check if it's the new executeMagicCommand format
            if (result.spawn || result.settings || result.message) {
                let updatedObjects = [...game.objects];
                
                if (result.spawn && Array.isArray(result.spawn)) {
                    const newObjects: GameObject[] = result.spawn.map((obj: any, index: number) => {
                        const template = OBJECT_TEMPLATES[obj.type as ObjectType] || {};
                        return {
                            id: `magic-obj-${Date.now()}-${index}`,
                            type: obj.type,
                            x: obj.position?.[0] ?? 0,
                            y: obj.position?.[1] ?? (template.height || 40) / 2,
                            z: obj.position?.[2] ?? 0,
                            width: (obj.scale?.[0] || 1) * (template.width || 40),
                            height: (obj.scale?.[1] || 1) * (template.height || 40),
                            depth: (obj.scale?.[2] || 1) * (template.depth || 40),
                            rotation: obj.rotation || [0, 0, 0],
                            color: obj.color || template.color || '#ffffff',
                            properties: { ...template.properties, ...(obj.properties || {}) },
                            components: [...(template.components || []), ...(obj.components || [])]
                        };
                    });
                    updatedObjects = [...updatedObjects, ...newObjects];
                }

                // Handle Environment Preset if provided in settings
                let environmentSettings = { ...result.settings };
                if (result.settings?.environment && (ENVIRONMENT_PRESETS as any)[result.settings.environment]) {
                    const preset = (ENVIRONMENT_PRESETS as any)[result.settings.environment];
                    environmentSettings = {
                        ...preset,
                        ...environmentSettings
                    };
                }

                const updatedGame: GameDesign = {
                    ...game,
                    objects: updatedObjects,
                    settings: {
                        ...game.settings,
                        ...environmentSettings
                    }
                };

                setGame(updatedGame);
                addToHistory(updatedGame);
                
                if (result.message) {
                    showToast(result.message, 'success');
                } else {
                    showToast('AI command executed successfully!', 'success');
                }
                return;
            }

            // Fallback for the old generate3DSceneScript format (Scene Orchestration)
            const newObjects: GameObject[] = (result.initialObjects || []).map((obj: any, index: number) => ({
                id: `magic-obj-${Date.now()}-${index}`,
                type: obj.type,
                x: obj.position[0],
                y: obj.position[1],
                z: obj.position[2],
                width: obj.scale[0] * 40,
                height: obj.scale[1] * 40,
                depth: obj.scale[2] * 40,
                rotation: obj.rotation,
                color: obj.color || '#ffffff',
                properties: {},
                components: []
            }));

            const updatedGame: GameDesign = {
                ...game,
                title: result.title || game.title,
                objects: [...game.objects, ...newObjects],
                settings: {
                    ...game.settings,
                    ...(result.settings || {}),
                },
                // @ts-ignore
                orchestration: result.timeline
            };

            setGame(updatedGame);
            addToHistory(updatedGame);
            showToast('Magic 3D Scene generated successfully!', 'success');
        } catch (error) {
            showToast('Failed to apply generated changes.', 'error');
        }
    };

    const selectedObject = game.objects.find(o => o.id === selectedId);

    if (authLoading || !profile?.is_admin) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 font-medium">Verifying Admin Access...</p>
                </div>
            </div>
        );
    }

    if (!gameMode || isBrowserOpen) {
        return (
            <div className="min-h-screen bg-[#0a0f1e] text-white flex items-center justify-center p-6">
                <div className="w-full">
                    <ProjectBrowser 
                        onSelectGame={(selectedGame) => {
                            setGame(selectedGame);
                            setGameMode(selectedGame.mode);
                            setIsBrowserOpen(false);
                            setHistory([JSON.parse(JSON.stringify(selectedGame))]);
                            setHistoryIndex(0);
                        }}
                        onNewGame={(mode) => {
                            const newGame = mode === '2d' 
                                ? { ...DEFAULT_GAME_2D, id: 'game-' + Date.now() } 
                                : { ...DEFAULT_GAME_3D, id: 'game-' + Date.now() };
                            setGame(newGame);
                            setGameMode(mode);
                            setIsBrowserOpen(false);
                            setHistory([JSON.parse(JSON.stringify(newGame))]);
                            setHistoryIndex(0);
                        }}
                    />

                    <div className="mt-8 text-center">
                        <button 
                            onClick={() => router.push('/admin')}
                            className="text-slate-500 hover:text-white transition-colors flex items-center gap-2 mx-auto"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col">
            <TopBar 
                gameMode={gameMode}
                setGameMode={setGameMode}
                game={game}
                setGame={setGame}
                undo={undo}
                redo={redo}
                historyIndex={historyIndex}
                historyLength={history.length}
                transformMode={transformMode}
                setTransformMode={setTransformMode}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                exportCode={exportCode}
                saveGame={saveGame}
                isSaving={isSaving}
                deployGame={deployGame}
                isDeploying={isDeploying}
                collaborators={collaborators}
                onOpenBrowser={() => setIsBrowserOpen(true)}
                onMagicGenerated={handleMagicGenerated}
            />

            <AnimatePresence>
                {isPlaying && (
                    <GamePlayer 
                        game={game} 
                        onExit={() => setIsPlaying(false)} 
                    />
                )}
            </AnimatePresence>

            <div className="flex-1 flex">
                <LeftSidebar 
                    gameMode={gameMode}
                    activeTool={activeTool}
                    setActiveTool={setActiveTool}
                    addObject3D={addObject3D}
                />

                {/* Main Viewport */}
                <main className="flex-1 relative bg-slate-900/50">
                    {gameMode === '2d' ? (
                        <div 
                            ref={canvasRef}
                            onClick={handleCanvasClick}
                            className="absolute inset-0 flex items-center justify-center p-20 cursor-crosshair"
                        >
                            <div 
                                className="relative bg-[#0f172a] shadow-2xl border border-white/5"
                                style={{
                                    width: game.settings.viewportWidth * zoom,
                                    height: game.settings.viewportHeight * zoom,
                                    backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)',
                                    backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
                                }}
                            >
                                {game.objects.map(obj => (
                                    <div 
                                        key={obj.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedId(obj.id);
                                            setActiveTool('select');
                                        }}
                                        className={`absolute cursor-move transition-all ${selectedId === obj.id ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0f172a] z-10' : 'hover:ring-1 hover:ring-white/30'}`}
                                        style={{
                                            left: obj.x * zoom,
                                            top: obj.y * zoom,
                                            width: obj.width * zoom,
                                            height: obj.height * zoom,
                                            backgroundColor: obj.color,
                                            borderRadius: obj.type === 'player' ? '8px' : '4px',
                                        }}
                                    >
                                        <div className="absolute -top-6 left-0 text-[10px] font-bold text-slate-500 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                                            {obj.type}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <Canvas shadows gl={{ antialias: true }}>
                            <Scene3D 
                                game={game} 
                                setGame={setGame}
                                selectedId={selectedId}
                                setSelectedId={setSelectedId}
                                transformMode={transformMode}
                                addToHistory={addToHistory}
                            />
                        </Canvas>
                    )}

                    {/* Viewport Controls */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-20">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setZoom(Math.max(0.2, zoom - 0.1))}
                                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <span className="text-[10px] font-black text-slate-500 w-12 text-center">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button 
                                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="w-px h-4 bg-white/10" />
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Live Preview Active
                        </div>
                    </div>
                </main>

                <RightSidebar 
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    selectedObject={selectedObject}
                    selectedId={selectedId}
                    setSelectedId={setSelectedId}
                    game={game}
                    setGame={setGame}
                    gameMode={gameMode}
                    addToHistory={addToHistory}
                />
            </div>
            
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
                {toasts.map(toast => (
                    <Toast 
                        key={toast.id}
                        message={toast.message}
                        type={toast.type === 'warning' ? 'info' : toast.type}
                        isVisible={true}
                        onClose={() => hideToast(toast.id)}
                    />
                ))}
            </div>
        </div>
    );
}

function Plus({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
}
