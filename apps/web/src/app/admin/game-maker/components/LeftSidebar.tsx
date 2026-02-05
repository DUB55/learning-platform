'use client';

import React from 'react';
import { 
    MousePointer2, User as UserIcon, Box, Skull, Coins, Trophy, 
    User, Square, Zap, CircleDot, TreePine, Mountain, Home, 
    Building2, Car, Lightbulb, Menu, Target, Sun, Sparkles, 
    Cuboid as Cube, Flower2, Trees, Sprout, Waves, Droplets, 
    Armchair, Container, Archive
} from 'lucide-react';
import { GameMode, ObjectType } from '../types';
import { ToolButton } from './ToolButton';

interface LeftSidebarProps {
    gameMode: GameMode | null;
    activeTool: ObjectType | 'select';
    setActiveTool: (tool: ObjectType | 'select') => void;
    addObject3D: (type: ObjectType) => void;
}

export function LeftSidebar({
    gameMode, activeTool, setActiveTool, addObject3D
}: LeftSidebarProps) {
    return (
        <aside className="w-72 border-r border-white/10 bg-[#0f172a]/50 flex flex-col z-20">
            <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                    {/* Selection Tool */}
                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase px-2">Selection</label>
                        <ToolButton 
                            active={activeTool === 'select'} 
                            onClick={() => setActiveTool('select')}
                            icon={<MousePointer2 className="w-4 h-4" />}
                            label="Select"
                            tooltip="Select and move objects in the viewport. (Hotkey: V)"
                        />
                    </div>

                    {gameMode === '2d' ? (
                        <div className="space-y-4">
                            <label className="text-[10px] text-slate-500 font-bold uppercase px-2">2D Game Objects</label>
                            <div className="grid grid-cols-2 gap-2">
                                <ToolButton active={activeTool === 'player'} onClick={() => setActiveTool('player')} icon={<UserIcon className="w-4 h-4" />} label="Player" tooltip="The protagonist of your game." />
                                <ToolButton active={activeTool === 'platform'} onClick={() => setActiveTool('platform')} icon={<Box className="w-4 h-4" />} label="Platform" tooltip="Solid terrain." />
                                <ToolButton active={activeTool === 'enemy'} onClick={() => setActiveTool('enemy')} icon={<Skull className="w-4 h-4" />} label="Enemy" tooltip="Hazardous entity." />
                                <ToolButton active={activeTool === 'coin'} onClick={() => setActiveTool('coin')} icon={<Coins className="w-4 h-4" />} label="Coin" tooltip="Collectible item." />
                                <ToolButton active={activeTool === 'goal'} onClick={() => setActiveTool('goal')} icon={<Trophy className="w-4 h-4" />} label="Goal" tooltip="Win condition objective." />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 pb-20">
                            <div className="space-y-2">
                                <label className="text-[10px] text-slate-500 font-bold uppercase px-2">Core Entities</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <ToolButton active={activeTool === 'player'} onClick={() => addObject3D('player')} icon={<User className="w-4 h-4" />} label="Player" tooltip="Spawn the main player character." />
                                    <ToolButton active={activeTool === 'platform'} onClick={() => addObject3D('platform')} icon={<Square className="w-4 h-4" />} label="Platform" tooltip="Add a static 3D platform." />
                                    <ToolButton active={activeTool === 'enemy'} onClick={() => addObject3D('enemy')} icon={<Zap className="w-4 h-4" />} label="Enemy" tooltip="Spawn an enemy AI entity." />
                                    <ToolButton active={activeTool === 'coin'} onClick={() => addObject3D('coin')} icon={<CircleDot className="w-4 h-4" />} label="Coin" tooltip="Add a floating collectible item." />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] text-slate-500 font-bold uppercase px-2">Nature</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <ToolButton active={activeTool === 'tree'} onClick={() => addObject3D('tree')} icon={<TreePine className="w-4 h-4" />} label="Tree" tooltip="Natural 3D tree model." />
                                    <ToolButton active={activeTool === 'rock'} onClick={() => addObject3D('rock')} icon={<Mountain className="w-4 h-4" />} label="Rock" tooltip="Natural stone formation." />
                                    <ToolButton active={activeTool === 'flower'} onClick={() => addObject3D('flower')} icon={<Flower2 className="w-4 h-4" />} label="Flower" tooltip="Decorative floral element." />
                                    <ToolButton active={activeTool === 'bush'} onClick={() => addObject3D('bush')} icon={<Trees className="w-4 h-4" />} label="Bush" tooltip="Low-lying foliage." />
                                    <ToolButton active={activeTool === 'mushroom'} onClick={() => addObject3D('mushroom')} icon={<Sprout className="w-4 h-4" />} label="Mushroom" tooltip="Small fungal growth." />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] text-slate-500 font-bold uppercase px-2">Structures</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <ToolButton active={activeTool === 'house'} onClick={() => addObject3D('house')} icon={<Home className="w-4 h-4" />} label="House" tooltip="Residential building prefab." />
                                    <ToolButton active={activeTool === 'skyscraper'} onClick={() => addObject3D('skyscraper')} icon={<Building2 className="w-4 h-4" />} label="Skyscraper" tooltip="Massive urban structure." />
                                    <ToolButton active={activeTool === 'bridge'} onClick={() => addObject3D('bridge')} icon={<Waves className="w-4 h-4" />} label="Bridge" tooltip="Structural crossing." />
                                    <ToolButton active={activeTool === 'fountain'} onClick={() => addObject3D('fountain')} icon={<Droplets className="w-4 h-4" />} label="Fountain" tooltip="Decorative water feature." />
                                    <ToolButton active={activeTool === 'car'} onClick={() => addObject3D('car')} icon={<Car className="w-4 h-4" />} label="Vehicle" tooltip="3D car (drivable/static)." />
                                    <ToolButton active={activeTool === 'lamp'} onClick={() => addObject3D('lamp')} icon={<Lightbulb className="w-4 h-4" />} label="Street Lamp" tooltip="Urban lighting pole." />
                                    <ToolButton active={activeTool === 'fence'} onClick={() => addObject3D('fence')} icon={<Menu className="w-4 h-4" />} label="Fence" tooltip="Barrier/Boundary object." />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] text-slate-500 font-bold uppercase px-2">Props</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <ToolButton active={activeTool === 'crate'} onClick={() => addObject3D('crate')} icon={<Box className="w-4 h-4" />} label="Crate" tooltip="Moveable physics prop." />
                                    <ToolButton active={activeTool === 'barrel'} onClick={() => addObject3D('barrel')} icon={<Container className="w-4 h-4" />} label="Barrel" tooltip="Explosive or storage prop." />
                                    <ToolButton active={activeTool === 'chest'} onClick={() => addObject3D('chest')} icon={<Archive className="w-4 h-4" />} label="Chest" tooltip="Lootable container." />
                                    <ToolButton active={activeTool === 'bench'} onClick={() => addObject3D('bench')} icon={<Armchair className="w-4 h-4" />} label="Bench" tooltip="Seating prop." />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] text-slate-500 font-bold uppercase px-2">VFX & Systems</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <ToolButton active={activeTool === 'trigger'} onClick={() => addObject3D('trigger')} icon={<Target className="w-4 h-4" />} label="Trigger" tooltip="Invisible event zone." />
                                    <ToolButton active={activeTool === 'light'} onClick={() => addObject3D('light')} icon={<Sun className="w-4 h-4" />} label="Light" tooltip="Dynamic light emitter." />
                                    <ToolButton active={activeTool === 'particle'} onClick={() => addObject3D('particle')} icon={<Sparkles className="w-4 h-4" />} label="Particles" tooltip="Special effect system." />
                                    <ToolButton active={activeTool === 'model'} onClick={() => addObject3D('model')} icon={<Cube className="w-4 h-4" />} label="Custom GLB" tooltip="Import your own 3D model." />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
