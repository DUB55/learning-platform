'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, Share2, Play, Trash2, Plus, ArrowLeft, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface LevelElement {
    x: number;
    type: 'spike' | 'block';
}

interface NeonDashLevelMakerProps {
    onExit?: () => void;
    terms?: any[];
    focusMode?: boolean;
    // Keep existing props for internal use by NeonDash
    onBack?: () => void;
    onPlay?: (levelData: LevelElement[]) => void;
}

export default function NeonDashLevelMaker({ 
    onExit, 
    terms = [], 
    focusMode = false,
    onBack, 
    onPlay 
}: NeonDashLevelMakerProps) {
    const [elements, setElements] = useState<LevelElement[]>([]);
    const [levelName, setLevelName] = useState('My Custom Level');
    const scrollRef = useRef<HTMLDivElement>(null);
    const [viewOffset, setViewOffset] = useState(0);

    const addElement = (x: number, type: 'spike' | 'block') => {
        // Prevent overlapping elements
        if (elements.some(el => Math.abs(el.x - x) < 40)) {
            toast.error('Too close to another element');
            return;
        }
        setElements([...elements, { x, type }].sort((a, b) => a.x - b.x));
    };

    const removeElement = (index: number) => {
        setElements(elements.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        const levelData = {
            name: levelName,
            elements,
            updatedAt: new Date().toISOString()
        };
        const savedLevels = JSON.parse(localStorage.getItem('neon_dash_custom_levels') || '[]');
        const existingIndex = savedLevels.findIndex((l: any) => l.name === levelName);
        
        if (existingIndex >= 0) {
            savedLevels[existingIndex] = levelData;
        } else {
            savedLevels.push(levelData);
        }
        
        localStorage.setItem('neon_dash_custom_levels', JSON.stringify(savedLevels));
        toast.success('Level saved locally!');
    };

    const handleShare = () => {
        const levelCode = btoa(JSON.stringify({ n: levelName, e: elements }));
        navigator.clipboard.writeText(levelCode);
        toast.success('Level code copied to clipboard! Share it with others.');
    };

    const handleImport = () => {
        const code = prompt('Paste level code here:');
        if (!code) return;
        try {
            const decoded = JSON.parse(atob(code));
            if (decoded.n && decoded.e) {
                setLevelName(decoded.n);
                setElements(decoded.e);
                toast.success('Level imported successfully!');
            }
        } catch (e) {
            toast.error('Invalid level code');
        }
    };

    return (
        <div className="flex flex-col h-full w-full max-w-6xl mx-auto p-6 bg-[#0a0f1e] text-white overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack || onExit} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <input 
                        type="text" 
                        value={levelName}
                        onChange={(e) => setLevelName(e.target.value)}
                        className="bg-transparent text-2xl font-black italic border-b-2 border-white/10 focus:border-blue-500 outline-none px-2 uppercase"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleImport} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all text-sm font-bold">
                        <Upload className="w-4 h-4" /> Import
                    </button>
                    <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/20 transition-all text-sm font-bold">
                        <Save className="w-4 h-4" /> Save
                    </button>
                    <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-xl border border-purple-500/20 transition-all text-sm font-bold">
                        <Share2 className="w-4 h-4" /> Share
                    </button>
                    <button 
                        onClick={() => onPlay(elements)}
                        className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all font-black italic uppercase shadow-lg shadow-emerald-500/20"
                    >
                        <Play className="w-4 h-4" /> Test Play
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="relative flex-1 bg-black/40 border-2 border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col">
                {/* Ruler/Timeline */}
                <div className="h-12 border-b border-white/5 bg-white/5 flex items-center px-4 overflow-x-auto no-scrollbar"
                     onScroll={(e) => setViewOffset(e.currentTarget.scrollLeft)}>
                    <div className="flex gap-40 min-w-[5000px]">
                        {Array.from({ length: 50 }).map((_, i) => (
                            <span key={i} className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{i * 400}m</span>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div 
                    ref={scrollRef}
                    className="flex-1 overflow-x-auto no-scrollbar relative min-w-full"
                    style={{ cursor: 'crosshair' }}
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
                        const type = e.shiftKey ? 'block' : 'spike';
                        addElement(Math.round(x / 40) * 40, type);
                    }}
                >
                    <div className="h-full min-w-[5000px] relative">
                        {/* Floor */}
                        <div className="absolute bottom-12 left-0 right-0 h-1 bg-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
                        
                        {/* Elements */}
                        {elements.map((el, i) => (
                            <div 
                                key={i}
                                className="absolute bottom-12 group"
                                style={{ left: el.x }}
                            >
                                {el.type === 'spike' ? (
                                    <div className="w-8 h-8 -translate-x-1/2 flex flex-col items-center">
                                        <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[32px] border-b-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); removeElement(i); }}
                                            className="absolute -top-10 bg-rose-600 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 -translate-x-1/2 bg-purple-600 border-2 border-purple-400 rounded shadow-[0_0_15px_rgba(168,85,247,0.5)] flex items-center justify-center">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); removeElement(i); }}
                                            className="absolute -top-10 bg-rose-600 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Visual Help */}
                        <div className="absolute inset-0 pointer-events-none opacity-5">
                            <div className="h-full w-full" style={{ backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-white/5 border-t border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-8 border-b-rose-500" />
                            Click to add Spike
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-600 border border-purple-400" />
                            Shift + Click to add Block
                        </div>
                        <div className="flex items-center gap-2">
                            <Trash2 className="w-3 h-3" />
                            Hover element to delete
                        </div>
                    </div>
                    <div className="text-xs font-black text-blue-400 italic uppercase">
                        Total Elements: {elements.length}
                    </div>
                </div>
            </div>
        </div>
    );
}