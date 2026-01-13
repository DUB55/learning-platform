'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Play, RotateCcw, Trophy, Volume2, VolumeX } from 'lucide-react';

export default function GeometryDashGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    // Game Constants
    const GRAVITY = 0.6;
    const JUMP_FORCE = -10;
    const SPEED_INITIAL = 5;
    const FLOOR_HEIGHT = 50;

    // Refs for game loop state (to avoid re-renders)
    const playerRef = useRef({ x: 100, y: 0, dy: 0, width: 30, height: 30, rotation: 0, grounded: false });
    const obstaclesRef = useRef<{ x: number, type: 'spike' | 'block', width: number, height: number, passed: boolean }[]>([]);
    const frameRef = useRef<number>(0);
    const scoreRef = useRef(0);
    const speedRef = useRef(SPEED_INITIAL);
    const particlesRef = useRef<{ x: number, y: number, vx: number, vy: number, life: number, color: string }[]>([]);

    useEffect(() => {
        // Load high score
        const saved = localStorage.getItem('geo_highscore');
        if (saved) setHighScore(parseInt(saved));
    }, []);

    // Game Loop
    const update = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear Screen
        ctx.fillStyle = '#0f172a'; // Match app bg
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid Background Effect
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        const offset = (scoreRef.current * 2) % gridSize;

        ctx.beginPath();
        for (let x = -offset; x < canvas.width; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();

        // Floor
        const floorY = canvas.height - FLOOR_HEIGHT;

        // Neon Floor Line
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f2ff';
        ctx.strokeStyle = '#00f2ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, floorY);
        ctx.lineTo(canvas.width, floorY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Player Physics
        const player = playerRef.current;
        player.dy += GRAVITY;
        player.y += player.dy;
        player.rotation += player.grounded ? 0 : 0.15; // Spin when jumping

        // Floor Collision
        if (player.y + player.height >= floorY) {
            player.y = floorY - player.height;
            player.dy = 0;
            player.grounded = true;

            // Snap rotation to nearest 90 deg when landing
            const snap = Math.round(player.rotation / (Math.PI / 2)) * (Math.PI / 2);
            player.rotation = snap;

            // Spawn running particles
            if (Math.random() > 0.5) {
                particlesRef.current.push({
                    x: player.x,
                    y: player.y + player.height,
                    vx: -SPEED_INITIAL * 0.5 - Math.random(),
                    vy: -Math.random() * 2,
                    life: 20,
                    color: '#00f2ff'
                });
            }
        } else {
            player.grounded = false;
        }

        // Generate Obstacles
        const obstacles = obstaclesRef.current;
        if (obstacles.length === 0 || canvas.width - obstacles[obstacles.length - 1].x > 300 + Math.random() * 200) {
            const type = Math.random() > 0.7 ? 'block' : 'spike';
            obstacles.push({
                x: canvas.width,
                type,
                width: 30,
                height: type === 'block' ? 40 : 30,
                passed: false
            });
        }

        // Update Obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            obs.x -= speedRef.current;

            // Draw Obstacle
            ctx.shadowBlur = 15;
            if (obs.type === 'spike') {
                ctx.fillStyle = '#ff0055';
                ctx.shadowColor = '#ff0055';
                ctx.beginPath();
                ctx.moveTo(obs.x, floorY);
                ctx.lineTo(obs.x + obs.width / 2, floorY - obs.height);
                ctx.lineTo(obs.x + obs.width, floorY);
                ctx.fill();
            } else {
                ctx.fillStyle = '#ae00ff';
                ctx.shadowColor = '#ae00ff';
                ctx.fillRect(obs.x, floorY - obs.height, obs.width, obs.height);
            }
            ctx.shadowBlur = 0;

            // Collision Detection
            // Simple AABB (Axis-Aligned Bounding Box) mostly, but slightly forgiving
            const buffer = 5;
            const playerLeft = player.x + buffer;
            const playerRight = player.x + player.width - buffer;
            const playerTop = player.y + buffer;
            const playerBottom = player.y + player.height - buffer;

            let obsLeft, obsRight, obsTop, obsBottom;

            if (obs.type === 'spike') {
                // Triangle hitbox approximation (smaller box at bottom center)
                obsLeft = obs.x + 10;
                obsRight = obs.x + obs.width - 10;
                obsTop = floorY - obs.height + 10;
                obsBottom = floorY;
            } else {
                obsLeft = obs.x;
                obsRight = obs.x + obs.width;
                obsTop = floorY - obs.height;
                obsBottom = floorY;
            }

            if (playerRight > obsLeft && playerLeft < obsRight && playerBottom > obsTop && playerTop < obsBottom) {
                gameOver();
                return;
            }

            // Score Logic
            if (!obs.passed && playerLeft > obsRight) {
                obs.passed = true;
                scoreRef.current += 1;
                setScore(scoreRef.current);

                // Increase speed slightly
                if (scoreRef.current % 5 === 0) speedRef.current += 0.2;
            }

            // Remove off-screen
            if (obs.x + obs.width < 0) {
                obstacles.splice(i, 1);
            }
        }

        // Draw Player
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        ctx.rotate(player.rotation);
        ctx.fillStyle = '#00f2ff';
        ctx.shadowColor = '#00f2ff';
        ctx.shadowBlur = 20;
        ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);

        // Inner square
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-player.width / 4, -player.height / 4, player.width / 2, player.height / 2);

        ctx.restore();

        // Update & Draw Particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const p = particlesRef.current[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;

            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 20;
            ctx.fillRect(p.x, p.y, 4, 4);
            ctx.globalAlpha = 1;

            if (p.life <= 0) particlesRef.current.splice(i, 1);
        }

    }, []);

    const gameOver = () => {
        setGameState('gameover');
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
        if (scoreRef.current > highScore) {
            setHighScore(scoreRef.current);
            localStorage.setItem('geo_highscore', scoreRef.current.toString());
        }
    };

    // START GAME Handlers
    const startGame = () => {
        setGameState('playing');
        scoreRef.current = 0;
        setScore(0);
        speedRef.current = SPEED_INITIAL;
        playerRef.current = { x: 100, y: 0, dy: 0, width: 30, height: 30, rotation: 0, grounded: false };
        obstaclesRef.current = [];
        particlesRef.current = [];
        // Loop will be started by useEffect
    };

    // Game Loop Effect
    useEffect(() => {
        if (gameState !== 'playing') {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            return;
        }

        const animate = () => {
            update();
            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);

        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, [gameState, update]);

    const jump = useCallback(() => {
        // console.log('Jump!'); // Debug
        if (gameState !== 'playing') return;

        const player = playerRef.current;
        if (player.grounded) {
            player.dy = JUMP_FORCE;
            player.grounded = false;
            // ... particles
        }
    }, [gameState]);

    // Input Handling
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Debug key
            // console.log('Key:', e.code);
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === ' ') {
                e.preventDefault();
                if (gameState === 'start' || gameState === 'gameover') startGame();
                else jump();
            }
        };

        const handleTouchStart = (e: TouchEvent) => {
            // e.preventDefault(); // allow some touch for scrolling if needed, but here we want prompt response
            if (gameState === 'start' || gameState === 'gameover') startGame();
            else jump();
        };

        window.addEventListener('keydown', handleKeyDown);
        // Bind to canvas for touch
        const canvas = canvasRef.current;
        if (canvas) canvas.addEventListener('touchstart', handleTouchStart, { passive: false });

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (canvas) canvas.removeEventListener('touchstart', handleTouchStart);
        };
    }, [gameState, jump]);

    return (
        <div
            className="flex flex-col items-center justify-center min-h-[600px] w-full relative select-none outline-none"
            tabIndex={0}
            autoFocus
            onKeyDown={(e) => {
                if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === ' ') {
                    e.preventDefault();
                    if (gameState === 'start' || gameState === 'gameover') startGame();
                    else jump();
                }
            }}
        >
            {/* Game Canvas */}
            <canvas
                ref={canvasRef}
                width={800}
                height={400}
                className="rounded-xl border border-white/10 shadow-2xl bg-[#0f172a] max-w-full cursor-pointer"
                onClick={(e) => {
                    // Click handler for mouse users
                    if (gameState === 'start' || gameState === 'gameover') startGame();
                    else jump();
                }}
            />

            {/* Mobile Jump Button (Visible on all devices for clarity) */}
            <button
                className="mt-6 px-8 py-4 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-2xl w-full max-w-xs flex items-center justify-center gap-3 border border-white/10"
                onClick={(e) => {
                    e.stopPropagation();
                    if (gameState === 'start' || gameState === 'gameover') startGame();
                    else jump();
                }}
            >
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    <Zap className="w-6 h-6 fill-current" />
                </div>
                <div className="text-left">
                    <div className="text-white font-bold">TAP TO JUMP</div>
                    <div className="text-xs text-slate-400">Spacebar or Click also works</div>
                </div>
            </button>

            {/* UI Overlay */}
            <div className="absolute top-4 right-4 flex gap-4">
                <div className="glass-card px-4 py-2 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="font-bold font-mono text-white text-lg">HI: {highScore}</span>
                </div>
                <div className="glass-card px-4 py-2 flex items-center gap-2">
                    <span className="font-bold font-mono text-white text-xl">{score}</span>
                </div>
            </div>

            {/* Start Screen */}
            {gameState === 'start' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm">
                    <Zap className="w-16 h-16 text-yellow-400 mb-4 animate-pulse" />
                    <h1 className="text-4xl font-bold text-white mb-2">NEON DASH</h1>
                    <p className="text-slate-300 mb-8 animate-pulse">Press Space or Tap to Start</p>
                    <button
                        onClick={(e) => { e.stopPropagation(); startGame(); }}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <Play className="w-5 h-5 fill-current" />
                        PLAY
                    </button>
                    <div className="mt-8 text-sm text-slate-500">
                        <kbd className="px-2 py-1 bg-white/10 rounded">SPACE</kbd> to Jump
                    </div>
                </div>
            )}

            {/* Game Over Screen */}
            {gameState === 'gameover' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl backdrop-blur-md">
                    <h2 className="text-5xl font-black text-red-500 mb-4 transform -rotate-2">CRASHED!</h2>
                    <div className="text-2xl font-bold text-white mb-8">Score: {score}</div>
                    <button
                        onClick={(e) => { e.stopPropagation(); startGame(); }}
                        className="px-8 py-3 bg-white text-black hover:bg-slate-200 rounded-full font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <RotateCcw className="w-5 h-5" />
                        RETRY
                    </button>
                </div>
            )}
        </div>
    );
}
