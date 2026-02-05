'use client';

import { useEffect, useRef, useState } from 'react';
import { User as UserIcon, Trophy, Skull, Coins, Heart } from 'lucide-react';

interface GameObject {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    properties: Record<string, any>;
}

interface GameDesign {
    title: string;
    objects: GameObject[];
    settings: {
        gravity: number;
        jumpForce: number;
        moveSpeed: number;
        backgroundColor: string;
        viewportWidth: number;
        viewportHeight: number;
    };
}

interface GameRendererProps {
    game: GameDesign;
    onExit: () => void;
}

export default function GameRenderer({ game, onExit }: GameRendererProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    
    // Physics State
    const playerRef = useRef<{ x: number, y: number, vx: number, vy: number, width: number, height: number, onGround: boolean } | null>(null);
    const keys = useRef<Record<string, boolean>>({});
    const objectsRef = useRef<GameObject[]>([]);

    useEffect(() => {
        const playerObj = game.objects.find(o => o.type === 'player');
        if (playerObj) {
            playerRef.current = {
                x: playerObj.x,
                y: playerObj.y,
                vx: 0,
                vy: 0,
                width: playerObj.width,
                height: playerObj.height,
                onGround: false
            };
        }
        objectsRef.current = game.objects.filter(o => o.type !== 'player');

        const handleKeyDown = (e: KeyboardEvent) => keys.current[e.code] = true;
        const handleKeyUp = (e: KeyboardEvent) => keys.current[e.code] = false;

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        let animationFrame: number;
        const update = () => {
            if (gameState !== 'playing' || !playerRef.current) return;

            const p = playerRef.current;
            const s = game.settings;

            // Horizontal Movement
            if (keys.current['ArrowLeft'] || keys.current['KeyA']) p.vx = -s.moveSpeed;
            else if (keys.current['ArrowRight'] || keys.current['KeyD']) p.vx = s.moveSpeed;
            else p.vx *= 0.8; // Friction

            // Vertical Movement (Gravity)
            p.vy += s.gravity;

            // Jump
            if ((keys.current['ArrowUp'] || keys.current['KeyW'] || keys.current['Space']) && p.onGround) {
                p.vy = -s.jumpForce;
                p.onGround = false;
            }

            // Apply Velocity
            p.x += p.vx;
            p.y += p.vy;

            // Collision Detection
            p.onGround = false;
            objectsRef.current.forEach(obj => {
                // Simple AABB Collision
                if (p.x < obj.x + obj.width &&
                    p.x + p.width > obj.x &&
                    p.y < obj.y + obj.height &&
                    p.y + p.height > obj.y) {
                    
                    if (obj.type === 'platform' || obj.properties.onCollision === 'solid') {
                        // Resolve collision (very basic)
                        if (p.vy > 0 && p.y + p.height - p.vy <= obj.y) {
                            p.y = obj.y - p.height;
                            p.vy = 0;
                            p.onGround = true;
                        } else if (p.vy < 0 && p.y - p.vy >= obj.y + obj.height) {
                            p.y = obj.y + obj.height;
                            p.vy = 0;
                        } else if (p.vx > 0) {
                            p.x = obj.x - p.width;
                        } else if (p.vx < 0) {
                            p.x = obj.x + obj.width;
                        }
                    } else if (obj.type === 'coin' || obj.properties.onCollision === 'collect') {
                        objectsRef.current = objectsRef.current.filter(o => o.id !== obj.id);
                        setScore(s => s + (obj.properties.value || 10));
                    } else if (obj.type === 'goal' || obj.properties.onCollision === 'win') {
                        setGameState('won');
                    } else if (obj.type === 'enemy' || obj.type === 'hazard' || obj.properties.onCollision === 'kill') {
                        setGameState('lost');
                    } else if (obj.properties.onCollision === 'damage') {
                        setLives(l => {
                            if (l <= 1) {
                                setGameState('lost');
                                return 0;
                            }
                            // Respawn
                            const startPos = game.objects.find(o => o.type === 'player');
                            if (startPos) {
                                p.x = startPos.x;
                                p.y = startPos.y;
                                p.vx = 0;
                                p.vy = 0;
                            }
                            return l - 1;
                        });
                        // Temporary invincibility or push back could go here
                    }
                }
            });

            // Bounds Check
            if (p.y > game.settings.viewportHeight) {
                setGameState('lost');
            }

            animationFrame = requestAnimationFrame(update);
        };

        animationFrame = requestAnimationFrame(update);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            cancelAnimationFrame(animationFrame);
        };
    }, [game, gameState]);

    return (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center backdrop-blur-md">
            <div className="relative flex flex-col gap-4">
                {/* HUD */}
                <div className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-xl">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                            <span className="font-black text-xl">{lives}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Coins className="w-5 h-5 text-yellow-500" />
                            <span className="font-black text-xl">{score}</span>
                        </div>
                    </div>
                    <div className="text-center flex-1">
                        <h2 className="font-black tracking-tighter italic text-xl">{game.title.toUpperCase()}</h2>
                    </div>
                    <button 
                        onClick={onExit}
                        className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all"
                    >
                        Exit Game
                    </button>
                </div>

                {/* Game Viewport */}
                <div 
                    className="relative overflow-hidden shadow-2xl rounded-2xl border-4 border-white/10"
                    style={{
                        width: game.settings.viewportWidth,
                        height: game.settings.viewportHeight,
                        backgroundColor: game.settings.backgroundColor,
                    }}
                >
                    {/* Render Player */}
                    {playerRef.current && (
                        <div 
                            className="absolute transition-all duration-75"
                            style={{
                                left: playerRef.current.x,
                                top: playerRef.current.y,
                                width: playerRef.current.width,
                                height: playerRef.current.height,
                                backgroundColor: game.objects.find(o => o.type === 'player')?.color || '#3b82f6',
                                borderRadius: '8px',
                            }}
                        >
                            <UserIcon className="w-full h-full p-1 opacity-50" />
                        </div>
                    )}

                    {/* Render Objects */}
                    {objectsRef.current.map(obj => (
                        <div 
                            key={obj.id}
                            className="absolute"
                            style={{
                                left: obj.x,
                                top: obj.y,
                                width: obj.width,
                                height: obj.height,
                                backgroundColor: obj.color,
                                borderRadius: obj.type === 'platform' ? '4px' : '8px',
                            }}
                        >
                            {obj.type === 'goal' && <Trophy className="w-full h-full p-1 opacity-50 text-black" />}
                            {obj.type === 'enemy' && <Skull className="w-full h-full p-1 opacity-50 text-white" />}
                            {obj.type === 'coin' && <Coins className="w-full h-full p-1 opacity-50 text-black" />}
                        </div>
                    ))}

                    {/* Overlay Screens */}
                    {gameState !== 'playing' && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${gameState === 'won' ? 'bg-green-500 shadow-[0_0_50px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)]'}`}>
                                {gameState === 'won' ? <Trophy className="w-12 h-12 text-white" /> : <Skull className="w-12 h-12 text-white" />}
                            </div>
                            <h2 className="text-5xl font-black italic tracking-tighter mb-2">
                                {gameState === 'won' ? 'LEVEL COMPLETE!' : 'GAME OVER'}
                            </h2>
                            <p className="text-slate-400 font-medium mb-8 text-lg">
                                {gameState === 'won' ? `You collected ${score} coins!` : 'Better luck next time, Admin.'}
                            </p>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => {
                                        setGameState('playing');
                                        setScore(0);
                                        setLives(3);
                                        const playerObj = game.objects.find(o => o.type === 'player');
                                        if (playerObj && playerRef.current) {
                                            playerRef.current.x = playerObj.x;
                                            playerRef.current.y = playerObj.y;
                                            playerRef.current.vx = 0;
                                            playerRef.current.vy = 0;
                                        }
                                        objectsRef.current = game.objects.filter(o => o.type !== 'player');
                                    }}
                                    className="px-8 py-3 bg-white text-black font-black rounded-2xl hover:scale-105 transition-transform"
                                >
                                    Try Again
                                </button>
                                <button 
                                    onClick={onExit}
                                    className="px-8 py-3 bg-white/10 text-white font-black rounded-2xl hover:bg-white/20 transition-all"
                                >
                                    Back to Editor
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="text-slate-500 text-xs font-bold text-center uppercase tracking-widest">
                    Controls: WASD or Arrows to Move & Jump
                </div>
            </div>
        </div>
    );
}
