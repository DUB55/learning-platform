'use client';

import React, { useState } from 'react';
import { Search, Box, Users, Trees, Building2, Package, Sparkles, Info } from 'lucide-react';
import { PREFABS } from '../constants';
import { AssetCategory, Prefab } from '../types';

interface AssetLibraryProps {
    onSelectPrefab: (prefab: Prefab) => void;
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function AssetLibrary({ onSelectPrefab, showToast }: AssetLibraryProps) {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<AssetCategory | 'all'>('all');

    const categories: { id: AssetCategory | 'all', label: string, icon: any }[] = [
        { id: 'all', label: 'All', icon: Box },
        { id: 'characters', label: 'Characters', icon: Users },
        { id: 'nature', label: 'Nature', icon: Trees },
        { id: 'urban', label: 'Urban', icon: Building2 },
        { id: 'props', label: 'Props', icon: Package },
        { id: 'vfx', label: 'VFX', icon: Sparkles },
    ];

    const filteredPrefabs = PREFABS.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                    type="text"
                    placeholder="Search assets..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map(cat => {
                    const Icon = cat.icon;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${activeCategory === cat.id ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'}`}
                        >
                            <Icon className="w-3 h-3" />
                            {cat.label}
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-2 custom-scrollbar">
                {filteredPrefabs.map((prefab, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSelectPrefab(prefab)}
                        className="group flex flex-col p-3 bg-white/5 border border-white/10 rounded-2xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left"
                    >
                        <div className="aspect-square bg-slate-900/50 rounded-xl mb-3 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative">
                            <div 
                                className="w-8 h-8 rounded-lg shadow-lg"
                                style={{ backgroundColor: prefab.color }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                                <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Add to Scene</span>
                            </div>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    showToast?.(`AI: This is a "${prefab.name}" (${prefab.type}). ${
                                        prefab.type === 'character' ? 'It can be used as a player or NPC.' :
                                        prefab.type === 'nature' ? 'Great for environment decoration.' :
                                        prefab.type === 'urban' ? 'Useful for building city structures.' :
                                        'A physical prop that can interact with the world.'
                                    } Default height is ${prefab.height || 40} units.`, 'info');
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-slate-900/80 rounded-lg text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-500 hover:text-white"
                                title="Explain with AI"
                            >
                                <Info className="w-3 h-3" />
                            </button>
                        </div>
                        <h4 className="text-[11px] font-bold text-slate-300 group-hover:text-blue-400 truncate">{prefab.name}</h4>
                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tight">{prefab.type}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
