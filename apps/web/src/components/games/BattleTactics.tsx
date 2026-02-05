'use client';

import { useState, useEffect, useRef } from 'react';
import { Crown, Zap, Shield, Sword, User, Clock, Heart, Trophy, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/* 
 * BATTLE TACTICS (Lite Clash Royale Clone)
 * Mechanics:
 * - 2 Lanes (Left/Right)
 * - Elixir management (Regenerates over time)
 * - Units have: Health, Damage, Speed, Range, Cost
 * - Towers: 2 Princess Towers, 1 King Tower per side (Simplified to 1 Main Tower vs 1 Enemy Tower for MVP)
 */

type UnitType = 'knight' | 'archer' | 'giant' | 'fireball';

interface Unit {
    id: string;
    type: UnitType;
    side: 'player' | 'enemy';
    lane: 'left' | 'right';
    hp: number;
    maxHp: number;
    x: number; // 0-100 progress (0 = player base, 100 = enemy base)
    state: 'walking' | 'attacking';
}

const UNIT_STATS: Record<UnitType, { cost: number, hp: number, dmg: number, speed: number, range: number, icon: any }> = {
    knight: { cost: 3, hp: 600, dmg: 50, speed: 0.5, range: 1, icon: Sword },
    archer: { cost: 3, hp: 200, dmg: 40, speed: 0.6, range: 20, icon: User }, // Range is percentage of lane
    giant: { cost: 5, hp: 2000, dmg: 100, speed: 0.2, range: 1, icon: Shield },
    fireball: { cost: 4, hp: 0, dmg: 500, speed: 5, range: 10, icon: Zap }, // Special
};

export default function BattleTactics({ onExit, terms, focusMode }: { onExit?: () => void, terms?: any[], focusMode?: boolean } = {}) {
    const { updateXP } = useAuth();
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [winner, setWinner] = useState<'player' | 'enemy' | null>(null);

    // State
    const [elixir, setElixir] = useState(5);
    const [units, setUnits] = useState<Unit[]>([]);
    const [towers, setTowers] = useState({
        player: { hp: 3000, maxHp: 3000 },
        enemy: { hp: 3000, maxHp: 3000 }
    });
    const [selectedCard, setSelectedCard] = useState<UnitType | null>(null);

    // Refs for Loop
    const unitsRef = useRef<Unit[]>([]);
    const frameRef = useRef<number>(0);
    const timeRef = useRef<number>(0);

    // Initial Elixir Loop
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState === 'playing') {
            interval = setInterval(() => {
                setElixir(prev => Math.min(prev + 1, 10));
            }, 2000); // 1 Elixir per 2s (simulated)
        }
        return () => clearInterval(interval);
    }, [gameState]);

    // Game Loop
    useEffect(() => {
        if (gameState !== 'playing') {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            return;
        }

        const update = () => {
            const currentUnits = [...unitsRef.current];
            let dirty = false;

            // 1. Move Units
            currentUnits.forEach(u => {
                if (u.type === 'fireball') {
                    // Fireball moves fast then explodes
                    u.x += (u.side === 'player' ? 1 : -1) * UNIT_STATS[u.type].speed;
                    if ((u.side === 'player' && u.x >= 90) || (u.side === 'enemy' && u.x <= 10)) {
                        // Explode logic would deal dmg then remove
                        u.hp = -1; // Mark for death
                    }
                    dirty = true;
                    return;
                }

                // Check collisions/combat
                // Simple logic: Find closest enemy in same lane
                const enemies = currentUnits.filter(e => e.lane === u.lane && e.side !== u.side);
                let target = null;
                let distToTarget = 999;

                // Check distance to enemy units
                enemies.forEach(e => {
                    const dist = Math.abs(u.x - e.x);
                    if (dist < distToTarget) {
                        distToTarget = dist;
                        target = e;
                    }
                });

                // Check distance to Tower
                const distToTower = u.side === 'player' ? (100 - u.x) : u.x;
                if (distToTower < distToTarget) {
                    distToTarget = distToTower;
                    target = 'tower';
                }

                const range = UNIT_STATS[u.type].range;

                if (distToTarget <= range) {
                    u.state = 'attacking';
                    // Deal damage (abstracted for 60fps, assume update runs constantly)
                    // We'll simplify: 1 hit per second? No, simplistic DPS for now
                    const dmg = UNIT_STATS[u.type].dmg / 60;

                    if (target === 'tower') {
                        if (u.side === 'player') {
                            setTowers(prev => {
                                const hp = Math.max(0, prev.enemy.hp - dmg);
                                if (hp <= 0 && gameState === 'playing') endGame('player');
                                return { ...prev, enemy: { ...prev.enemy, hp } };
                            });
                        } else {
                            setTowers(prev => {
                                const hp = Math.max(0, prev.player.hp - dmg);
                                if (hp <= 0 && gameState === 'playing') endGame('enemy');
                                return { ...prev, player: { ...prev.player, hp } };
                            });
                        }
                    } else if (typeof target === 'object' && target !== null) {
                        // Enemy unit
                        (target as Unit).hp -= dmg;
                    }
                } else {
                    u.state = 'walking';
                    u.x += (u.side === 'player' ? 1 : -1) * UNIT_STATS[u.type].speed * 0.5; // Walking speed
                    dirty = true;
                }
            });

            // 2. Spawn Enemy AI (Randomly)
            if (Math.random() < 0.005) { // ~Every 3 seconds
                const types: UnitType[] = ['knight', 'archer', 'giant'];
                const type = types[Math.floor(Math.random() * types.length)];
                if (true) { // TODO: Check enemy elixir
                    spawnUnit(type, 'enemy', Math.random() > 0.5 ? 'left' : 'right');
                }
            }

            // 3. Cleanup Dead
            const nextUnits = currentUnits.filter(u => u.hp > 0);
            if (nextUnits.length !== currentUnits.length || dirty) {
                unitsRef.current = nextUnits;
                setUnits([...nextUnits]);
            }

            frameRef.current = requestAnimationFrame(update);
        };

        frameRef.current = requestAnimationFrame(update);

        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, [gameState]);

    const spawnUnit = (type: UnitType, side: 'player' | 'enemy', lane: 'left' | 'right') => {
        const u = UNIT_STATS[type];

        // Check cost
        if (side === 'player') {
            if (elixir < u.cost) return;
            setElixir(prev => prev - u.cost);
        }

        const newUnit: Unit = {
            id: Math.random().toString(),
            type,
            side,
            lane,
            hp: u.hp,
            maxHp: u.hp,
            x: side === 'player' ? 10 : 90, // Spawn slightly ahead of tower
            state: 'walking'
        };

        unitsRef.current.push(newUnit);
        // Force render is handled by loop usually, but for instant feedback:
        setUnits([...unitsRef.current]);
    };

    const endGame = (winner: 'player' | 'enemy') => {
        setWinner(winner);
        setGameState('gameover');
        
        // Award XP
        if (winner === 'player') {
            updateXP(50, 'Battle Tactics - Victory');
        } else {
            updateXP(15, 'Battle Tactics - Defeat (Effort reward)');
        }
    };

    const UnitCard = ({ type }: { type: UnitType }) => {
        const stats = UNIT_STATS[type];
        const canAfford = elixir >= stats.cost;
        const Icon = stats.icon;

        return (
            <button
                disabled={!canAfford}
                onClick={() => setSelectedCard(selectedCard === type ? null : type)}
                className={`relative flex flex-col items-center p-2 rounded-xl transition-all border-2
                    ${selectedCard === type
                        ? 'bg-blue-600 border-yellow-400 -translate-y-2'
                        : canAfford
                            ? 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                            : 'bg-slate-800 border-slate-700 opacity-50 cursor-not-allowed'
                    }
                `}
            >
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-slate-900">
                    {stats.cost}
                </div>
                <Icon className={`w-8 h-8 mb-1 ${selectedCard === type ? 'text-white' : 'text-blue-200'}`} />
                <span className="text-[10px] font-bold uppercase text-slate-300">{type}</span>
            </button>
        );
    };

    const renderUnit = (unit: Unit) => {
        const isPlayer = unit.side === 'player';
        const Icon = UNIT_STATS[unit.type].icon;

        return (
            <div
                key={unit.id}
                className="absolute top-1/2 -translate-y-1/2 transition-transform duration-100 flex flex-col items-center"
                style={{
                    left: `${unit.x}%`,
                    zIndex: 10
                }}
            >
                {/* HP Bar */}
                <div className="w-8 h-1 bg-black mb-1 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${isPlayer ? 'bg-blue-500' : 'bg-red-500'}`}
                        style={{ width: `${(unit.hp / unit.maxHp) * 100}%` }}
                    />
                </div>

                {/* Unit Icon */}
                <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2
                        ${isPlayer ? 'bg-blue-600 border-blue-400' : 'bg-red-600 border-red-400'}
                    `}
                >
                    <Icon className="w-5 h-5 text-white" />
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto bg-slate-900/50 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
            {/* Header / Enemy Tower */}
            <div className="w-full bg-slate-950 p-4 flex flex-col items-center border-b border-slate-800 relative">
                <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-red-500" />
                    <span className="font-bold text-red-400 text-sm">ENEMY KING</span>
                </div>
                <div className="w-full max-w-[200px] h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                        className="h-full bg-red-500 transition-all duration-300"
                        style={{ width: `${(towers.enemy.hp / towers.enemy.maxHp) * 100}%` }}
                    />
                </div>
                <span className="text-xs text-slate-500 mt-1">{Math.floor(towers.enemy.hp)} HP</span>
            </div>

            {/* Arena */}
            <div className="w-full h-[400px] relative bg-[#1c4d26] bg-[url('/grass_pattern.png')] bg-repeat select-none">
                {/* River */}
                <div className="absolute top-1/2 left-0 right-0 h-8 bg-blue-500/50 -translate-y-1/2 flex items-center justify-center">
                    <div className="w-full h-1 bg-blue-400/30" />
                </div>

                {/* Bridges */}
                <div className="absolute top-1/2 left-[20%] w-12 h-16 bg-[#5c4033] -translate-y-1/2 rounded-sm border-x-4 border-[#3e2b22]" />
                <div className="absolute top-1/2 right-[20%] w-12 h-16 bg-[#5c4033] -translate-y-1/2 rounded-sm border-x-4 border-[#3e2b22]" />

                {/* Lanes */}
                <div className="absolute inset-0 flex">
                    {/* Left Lane Area (Click to spawn) */}
                    <div
                        className="flex-1 h-full relative border-r border-white/5 hover:bg-white/5 transition-colors cursor-crosshair"
                        onClick={() => selectedCard && spawnUnit(selectedCard, 'player', 'left')}
                    >
                        {units.filter(u => u.lane === 'left').map(renderUnit)}
                    </div>
                    {/* Right Lane Area (Click to spawn) */}
                    <div
                        className="flex-1 h-full relative hover:bg-white/5 transition-colors cursor-crosshair"
                        onClick={() => selectedCard && spawnUnit(selectedCard, 'player', 'right')}
                    >
                        {units.filter(u => u.lane === 'right').map(renderUnit)}
                    </div>
                </div>

                {/* Game Over Screen */}
                {gameState === 'gameover' && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center animate-in fade-in">
                        <Trophy className={`w-20 h-20 mb-4 ${winner === 'player' ? 'text-yellow-400' : 'text-slate-600'}`} />
                        <h2 className="text-4xl font-black text-white mb-2">{winner === 'player' ? 'VICTORY!' : 'DEFEAT'}</h2>
                        <button
                            onClick={() => {
                                setGameState('start');
                                setTowers({ player: { hp: 3000, maxHp: 3000 }, enemy: { hp: 3000, maxHp: 3000 } });
                                unitsRef.current = [];
                                setUnits([]);
                                setElixir(5);
                            }}
                            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-500"
                        >
                            Play Again
                        </button>
                    </div>
                )}
                {gameState === 'start' && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center animate-in fade-in backdrop-blur-sm">
                        <Sword className="w-16 h-16 text-blue-400 mb-4" />
                        <h1 className="text-3xl font-bold text-white mb-2">BATTLE TACTICS</h1>
                        <p className="text-slate-200 mb-8">Destroy the enemy tower.</p>
                        <button
                            onClick={() => {
                                setGameState('playing');
                                setElixir(5);
                            }}
                            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-500 shadow-lg hover:scale-105 transition-transform"
                        >
                            Start Battle
                        </button>
                    </div>
                )}
            </div>

            {/* Controls / Deck */}
            <div className="w-full bg-slate-950 p-4 border-t border-slate-800">
                {/* Player Tower HP */}
                <div className="flex flex-col items-center mb-4">
                    <div className="w-full max-w-[200px] h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                        <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${(towers.player.hp / towers.player.maxHp) * 100}%` }}
                        />
                    </div>
                    <span className="text-xs text-slate-500 mt-1">{Math.floor(towers.player.hp)} HP</span>
                </div>

                {/* Elixir Bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-xs font-bold text-purple-300 mb-1">
                        <span>ELIXIR</span>
                        <span>{elixir}/10</span>
                    </div>
                    <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                        <div
                            className="h-full bg-purple-500 transition-all duration-300"
                            style={{ width: `${(elixir / 10) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-4 gap-2">
                    <UnitCard type="knight" />
                    <UnitCard type="archer" />
                    <UnitCard type="giant" />
                    <UnitCard type="fireball" />
                </div>
            </div>
        </div>
    );
}
