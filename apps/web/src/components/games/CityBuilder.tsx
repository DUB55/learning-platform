'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Grid, Play, RotateCcw, Trophy, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const TILE_SIZE = 40;
const GRID_W = 20;
const GRID_H = 15;

type TileType = 'empty' | 'road' | 'house' | 'factory';
type Car = { id: number, x: number, y: number, path: { x: number, y: number }[], pathIndex: number, color: string };

export default function CityBuilder({ onExit, terms, focusMode }: { onExit?: () => void, terms?: any[], focusMode?: boolean } = {}) {
    const { updateXP } = useAuth();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [score, setScore] = useState(0);

    // Grid State
    const gridRef = useRef<TileType[][]>([]);
    const carsRef = useRef<Car[]>([]);
    const frameRef = useRef<number>(0);
    const lastSpawnTime = useRef(0);

    // Initialize Grid
    const initGrid = () => {
        const g: TileType[][] = [];
        for (let y = 0; y < GRID_H; y++) {
            const row: TileType[] = [];
            for (let x = 0; x < GRID_W; x++) {
                row.push('empty');
            }
            g.push(row);
        }
        // Spawn initial house and factory
        g[2][2] = 'house';
        g[12][18] = 'factory';
        gridRef.current = g;
        carsRef.current = [];
    };

    const startGame = () => {
        initGrid();
        setScore(0);
        setGameState('playing');
        lastSpawnTime.current = performance.now();
        draw(); // Initial draw
    };

    const findPath = (sx: number, sy: number, ex: number, ey: number): { x: number, y: number }[] | null => {
        // BFS
        const q = [{ x: sx, y: sy, path: [{ x: sx, y: sy }] }];
        const visited = new Set<string>();
        visited.add(`${sx},${sy}`);

        while (q.length > 0) {
            const curr = q.shift()!;
            if (curr.x === ex && curr.y === ey) return curr.path;

            const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            for (const [dx, dy] of dirs) {
                const nx = curr.x + dx;
                const ny = curr.y + dy;

                if (nx >= 0 && nx < GRID_W && ny >= 0 && ny < GRID_H) {
                    const cell = gridRef.current[ny][nx];
                    // Walkable if it's a road OR the destination (factory)
                    if ((cell === 'road' || (nx === ex && ny === ey)) && !visited.has(`${nx},${ny}`)) {
                        visited.add(`${nx},${ny}`);
                        q.push({ x: nx, y: ny, path: [...curr.path, { x: nx, y: ny }] });
                    }
                }
            }
        }
        return null;
    };

    const update = (time: number) => {
        if (gameState !== 'playing') return;

        // Spawn Cars check
        if (time - lastSpawnTime.current > 2000) { // Every 2s
            // Find all houses
            const houses: { x: number, y: number }[] = [];
            gridRef.current.forEach((row, y) => row.forEach((cell, x) => {
                if (cell === 'house') houses.push({ x, y });
            }));

            // Find factories
            const factories: { x: number, y: number }[] = [];
            gridRef.current.forEach((row, y) => row.forEach((cell, x) => {
                if (cell === 'factory') factories.push({ x, y });
            }));

            // Spawn car from random house to random factory
            if (houses.length && factories.length) {
                const house = houses[Math.floor(Math.random() * houses.length)];
                const factory = factories[Math.floor(Math.random() * factories.length)];

                const path = findPath(house.x, house.y, factory.x, factory.y);
                if (path && path.length > 1) {
                    carsRef.current.push({
                        id: Math.random(),
                        x: house.x,
                        y: house.y,
                        path: path,
                        pathIndex: 0,
                        color: '#ef4444' // Red car
                    });
                }
            }
            lastSpawnTime.current = time;
        }

        // Move Cars
        const moveSpeed = 0.05; // Tiles per frame
        carsRef.current.forEach((car, i) => {
            if (car.pathIndex < car.path.length - 1) {
                const nextNode = car.path[car.pathIndex + 1];
                const dx = nextNode.x - car.x;
                const dy = nextNode.y - car.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < moveSpeed) {
                    // Reached node
                    car.x = nextNode.x;
                    car.y = nextNode.y;
                    car.pathIndex++;
                } else {
                    // Move towards
                    car.x += (dx / dist) * moveSpeed;
                    car.y += (dy / dist) * moveSpeed;
                }
            } else {
                // Reached destination
                setScore(s => {
                    const newScore = s + 1;
                    // Award XP for every 10 deliveries
                    if (newScore % 10 === 0) {
                        updateXP(5, `City Builder - Delivered ${newScore} cars`);
                    }
                    return newScore;
                });
                carsRef.current.splice(i, 1);
            }
        });

        draw();
        frameRef.current = requestAnimationFrame(update);
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // BG
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid
        const grid = gridRef.current;
        for (let y = 0; y < GRID_H; y++) {
            for (let x = 0; x < GRID_W; x++) {
                const type = grid[y][x];
                const px = x * TILE_SIZE;
                const py = y * TILE_SIZE;

                // Border
                ctx.strokeStyle = '#334155';
                ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

                if (type === 'road') {
                    ctx.fillStyle = '#64748b';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                } else if (type === 'house') {
                    ctx.fillStyle = '#3b82f6';
                    ctx.fillRect(px + 5, py + 5, TILE_SIZE - 10, TILE_SIZE - 10);
                } else if (type === 'factory') {
                    ctx.fillStyle = '#ef4444';
                    ctx.beginPath();
                    ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE / 2 - 5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Cars
        carsRef.current.forEach(car => {
            ctx.fillStyle = car.color;
            ctx.beginPath();
            ctx.arc(car.x * TILE_SIZE + TILE_SIZE / 2, car.y * TILE_SIZE + TILE_SIZE / 2, 8, 0, Math.PI * 2);
            ctx.fill();
        });
    };

    useEffect(() => {
        if (gameState === 'playing') {
            frameRef.current = requestAnimationFrame(update);
        }
        return () => cancelAnimationFrame(frameRef.current);
    }, [gameState]);

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (gameState !== 'playing') return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
        const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);

        if (x >= 0 && x < GRID_W && y >= 0 && y < GRID_H) {
            const current = gridRef.current[y][x];
            if (current === 'empty') {
                // Build Road
                const newGrid = [...gridRef.current];
                newGrid[y][x] = 'road';
                gridRef.current = newGrid;
            } else if (current === 'road') {
                // Remove Road
                const newGrid = [...gridRef.current];
                newGrid[y][x] = 'empty';
                gridRef.current = newGrid;
            }
            draw();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[600px] w-full relative select-none">
            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="rounded-xl shadow-2xl bg-[#1e293b] cursor-pointer"
                onClick={handleCanvasClick}
            />

            {/* UI Overlay */}
            <div className="absolute top-4 right-4 flex gap-4 pointer-events-none">
                <div className="glass-card px-4 py-2 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <span className="font-bold text-white text-xl">{score}</span>
                </div>
            </div>

            {gameState === 'start' && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                    <Grid className="w-16 h-16 text-indigo-400 mb-4" />
                    <h1 className="text-4xl font-bold text-white mb-2">CITY FLOWS</h1>
                    <p className="text-slate-300 mb-8 max-w-sm text-center">Click to build roads. Connect Houses (Blue) to Factories (Red). Don't block the path!</p>
                    <button onClick={startGame} className="glass-button px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white font-bold flex gap-2 items-center">
                        <Play className="w-5 h-5 fill-current" /> START
                    </button>
                </div>
            )}
        </div>
    );
}
