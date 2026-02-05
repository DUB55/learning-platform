'use client';

import React from 'react';
import { 
    Settings, Palette, Trash2, Sun, Zap, Info, 
    MousePointer2, Globe, Camera, Activity, 
    Trees, Home, Box as BoxIcon, Trophy, Plus, Play, Pause
} from 'lucide-react';
import { GameMode, GameObject, GameDesign, GameComponent } from '../types';
import { OBJECT_TEMPLATES, ENVIRONMENT_PRESETS } from '../constants';

import { AssetLibrary } from './AssetLibrary';

interface RightSidebarProps {
    activeTab: 'properties' | 'logic' | 'world' | 'assets';
    setActiveTab: (tab: 'properties' | 'logic' | 'world' | 'assets') => void;
    selectedObject: GameObject | undefined;
    selectedId: string | null;
    setSelectedId: (id: string | null) => void;
    game: GameDesign;
    setGame: React.Dispatch<React.SetStateAction<GameDesign>>;
    gameMode: GameMode | null;
    addToHistory: (state: GameDesign) => void;
}

export function RightSidebar({
    activeTab, setActiveTab, selectedObject, selectedId, setSelectedId,
    game, setGame, gameMode, addToHistory, showToast
}: RightSidebarProps) {
    const onSelectPrefab = (prefab: any) => {
        const newObj: GameObject = {
            ...prefab,
            id: `obj-${Date.now()}`,
            x: 0,
            y: (prefab.height || 40) / 2,
            z: 0,
        };
        const newState = {
            ...game,
            objects: [...game.objects, newObj]
        };
        setGame(newState);
        addToHistory(newState);
        setSelectedId(newObj.id);
        setActiveTab('properties');
        
        showToast(`AI: Added ${newObj.name || newObj.type}. Use the Transform panel to move it.`, 'info');
    };

    return (
        <aside className="w-80 border-l border-white/10 bg-[#0f172a]/50 flex flex-col z-20">
            <div className="flex border-b border-white/10">
                <button 
                    onClick={() => setActiveTab('properties')}
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'properties' ? 'text-blue-400 bg-blue-500/5' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Props
                </button>
                <button 
                    onClick={() => setActiveTab('assets')}
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'assets' ? 'text-orange-400 bg-orange-500/5' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Assets
                </button>
                <button 
                    onClick={() => setActiveTab('logic')}
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'logic' ? 'text-purple-400 bg-purple-500/5' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Logic
                </button>
                <button 
                    onClick={() => setActiveTab('world')}
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'world' ? 'text-emerald-400 bg-emerald-500/5' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    World
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'assets' ? (
                    <AssetLibrary onSelectPrefab={onSelectPrefab} showToast={showToast} />
                ) : selectedObject ? (
                    activeTab === 'properties' ? (
                        <PropertyEditor 
                            selectedObject={selectedObject} 
                            selectedId={selectedId} 
                            setSelectedId={setSelectedId}
                            gameMode={gameMode}
                            setGame={setGame}
                            game={game}
                            addToHistory={addToHistory}
                        />
                    ) : activeTab === 'logic' ? (
                        <LogicEditor 
                            selectedObject={selectedObject} 
                            selectedId={selectedId}
                            setGame={setGame}
                            game={game}
                            addToHistory={addToHistory}
                        />
                    ) : (
                        <WorldSettings 
                            game={game} 
                            setGame={setGame} 
                            addToHistory={addToHistory} 
                        />
                    )
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        {activeTab === 'world' ? (
                            <WorldSettings 
                                game={game} 
                                setGame={setGame} 
                                addToHistory={addToHistory} 
                            />
                        ) : (
                            <>
                                <div className="p-4 bg-white/5 rounded-full mb-4">
                                    <MousePointer2 className="w-8 h-8 text-slate-600" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-400 mb-2">No Object Selected</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Select an object or pick an asset from the library.
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
}

function ComponentPropInputs({ comp, selectedId, game, setGame, addToHistory, accentColor = 'blue-500' }: any) {
    return (
        <div className="grid grid-cols-1 gap-3 pl-6 border-l border-white/5">
            {Object.entries(comp.props).map(([key, val]) => (
                <div key={key} className="space-y-1.5">
                    <label className="text-[9px] text-slate-500 font-bold uppercase">{key}</label>
                    {key === 'pattern' ? (
                        <select 
                            value={val as string}
                            onChange={(e) => {
                                const newState = {
                                    ...game,
                                    objects: game.objects.map((o: any) => o.id === selectedId ? {
                                        ...o,
                                        components: o.components.map((c: any) => c.id === comp.id ? {
                                            ...c,
                                            props: { ...c.props, [key]: e.target.value }
                                        } : c)
                                    } : o)
                                };
                                setGame(newState);
                                addToHistory(newState);
                            }}
                            className={`w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-2 py-1 text-[11px] focus:ring-1 focus:ring-${accentColor} outline-none`}
                        >
                            <option value="patrol">Patrol (X)</option>
                            <option value="float">Float (Y)</option>
                            <option value="rotate">Rotate</option>
                        </select>
                    ) : key === 'strategy' ? (
                        <select 
                            value={val as string}
                            onChange={(e) => {
                                const newState = {
                                    ...game,
                                    objects: game.objects.map((o: any) => o.id === selectedId ? {
                                        ...o,
                                        components: o.components.map((c: any) => c.id === comp.id ? {
                                            ...c,
                                            props: { ...c.props, [key]: e.target.value }
                                        } : c)
                                    } : o)
                                };
                                setGame(newState);
                                addToHistory(newState);
                            }}
                            className={`w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-2 py-1 text-[11px] focus:ring-1 focus:ring-${accentColor} outline-none`}
                        >
                            <option value="follow">Follow Player</option>
                            <option value="flee">Flee Player</option>
                            <option value="wander">Wander Randomly</option>
                        </select>
                    ) : (
                        <input 
                            type={typeof val === 'number' ? 'number' : 'text'}
                            value={val as any}
                            onChange={(e) => {
                                const newVal = typeof val === 'number' ? parseFloat(e.target.value) : e.target.value;
                                setGame((prev: any) => ({
                                    ...prev,
                                    objects: prev.objects.map((o: any) => o.id === selectedId ? {
                                        ...o,
                                        components: o.components.map((c: any) => c.id === comp.id ? {
                                            ...c,
                                            props: { ...c.props, [key]: newVal }
                                        } : c)
                                    } : o)
                                }));
                            }}
                            onBlur={() => addToHistory(game)}
                            className={`w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] focus:ring-1 focus:ring-${accentColor}`}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

function PropertyEditor({ selectedObject, selectedId, setSelectedId, gameMode, setGame, game, addToHistory }: any) {
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <Info className="w-3 h-3 text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Identity</span>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Object Name</label>
                    <input 
                        type="text" 
                        value={selectedObject.name || selectedObject.type}
                        onChange={(e) => {
                            setGame((prev: any) => ({
                                ...prev,
                                objects: prev.objects.map((o: any) => o.id === selectedId ? { ...o, name: e.target.value } : o)
                            }));
                        }}
                        onBlur={() => addToHistory(game)}
                        placeholder="Unnamed Object"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <Settings className="w-3 h-3 text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Transform</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Position X</label>
                        <input 
                            type="number" 
                            value={selectedObject.x}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setGame((prev: any) => ({
                                    ...prev,
                                    objects: prev.objects.map((o: any) => o.id === selectedId ? { ...o, x: val } : o)
                                }));
                            }}
                            onBlur={() => addToHistory(game)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Position Y</label>
                        <input 
                            type="number" 
                            value={selectedObject.y}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setGame((prev: any) => ({
                                    ...prev,
                                    objects: prev.objects.map((o: any) => o.id === selectedId ? { ...o, y: val } : o)
                                }));
                            }}
                            onBlur={() => addToHistory(game)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    {gameMode === '3d' && (
                        <div className="space-y-2">
                            <label className="text-[10px] text-slate-500 font-bold uppercase">Position Z</label>
                            <input 
                                type="number" 
                                value={selectedObject.z || 0}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setGame((prev: any) => ({
                                        ...prev,
                                        objects: prev.objects.map((o: any) => o.id === selectedId ? { ...o, z: val } : o)
                                    }));
                                }}
                                onBlur={() => addToHistory(game)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <Palette className="w-3 h-3 text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Appearance</span>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Object Color</label>
                    <div className="flex items-center gap-3">
                        <input 
                            type="color" 
                            value={selectedObject.color}
                            onChange={(e) => {
                                setGame((prev: any) => ({
                                    ...prev,
                                    objects: prev.objects.map((o: any) => o.id === selectedId ? { ...o, color: e.target.value } : o)
                                }));
                            }}
                            onBlur={() => addToHistory(game)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                        />
                        <input 
                            type="text" 
                            value={selectedObject.color}
                            onChange={(e) => {
                                setGame((prev: any) => ({
                                    ...prev,
                                    objects: prev.objects.map((o: any) => o.id === selectedId ? { ...o, color: e.target.value } : o)
                                }));
                            }}
                            onBlur={() => addToHistory(game)}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>



            {/* Component Editor Section */}
            <div className="pt-6 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-blue-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Components</span>
                    </div>
                    <div className="flex items-center gap-1">
                        {['movement', 'ai', 'interaction', 'physics'].map(type => (
                            <button 
                                key={type}
                                onClick={() => {
                                    const props: Record<string, any> = {};
                                    if (type === 'movement') Object.assign(props, { speed: 2, pattern: 'patrol', distance: 5 });
                                    if (type === 'ai') Object.assign(props, { behavior: 'patrol', speed: 1 });
                                    if (type === 'interaction') Object.assign(props, { radius: 2, message: 'Interact' });
                                    if (type === 'physics') Object.assign(props, { mass: 1, friction: 0.5 });

                                    const newComp: GameComponent = {
                                        id: `comp-${Date.now()}`,
                                        type: type as any,
                                        enabled: true,
                                        props
                                    };
                                    const newState = {
                                        ...game,
                                        objects: game.objects.map((o: any) => o.id === selectedId ? { 
                                            ...o, 
                                            components: [...(o.components || []), newComp] 
                                        } : o)
                                    };
                                    setGame(newState);
                                    addToHistory(newState);
                                }}
                                title={`Add ${type}`}
                                className="p-1 hover:bg-white/5 rounded text-blue-400"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    {selectedObject.components?.map((comp: GameComponent) => (
                        <div key={comp.id} className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="checkbox" 
                                        checked={comp.enabled}
                                        onChange={(e) => {
                                            const newState = {
                                                ...game,
                                                objects: game.objects.map((o: any) => o.id === selectedId ? {
                                                    ...o,
                                                    components: o.components.map((c: any) => c.id === comp.id ? { ...c, enabled: e.target.checked } : c)
                                                } : o)
                                            };
                                            setGame(newState);
                                            addToHistory(newState);
                                        }}
                                        className="rounded border-white/10 bg-transparent text-blue-500 focus:ring-0 focus:ring-offset-0"
                                    />
                                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">{comp.type}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => {
                                            // AI Explanation Logic
                                            showToast(`AI: The "${comp.type}" component ${comp.enabled ? 'is active' : 'is currently disabled'}. It manages ${
                                                comp.type === 'movement' ? 'how this object moves (e.g., ' + comp.props.pattern + ')' :
                                                comp.type === 'ai' ? 'autonomous behavior and navigation' :
                                                comp.type === 'interaction' ? 'how players can interact with it' :
                                                'physical properties like mass and friction'
                                            }.`, 'info');
                                        }}
                                        className="p-1 hover:bg-blue-500/10 rounded text-blue-400"
                                        title="Explain with AI"
                                    >
                                        <Info className="w-3 h-3" />
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const newState = {
                                                ...game,
                                                objects: game.objects.map((o: any) => o.id === selectedId ? {
                                                    ...o,
                                                    components: o.components.filter((c: any) => c.id !== comp.id)
                                                } : o)
                                            };
                                            setGame(newState);
                                            addToHistory(newState);
                                        }}
                                        className="p-1 hover:bg-red-500/10 rounded text-red-400"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            <ComponentPropInputs 
                                comp={comp} 
                                selectedId={selectedId} 
                                game={game} 
                                setGame={setGame} 
                                addToHistory={addToHistory} 
                                accentColor="blue-500"
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-6 border-t border-white/10">
                <button 
                    onClick={() => {
                        const newState = {
                            ...game,
                            objects: game.objects.filter((o: any) => o.id !== selectedId)
                        };
                        setGame(newState);
                        setSelectedId(null);
                        addToHistory(newState);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-all group"
                >
                    <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-wider">Delete Object</span>
                </button>
            </div>

            {selectedObject.type === 'light' && (
                <div className="p-3 bg-yellow-500/5 rounded-xl border border-yellow-500/20 space-y-3 mt-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Sun className="w-3 h-3 text-yellow-500" />
                        <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-tight">Light Settings</span>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Light Type</label>
                        <select 
                            value={selectedObject.properties.type || 'point'}
                            onChange={(e) => {
                                setGame((prev: any) => ({
                                    ...prev,
                                    objects: prev.objects.map((o: any) => o.id === selectedId ? { 
                                        ...o, 
                                        properties: { ...o.properties, type: e.target.value } 
                                    } : o)
                                }));
                            }}
                            onBlur={() => addToHistory(game)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-yellow-500"
                        >
                            <option value="point">Point Light (Omni)</option>
                            <option value="directional">Directional (Sun)</option>
                            <option value="spot">Spotlight</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase flex justify-between">
                            Intensity
                            <span className="text-yellow-500">{selectedObject.properties.intensity || 1}</span>
                        </label>
                        <input 
                            type="range" 
                            min="0" max="10" step="0.1"
                            value={selectedObject.properties.intensity || 1}
                            onChange={(e) => {
                                setGame((prev: any) => ({
                                    ...prev,
                                    objects: prev.objects.map((o: any) => o.id === selectedId ? { 
                                        ...o, 
                                        properties: { ...o.properties, intensity: parseFloat(e.target.value) } 
                                    } : o)
                                }));
                            }}
                            onMouseUp={() => addToHistory(game)}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                        />
                    </div>
                </div>
            )}

            {/* Nature Properties */}
            {['flower', 'bush', 'mushroom'].includes(selectedObject.type) && (
                <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 space-y-3 mt-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Trees className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tight">Nature Settings</span>
                    </div>
                    {selectedObject.type === 'flower' && (
                        <div className="space-y-2">
                            <label className="text-[10px] text-slate-500 font-bold uppercase">Flower Type</label>
                            <select 
                                value={selectedObject.properties.type || 'rose'}
                                onChange={(e) => {
                                    setGame((prev: any) => ({
                                        ...prev,
                                        objects: prev.objects.map((o: any) => o.id === selectedId ? { 
                                            ...o, 
                                            properties: { ...o.properties, type: e.target.value } 
                                        } : o)
                                    }));
                                }}
                                onBlur={() => addToHistory(game)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value="rose">Rose</option>
                                <option value="lily">Lily</option>
                                <option value="sunflower">Sunflower</option>
                                <option value="tulip">Tulip</option>
                            </select>
                        </div>
                    )}
                    {selectedObject.type === 'bush' && (
                        <div className="space-y-2">
                            <label className="text-[10px] text-slate-500 font-bold uppercase flex justify-between">
                                Density
                                <span className="text-emerald-500">{selectedObject.properties.density || 1}</span>
                            </label>
                            <input 
                                type="range" 
                                min="0.5" max="3" step="0.1"
                                value={selectedObject.properties.density || 1}
                                onChange={(e) => {
                                    setGame((prev: any) => ({
                                        ...prev,
                                        objects: prev.objects.map((o: any) => o.id === selectedId ? { 
                                            ...o, 
                                            properties: { ...o.properties, density: parseFloat(e.target.value) } 
                                        } : o)
                                    }));
                                }}
                                onMouseUp={() => addToHistory(game)}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                        </div>
                    )}
                    {selectedObject.type === 'mushroom' && (
                        <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10">
                            <label className="text-[10px] text-slate-500 font-bold uppercase">Toxic Mushroom</label>
                            <button 
                                onClick={() => {
                                    const newState = {
                                        ...game,
                                        objects: game.objects.map((o: any) => o.id === selectedId ? { 
                                            ...o, 
                                            properties: { ...o.properties, toxic: !o.properties.toxic } 
                                        } : o)
                                    };
                                    setGame(newState);
                                    addToHistory(newState);
                                }}
                                className={`w-10 h-5 rounded-full transition-colors relative ${selectedObject.properties.toxic ? 'bg-red-500' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${selectedObject.properties.toxic ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Structure Properties */}
            {['skyscraper', 'bridge', 'fountain'].includes(selectedObject.type) && (
                <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/20 space-y-3 mt-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Home className="w-3 h-3 text-blue-500" />
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">Structure Settings</span>
                    </div>
                    {selectedObject.type === 'skyscraper' && (
                        <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10">
                            <label className="text-[10px] text-slate-500 font-bold uppercase">Glass Facade</label>
                            <button 
                                onClick={() => {
                                    const newState = {
                                        ...game,
                                        objects: game.objects.map((o: any) => o.id === selectedId ? { 
                                            ...o, 
                                            properties: { ...o.properties, glass: !o.properties.glass } 
                                        } : o)
                                    };
                                    setGame(newState);
                                    addToHistory(newState);
                                }}
                                className={`w-10 h-5 rounded-full transition-colors relative ${selectedObject.properties.glass ? 'bg-blue-500' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${selectedObject.properties.glass ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>
                    )}
                    {selectedObject.type === 'bridge' && (
                        <div className="space-y-2">
                            <label className="text-[10px] text-slate-500 font-bold uppercase flex justify-between">
                                Bridge Length
                                <span className="text-blue-500">{selectedObject.properties.length || 50}m</span>
                            </label>
                            <input 
                                type="range" 
                                min="10" max="200" step="5"
                                value={selectedObject.properties.length || 50}
                                onChange={(e) => {
                                    setGame((prev: any) => ({
                                        ...prev,
                                        objects: prev.objects.map((o: any) => o.id === selectedId ? { 
                                            ...o, 
                                            properties: { ...o.properties, length: parseFloat(e.target.value) } 
                                        } : o)
                                    }));
                                }}
                                onMouseUp={() => addToHistory(game)}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>
                    )}
                    {selectedObject.type === 'fountain' && (
                        <div className="space-y-2">
                            <label className="text-[10px] text-slate-500 font-bold uppercase flex justify-between">
                                Water Height
                                <span className="text-blue-500">{selectedObject.properties.waterHeight || 2}m</span>
                            </label>
                            <input 
                                type="range" 
                                min="0.5" max="10" step="0.5"
                                value={selectedObject.properties.waterHeight || 2}
                                onChange={(e) => {
                                    setGame((prev: any) => ({
                                        ...prev,
                                        objects: prev.objects.map((o: any) => o.id === selectedId ? { 
                                            ...o, 
                                            properties: { ...o.properties, waterHeight: parseFloat(e.target.value) } 
                                        } : o)
                                    }));
                                }}
                                onMouseUp={() => addToHistory(game)}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Prop Properties */}
            {['crate', 'barrel', 'chest', 'bench'].includes(selectedObject.type) && (
                <div className="p-3 bg-orange-500/5 rounded-xl border border-orange-500/20 space-y-3 mt-4">
                    <div className="flex items-center gap-2 mb-1">
                        <BoxIcon className="w-3 h-3 text-orange-500" />
                        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-tight">Prop Settings</span>
                    </div>
                    {selectedObject.type === 'barrel' && (
                        <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10">
                            <label className="text-[10px] text-slate-500 font-bold uppercase">Explosive Barrel</label>
                            <button 
                                onClick={() => {
                                    const newState = {
                                        ...game,
                                        objects: game.objects.map((o: any) => o.id === selectedId ? { 
                                            ...o, 
                                            properties: { ...o.properties, explosive: !o.properties.explosive } 
                                        } : o)
                                    };
                                    setGame(newState);
                                    addToHistory(newState);
                                }}
                                className={`w-10 h-5 rounded-full transition-colors relative ${selectedObject.properties.explosive ? 'bg-orange-500' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${selectedObject.properties.explosive ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>
                    )}
                    {selectedObject.type === 'chest' && (
                        <div className="space-y-2">
                            <label className="text-[10px] text-slate-500 font-bold uppercase">Loot Content</label>
                            <select 
                                value={selectedObject.properties.loot || 'gold'}
                                onChange={(e) => {
                                    const newState = {
                                        ...game,
                                        objects: game.objects.map((o: any) => o.id === selectedId ? { 
                                            ...o, 
                                            properties: { ...o.properties, loot: e.target.value } 
                                        } : o)
                                    };
                                    setGame(newState);
                                    addToHistory(newState);
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500"
                            >
                                <option value="gold">Gold Coins</option>
                                <option value="health">Health Pack</option>
                                <option value="weapon">Random Weapon</option>
                                <option value="key">Gate Key</option>
                            </select>
                        </div>
                    )}
                    {selectedObject.type === 'bench' && (
                        <div className="space-y-2">
                            <label className="text-[10px] text-slate-500 font-bold uppercase flex justify-between">
                                Seat Count
                                <span className="text-orange-500">{selectedObject.properties.seats || 3}</span>
                            </label>
                            <input 
                                type="range" 
                                min="1" max="5" step="1"
                                value={selectedObject.properties.seats || 3}
                                onChange={(e) => {
                                    setGame((prev: any) => ({
                                        ...prev,
                                        objects: prev.objects.map((o: any) => o.id === selectedId ? { 
                                            ...o, 
                                            properties: { ...o.properties, seats: parseInt(e.target.value) } 
                                        } : o)
                                    }));
                                }}
                                onMouseUp={() => addToHistory(game)}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
                            />
                        </div>
                    )}
                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Physics Enabled</label>
                        <button 
                            onClick={() => {
                                const newState = {
                                    ...game,
                                    objects: game.objects.map((o: any) => o.id === selectedId ? { 
                                        ...o, 
                                        properties: { ...o.properties, physics: !o.properties.physics } 
                                    } : o)
                                };
                                setGame(newState);
                                addToHistory(newState);
                            }}
                            className={`w-10 h-5 rounded-full transition-colors relative ${selectedObject.properties.physics ? 'bg-orange-500' : 'bg-slate-700'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${selectedObject.properties.physics ? 'right-1' : 'left-1'}`} />
                        </button>
                    </div>
                </div>
            )}

            {/* GLB Model Selection */}
            {selectedObject.type === 'model' && (
                <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/20 space-y-3 mt-4">
                    <div className="flex items-center gap-2 mb-1">
                        <BoxIcon className="w-3 h-3 text-blue-500" />
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">Model Settings</span>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Model URL (.glb/.gltf)</label>
                        <input 
                            type="text"
                            value={selectedObject.properties.modelUrl || ''}
                            onChange={(e) => {
                                setGame((prev: any) => ({
                                    ...prev,
                                    objects: prev.objects.map((o: any) => o.id === selectedId ? { 
                                        ...o, 
                                        properties: { ...o.properties, modelUrl: e.target.value } 
                                    } : o)
                                }));
                            }}
                            onBlur={() => addToHistory(game)}
                            placeholder="https://example.com/model.glb"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Animation</label>
                        <select 
                            value={selectedObject.properties.animation || 'idle'}
                            onChange={(e) => {
                                const newState = {
                                    ...game,
                                    objects: game.objects.map((o: any) => o.id === selectedId ? { 
                                        ...o, 
                                        properties: { ...o.properties, animation: e.target.value } 
                                    } : o)
                                };
                                setGame(newState);
                                addToHistory(newState);
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="idle">Idle</option>
                            <option value="walk">Walk</option>
                            <option value="run">Run</option>
                            <option value="action">Action</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Cast Shadows</label>
                        <button 
                            onClick={() => {
                                const newState = {
                                    ...game,
                                    objects: game.objects.map((o: any) => o.id === selectedId ? { 
                                        ...o, 
                                        properties: { ...o.properties, castShadow: !o.properties.castShadow } 
                                    } : o)
                                };
                                setGame(newState);
                                addToHistory(newState);
                            }}
                            className={`w-10 h-5 rounded-full transition-colors relative ${selectedObject.properties.castShadow !== false ? 'bg-blue-500' : 'bg-slate-700'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${selectedObject.properties.castShadow !== false ? 'right-1' : 'left-1'}`} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function LogicEditor({ selectedObject, selectedId, setGame, game, addToHistory }: any) {
    return (
        <div className="space-y-6">
            <div className="p-4 bg-purple-500/5 rounded-2xl border border-purple-500/20 space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Zap className="w-4 h-4 text-purple-400" />
                        </div>
                        <h4 className="text-xs font-bold uppercase tracking-tight">Interactive Logic</h4>
                    </div>
                    <div className="px-2 py-0.5 bg-purple-500/20 rounded text-[9px] font-bold text-purple-400 uppercase">
                        {selectedObject.type}
                    </div>
                </div>
                
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Trigger Event</label>
                        <select 
                            value={selectedObject.properties.triggerType || 'onCollision'}
                            onChange={(e) => {
                                const newState = {
                                    ...game,
                                    objects: game.objects.map((o: any) => o.id === selectedId ? { 
                                        ...o, 
                                        properties: { ...o.properties, triggerType: e.target.value } 
                                    } : o)
                                };
                                setGame(newState);
                                addToHistory(newState);
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 appearance-none"
                        >
                            <option value="onCollision" className="bg-[#0a0f1e]">On Collision (Touch)</option>
                            <option value="onTriggerEnter" className="bg-[#0a0f1e]">On Trigger Enter (Zone)</option>
                            <option value="onTriggerExit" className="bg-[#0a0f1e]">On Trigger Exit (Zone)</option>
                            <option value="onInteract" className="bg-[#0a0f1e]">On Interaction (Press E)</option>
                            <option value="onSpawn" className="bg-[#0a0f1e]">On Object Spawn</option>
                            <option value="onDestroy" className="bg-[#0a0f1e]">On Object Destroyed</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Resulting Action</label>
                        <select 
                            value={selectedObject.properties.actionType || 'none'}
                            onChange={(e) => {
                                const newState = {
                                    ...game,
                                    objects: game.objects.map((o: any) => o.id === selectedId ? { 
                                        ...o, 
                                        properties: { ...o.properties, actionType: e.target.value } 
                                    } : o)
                                };
                                setGame(newState);
                                addToHistory(newState);
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 appearance-none"
                        >
                            <option value="none" className="bg-[#0a0f1e]">No Action</option>
                            <option value="message" className="bg-[#0a0f1e]">Display Message/Dialogue</option>
                            <option value="score" className="bg-[#0a0f1e]">Modify Score/Points</option>
                            <option value="damage" className="bg-[#0a0f1e]">Damage/Heal Player</option>
                            <option value="teleport" className="bg-[#0a0f1e]">Teleport Player</option>
                            <option value="spawn" className="bg-[#0a0f1e]">Spawn New Object</option>
                            <option value="changeWeather" className="bg-[#0a0f1e]">Change World Weather</option>
                            <option value="win" className="bg-[#0a0f1e]">Win Level</option>
                            <option value="lose" className="bg-[#0a0f1e]">Kill Player/Lose</option>
                        </select>
                    </div>

                    {selectedObject.properties.actionType === 'message' && (
                        <div className="space-y-2 p-3 bg-white/5 rounded-xl border border-white/10 animate-in fade-in slide-in-from-top-2">
                            <label className="text-[10px] text-slate-500 font-bold uppercase">Dialogue Text</label>
                            <textarea 
                                value={selectedObject.properties.message || ''}
                                onChange={(e) => {
                                    setGame((prev: any) => ({
                                        ...prev,
                                        objects: prev.objects.map((o: any) => o.id === selectedId ? { 
                                            ...o, 
                                            properties: { ...o.properties, message: e.target.value } 
                                        } : o)
                                    }));
                                }}
                                onBlur={() => addToHistory(game)}
                                placeholder="Enter dialogue or system message..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 min-h-[80px]"
                            />
                        </div>
                    )}

                    {selectedObject.properties.actionType === 'score' && (
                        <div className="space-y-2 p-3 bg-white/5 rounded-xl border border-white/10 animate-in fade-in slide-in-from-top-2">
                            <label className="text-[10px] text-slate-500 font-bold uppercase">Score Adjustment</label>
                            <input 
                                type="number"
                                value={selectedObject.properties.scoreValue || 0}
                                onChange={(e) => {
                                    setGame((prev: any) => ({
                                        ...prev,
                                        objects: prev.objects.map((o: any) => o.id === selectedId ? { 
                                            ...o, 
                                            properties: { ...o.properties, scoreValue: parseInt(e.target.value) } 
                                        } : o)
                                    }));
                                }}
                                onBlur={() => addToHistory(game)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    )}

                    {selectedObject.properties.actionType === 'damage' && (
                        <div className="space-y-2 p-3 bg-white/5 rounded-xl border border-white/10 animate-in fade-in slide-in-from-top-2">
                            <label className="text-[10px] text-slate-500 font-bold uppercase">Damage/Heal Amount</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    value={selectedObject.properties.damageValue || 10}
                                    onChange={(e) => {
                                        setGame((prev: any) => ({
                                            ...prev,
                                            objects: prev.objects.map((o: any) => o.id === selectedId ? { 
                                                ...o, 
                                                properties: { ...o.properties, damageValue: parseInt(e.target.value) } 
                                            } : o)
                                        }));
                                    }}
                                    onBlur={() => addToHistory(game)}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500"
                                />
                                <span className="text-[10px] text-slate-500 font-bold uppercase">HP</span>
                            </div>
                            <p className="text-[9px] text-slate-500 italic">Use negative values to heal the player.</p>
                        </div>
                    )}

                    {selectedObject.properties.actionType === 'teleport' && (
                        <div className="space-y-3 p-3 bg-white/5 rounded-xl border border-white/10 animate-in fade-in slide-in-from-top-2">
                            <label className="text-[10px] text-slate-500 font-bold uppercase">Destination (X, Y, Z)</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['x', 'y', 'z'].map((axis) => (
                                    <input 
                                        key={axis}
                                        type="number"
                                        placeholder={axis.toUpperCase()}
                                        value={selectedObject.properties[`teleport${axis.toUpperCase()}`] || 0}
                                        onChange={(e) => {
                                            setGame((prev: any) => ({
                                                ...prev,
                                                objects: prev.objects.map((o: any) => o.id === selectedId ? { 
                                                    ...o, 
                                                    properties: { ...o.properties, [`teleport${axis.toUpperCase()}`]: parseFloat(e.target.value) } 
                                                } : o)
                                            }));
                                        }}
                                        onBlur={() => addToHistory(game)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-xs focus:ring-2 focus:ring-purple-500"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedObject.properties.actionType === 'spawn' && (
                        <div className="space-y-3 p-3 bg-white/5 rounded-xl border border-white/10 animate-in fade-in slide-in-from-top-2">
                            <label className="text-[10px] text-slate-500 font-bold uppercase">Spawn Object Type</label>
                            <select 
                                value={selectedObject.properties.spawnType || 'coin'}
                                onChange={(e) => {
                                    const newState = {
                                        ...game,
                                        objects: game.objects.map((o: any) => o.id === selectedId ? { 
                                            ...o, 
                                            properties: { ...o.properties, spawnType: e.target.value } 
                                        } : o)
                                    };
                                    setGame(newState);
                                    addToHistory(newState);
                                }}
                                className="w-full bg-[#0a0f1e] border border-white/10 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 appearance-none mb-2"
                            >
                                {Object.keys(OBJECT_TEMPLATES).map(type => (
                                    <option key={type} value={type} className="bg-[#0a0f1e]">{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                ))}
                            </select>
                            <label className="text-[10px] text-slate-500 font-bold uppercase">Spawn Location (Relative)</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['x', 'y', 'z'].map((axis) => (
                                    <input 
                                        key={axis}
                                        type="number"
                                        placeholder={axis.toUpperCase()}
                                        value={selectedObject.properties[`spawnOffset${axis.toUpperCase()}`] || 0}
                                        onChange={(e) => {
                                            setGame((prev: any) => ({
                                                ...prev,
                                                objects: prev.objects.map((o: any) => o.id === selectedId ? { 
                                                    ...o, 
                                                    properties: { ...o.properties, [`spawnOffset${axis.toUpperCase()}`]: parseFloat(e.target.value) } 
                                                } : o)
                                            }));
                                        }}
                                        onBlur={() => addToHistory(game)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-xs focus:ring-2 focus:ring-purple-500"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedObject.properties.actionType === 'changeWeather' && (
                        <div className="space-y-3 p-3 bg-white/5 rounded-xl border border-white/10 animate-in fade-in slide-in-from-top-2">
                            <label className="text-[10px] text-slate-500 font-bold uppercase">Target Weather</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['none', 'rain', 'snow', 'storm'].map((w) => (
                                    <button
                                        key={w}
                                        onClick={() => {
                                            const newState = {
                                                ...game,
                                                objects: game.objects.map((o: any) => o.id === selectedId ? { 
                                                    ...o, 
                                                    properties: { ...o.properties, targetWeather: w } 
                                                } : o)
                                            };
                                            setGame(newState);
                                            addToHistory(newState);
                                        }}
                                        className={`py-2 rounded-lg border transition-all text-[10px] font-bold uppercase ${selectedObject.properties.targetWeather === w ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'}`}
                                    >
                                        {w}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ECS Component Editor */}
            <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/20 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Activity className="w-4 h-4 text-blue-400" />
                        </div>
                        <h4 className="text-xs font-bold uppercase tracking-tight">Behaviors (ECS)</h4>
                    </div>
                    <button 
                        onClick={() => {
                            const newComp: GameComponent = {
                                id: Math.random().toString(36).substr(2, 9),
                                type: 'movement',
                                enabled: true,
                                props: { pattern: 'patrol', speed: 2, distance: 5 }
                            };
                            const newState = {
                                ...game,
                                objects: game.objects.map((o: any) => o.id === selectedId ? { 
                                    ...o, 
                                    components: [...(o.components || []), newComp] 
                                } : o)
                            };
                            setGame(newState);
                            addToHistory(newState);
                        }}
                        className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-colors"
                    >
                        <Plus className="w-3 h-3" />
                    </button>
                </div>

                <div className="space-y-3">
                    {(selectedObject.components || []).map((comp: GameComponent) => (
                        <div key={comp.id} className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-3">
                            <div className="flex items-center justify-between">
                                <select 
                                    value={comp.type}
                                    onChange={(e) => {
                                        const newState = {
                                            ...game,
                                            objects: game.objects.map((o: any) => o.id === selectedId ? { 
                                                ...o, 
                                                components: o.components.map((c: any) => c.id === comp.id ? { ...c, type: e.target.value } : c)
                                            } : o)
                                        };
                                        setGame(newState);
                                        addToHistory(newState);
                                    }}
                                    className="bg-transparent text-[10px] font-bold text-blue-400 uppercase tracking-wider outline-none"
                                >
                                    <option value="movement">Movement</option>
                                    <option value="ai">AI / Pathfinding</option>
                                    <option value="health">Health System</option>
                                </select>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => {
                                            // AI Explanation Logic
                                            showToast(`AI: The "${comp.type}" component ${comp.enabled ? 'is active' : 'is currently disabled'}. It manages ${
                                                comp.type === 'movement' ? 'how this object moves (e.g., ' + comp.props.pattern + ')' :
                                                comp.type === 'ai' ? 'autonomous behavior and navigation' :
                                                comp.type === 'interaction' ? 'how players can interact with it' :
                                                comp.type === 'health' ? 'the vitality and damage resistance of this object' :
                                                'physical properties like mass and friction'
                                            }.`, 'info');
                                        }}
                                        className="p-1 hover:bg-blue-500/10 rounded text-blue-400"
                                        title="Explain with AI"
                                    >
                                        <Info className="w-3 h-3" />
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const newState = {
                                                ...game,
                                                objects: game.objects.map((o: any) => o.id === selectedId ? { 
                                                    ...o, 
                                                    components: o.components.map((c: any) => c.id === comp.id ? { ...c, enabled: !c.enabled } : c)
                                                } : o)
                                            };
                                            setGame(newState);
                                            addToHistory(newState);
                                        }}
                                        className={`p-1 rounded ${comp.enabled ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 bg-white/5'}`}
                                    >
                                        {comp.enabled ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const newState = {
                                                ...game,
                                                objects: game.objects.map((o: any) => o.id === selectedId ? { 
                                                    ...o, 
                                                    components: o.components.filter((c: any) => c.id !== comp.id)
                                                } : o)
                                            };
                                            setGame(newState);
                                            addToHistory(newState);
                                        }}
                                        className="p-1 text-red-400 bg-red-400/10 rounded hover:bg-red-400/20"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            <ComponentPropInputs 
                                comp={comp} 
                                selectedId={selectedId} 
                                game={game} 
                                setGame={setGame} 
                                addToHistory={addToHistory} 
                                accentColor="blue-500"
                            />
                        </div>
                    ))}
                    {(!selectedObject.components || selectedObject.components.length === 0) && (
                        <p className="text-[10px] text-slate-500 text-center py-2 italic border border-dashed border-white/10 rounded-xl">
                            No behaviors attached. Click + to add.
                        </p>
                    )}
                </div>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-2xl border border-white/5 space-y-2">
                <div className="flex items-center gap-2">
                    <Info className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Scripting Tip</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed italic">
                    Triggers and actions allow you to create complex gameplay without coding. 
                    Combine "On Interaction" with "Display Message" to create NPCs, or "On Trigger Enter" with "Teleport" for portals!
                </p>
            </div>
        </div>
    );
}

function WorldSettings({ game, setGame, addToHistory }: { game: GameDesign, setGame: any, addToHistory: any }) {
    return (
        <div className="space-y-6">
            <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <Globe className="w-4 h-4 text-emerald-400" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-tight">World Atmosphere</h4>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Environment Preset</label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(ENVIRONMENT_PRESETS).map(([id, preset]) => (
                                <button
                                    key={id}
                                    onClick={() => {
                                        const newState = {
                                            ...game,
                                            settings: {
                                                ...game.settings,
                                                environment: id,
                                                skybox: preset.skybox,
                                                groundType: preset.groundType as any,
                                                weather: preset.weather as any,
                                                fogDensity: preset.fogDensity,
                                                fogColor: preset.fogColor,
                                                ambientLightIntensity: preset.ambientLightIntensity,
                                                cameraMode: (preset as any).cameraMode || game.settings.cameraMode,
                                                physicsEnabled: (preset as any).physicsEnabled !== undefined ? (preset as any).physicsEnabled : game.settings.physicsEnabled,
                                            }
                                        };
                                        setGame(newState);
                                        addToHistory(newState);
                                    }}
                                    className={`p-2 rounded-lg border transition-all text-[10px] font-bold text-center ${game.settings.environment === id ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'}`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Skybox & Lighting</label>
                        <select 
                            value={game.settings.skybox || 'sunset'}
                            onChange={(e) => {
                                const newState = { ...game, settings: { ...game.settings, skybox: e.target.value } };
                                setGame(newState);
                                addToHistory(newState);
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 appearance-none"
                        >
                            <option value="sunset" className="bg-[#0a0f1e]">Sunset (Warm)</option>
                            <option value="dawn" className="bg-[#0a0f1e]">Dawn (Soft)</option>
                            <option value="night" className="bg-[#0a0f1e]">Night (Dark)</option>
                            <option value="warehouse" className="bg-[#0a0f1e]">Industrial</option>
                            <option value="forest" className="bg-[#0a0f1e]">Forest (Green)</option>
                            <option value="apartment" className="bg-[#0a0f1e]">Indoor</option>
                            <option value="city" className="bg-[#0a0f1e]">Urban</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Ground Surface</label>
                        <select 
                            value={game.settings.groundType || 'grass'}
                            onChange={(e) => {
                                const newState = { ...game, settings: { ...game.settings, groundType: e.target.value as any } };
                                setGame(newState);
                                addToHistory(newState);
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 appearance-none"
                        >
                            <option value="grass" className="bg-[#0a0f1e]">Green Grass</option>
                            <option value="sand" className="bg-[#0a0f1e]">Desert Sand</option>
                            <option value="snow" className="bg-[#0a0f1e]">Deep Snow</option>
                            <option value="concrete" className="bg-[#0a0f1e]">Urban Concrete</option>
                            <option value="dirt" className="bg-[#0a0f1e]">Dry Dirt</option>
                            <option value="water" className="bg-[#0a0f1e]">Ocean Water</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase flex justify-between">
                            Time of Day
                            <span className="text-emerald-400">{Math.floor(game.settings.timeOfDay || 12)}:00</span>
                        </label>
                        <input 
                            type="range" 
                            min="0" 
                            max="24" 
                            step="0.1"
                            value={game.settings.timeOfDay || 12}
                            onChange={(e) => {
                                const newState = { ...game, settings: { ...game.settings, timeOfDay: parseFloat(e.target.value) } };
                                setGame(newState);
                            }}
                            onMouseUp={() => addToHistory(game)}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <button 
                            onClick={() => {
                                const newState = { ...game, settings: { ...game.settings, dayNightCycle: !game.settings.dayNightCycle } };
                                setGame(newState);
                                addToHistory(newState);
                            }}
                            className={`w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${game.settings.dayNightCycle ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}
                        >
                            {game.settings.dayNightCycle ? 'Cycle: Active' : 'Cycle: Static'}
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Active Weather</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['none', 'rain', 'snow', 'storm'].map((w) => (
                                <button
                                    key={w}
                                    onClick={() => {
                                        const newState = { ...game, settings: { ...game.settings, weather: w as any } };
                                        setGame(newState);
                                        addToHistory(newState);
                                    }}
                                    className={`py-2 rounded-lg border transition-all text-[9px] font-bold uppercase ${game.settings.weather === w ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'}`}
                                >
                                    {w}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-purple-500/5 rounded-2xl border border-purple-500/20 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Trophy className="w-4 h-4 text-purple-400" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-tight">Game Rules</h4>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Win Condition</label>
                        <select 
                            value={game.settings.winCondition || 'reachGoal'}
                            onChange={(e) => {
                                const newState = { ...game, settings: { ...game.settings, winCondition: e.target.value as any } };
                                setGame(newState);
                                addToHistory(newState);
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 appearance-none"
                        >
                            <option value="reachGoal" className="bg-[#0a0f1e]">Reach the Goal</option>
                            <option value="collectAll" className="bg-[#0a0f1e]">Collect All Items</option>
                            <option value="scoreLimit" className="bg-[#0a0f1e]">Reach Score Limit</option>
                            <option value="timer" className="bg-[#0a0f1e]">Survive Until Timer Ends</option>
                        </select>
                    </div>

                    {(game.settings.winCondition === 'scoreLimit' || game.settings.winCondition === 'timer') && (
                        <div className="space-y-2">
                            <label className="text-[10px] text-slate-500 font-bold uppercase">
                                {game.settings.winCondition === 'scoreLimit' ? 'Target Score' : 'Time Limit (Seconds)'}
                            </label>
                            <input 
                                type="number" 
                                value={game.settings.winValue || 100}
                                onChange={(e) => {
                                    const newState = { ...game, settings: { ...game.settings, winValue: parseInt(e.target.value) } };
                                    setGame(newState);
                                }}
                                onBlur={() => addToHistory(game)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-purple-500"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Lose Condition</label>
                        <select 
                            value={game.settings.loseCondition || 'healthZero'}
                            onChange={(e) => {
                                const newState = { ...game, settings: { ...game.settings, loseCondition: e.target.value as any } };
                                setGame(newState);
                                addToHistory(newState);
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-red-500 appearance-none"
                        >
                            <option value="healthZero" className="bg-[#0a0f1e]">Health Reaches Zero</option>
                            <option value="fallOff" className="bg-[#0a0f1e]">Fall Off the World</option>
                            <option value="timer" className="bg-[#0a0f1e]">Time Runs Out</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/20 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Camera className="w-4 h-4 text-blue-400" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-tight">Camera & Physics</h4>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Camera Mode</label>
                        <select 
                            value={game.settings.cameraMode || 'thirdPerson'}
                            onChange={(e) => {
                                const newState = { ...game, settings: { ...game.settings, cameraMode: e.target.value as any } };
                                setGame(newState);
                                addToHistory(newState);
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 appearance-none"
                        >
                            <option value="thirdPerson" className="bg-[#0a0f1e]">Third Person (Follow)</option>
                            <option value="firstPerson" className="bg-[#0a0f1e]">First Person (POV)</option>
                            <option value="topDown" className="bg-[#0a0f1e]">Top Down (Bird's Eye)</option>
                            <option value="orbit" className="bg-[#0a0f1e]">Free Orbit</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase flex justify-between">
                            Camera Distance
                            <span className="text-blue-400">{game.settings.cameraDistance || 10}m</span>
                        </label>
                        <input 
                            type="range" 
                            min="2" max="50" step="1"
                            value={game.settings.cameraDistance || 10}
                            onChange={(e) => {
                                const newState = { ...game, settings: { ...game.settings, cameraDistance: parseInt(e.target.value) } };
                                setGame(newState);
                            }}
                            onMouseUp={() => addToHistory(game)}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center gap-2">
                            <Activity className="w-3 h-3 text-slate-400" />
                            <label className="text-[10px] text-slate-400 font-bold uppercase">World Physics</label>
                        </div>
                        <button 
                            onClick={() => {
                                const newState = { ...game, settings: { ...game.settings, physicsEnabled: !game.settings.physicsEnabled } };
                                setGame(newState);
                                addToHistory(newState);
                            }}
                            className={`w-10 h-5 rounded-full transition-colors relative ${game.settings.physicsEnabled ? 'bg-blue-500' : 'bg-slate-700'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${game.settings.physicsEnabled ? 'right-1' : 'left-1'}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Advanced Rendering Section */}
            <div className="p-4 bg-orange-500/5 rounded-2xl border border-orange-500/20 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                        <Sun className="w-4 h-4 text-orange-400" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-tight">Advanced Rendering</h4>
                </div>

                <div className="space-y-4">
                    {/* Bloom */}
                    <div className="space-y-3 p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] text-slate-400 font-bold uppercase">Bloom (Glow)</label>
                            <button 
                                onClick={() => {
                                    const newState = { 
                                        ...game, 
                                        settings: { 
                                            ...game.settings, 
                                            rendering: { 
                                                ...(game.settings.rendering || {}), 
                                                bloom: { 
                                                    enabled: !game.settings.rendering?.bloom?.enabled,
                                                    intensity: game.settings.rendering?.bloom?.intensity || 1,
                                                    threshold: game.settings.rendering?.bloom?.threshold || 0.9
                                                } 
                                            } 
                                        } 
                                    };
                                    setGame(newState);
                                    addToHistory(newState);
                                }}
                                className={`w-10 h-5 rounded-full transition-colors relative ${game.settings.rendering?.bloom?.enabled ? 'bg-orange-500' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${game.settings.rendering?.bloom?.enabled ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>
                        {game.settings.rendering?.bloom?.enabled && (
                            <div className="space-y-2 pt-2 border-t border-white/5">
                                <label className="text-[9px] text-slate-500 uppercase flex justify-between">
                                    Intensity
                                    <span>{game.settings.rendering.bloom.intensity}</span>
                                </label>
                                <input 
                                    type="range" min="0" max="5" step="0.1"
                                    value={game.settings.rendering.bloom.intensity}
                                    onChange={(e) => {
                                        setGame((prev: any) => ({
                                            ...prev,
                                            settings: {
                                                ...prev.settings,
                                                rendering: { ...prev.settings.rendering, bloom: { ...prev.settings.rendering.bloom, intensity: parseFloat(e.target.value) } }
                                            }
                                        }));
                                    }}
                                    onMouseUp={() => addToHistory(game)}
                                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                />
                            </div>
                        )}
                    </div>

                    {/* SSAO */}
                    <div className="space-y-3 p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] text-slate-400 font-bold uppercase">Ambient Occlusion</label>
                            <button 
                                onClick={() => {
                                    const newState = { 
                                        ...game, 
                                        settings: { 
                                            ...game.settings, 
                                            rendering: { 
                                                ...(game.settings.rendering || {}), 
                                                ssao: { 
                                                    enabled: !game.settings.rendering?.ssao?.enabled,
                                                    intensity: game.settings.rendering?.ssao?.intensity || 1.5,
                                                    radius: game.settings.rendering?.ssao?.radius || 0.4
                                                } 
                                            } 
                                        } 
                                    };
                                    setGame(newState);
                                    addToHistory(newState);
                                }}
                                className={`w-10 h-5 rounded-full transition-colors relative ${game.settings.rendering?.ssao?.enabled ? 'bg-orange-500' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${game.settings.rendering?.ssao?.enabled ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Vignette */}
                    <div className="space-y-3 p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] text-slate-400 font-bold uppercase">Vignette</label>
                            <button 
                                onClick={() => {
                                    const newState = { 
                                        ...game, 
                                        settings: { 
                                            ...game.settings, 
                                            rendering: { 
                                                ...(game.settings.rendering || {}), 
                                                vignette: { 
                                                    enabled: !game.settings.rendering?.vignette?.enabled,
                                                    offset: game.settings.rendering?.vignette?.offset || 0.5,
                                                    darkness: game.settings.rendering?.vignette?.darkness || 0.5
                                                } 
                                            } 
                                        } 
                                    };
                                    setGame(newState);
                                    addToHistory(newState);
                                }}
                                className={`w-10 h-5 rounded-full transition-colors relative ${game.settings.rendering?.vignette?.enabled ? 'bg-orange-500' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${game.settings.rendering?.vignette?.enabled ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
