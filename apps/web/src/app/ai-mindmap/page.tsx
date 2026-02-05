'use client';

import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
    Sparkles, Network, Download,
    ZoomIn, ZoomOut, RefreshCw, Loader2, RotateCcw
} from 'lucide-react';
import { dub5ai } from '@/lib/dub5ai';
import ErrorLogger from '@/lib/ErrorLogger';
import { useEffect } from 'react';

interface MindMapNode {
    id: string;
    label: string;
    children?: MindMapNode[];
    color?: string;
}

export default function AIMindMapPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [mindMapData, setMindMapData] = useState<MindMapNode | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
    const [error, setError] = useState('');
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [recentMindmaps, setRecentMindmaps] = useState<any[]>([]);

    const generateMindMap = async () => {
        if (!topic.trim()) return;

        setIsGenerating(true);
        setError('');

        try {
            const prompt = `Create a comprehensive mind map for the topic: "${topic}".
            
Return ONLY a valid JSON object with this structure (no markdown, no code blocks):
{
    "id": "root",
    "label": "Main Topic",
    "children": [
        {
            "id": "1",
            "label": "Subtopic 1",
            "color": "#3b82f6",
            "children": [
                { "id": "1-1", "label": "Detail 1", "color": "#60a5fa" },
                { "id": "1-2", "label": "Detail 2", "color": "#60a5fa" }
            ]
        },
        {
            "id": "2",
            "label": "Subtopic 2",
            "color": "#8b5cf6",
            "children": [
                { "id": "2-1", "label": "Detail 1", "color": "#a78bfa" }
            ]
        }
    ]
}

Include 4-6 main subtopics, each with 2-4 children. Use varied colors from this palette: #3b82f6 (blue), #8b5cf6 (purple), #10b981 (green), #f59e0b (amber), #ef4444 (red), #ec4899 (pink).`;

            const response = await dub5ai.streamRequest(prompt, {
                task: 'mindmap',
                params: { topic }
            });

            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                setMindMapData(parsed);
                setPan({ x: 0, y: 0 });
                setZoom(1);
                try {
                    const local = JSON.parse(localStorage.getItem('local_mindmaps') || '[]');
                    const entry = { id: crypto.randomUUID(), title: topic, data: parsed, createdAt: new Date().toISOString() };
                    local.unshift(entry);
                    localStorage.setItem('local_mindmaps', JSON.stringify(local.slice(0, 20)));
                    setRecentMindmaps(local.slice(0, 20));
                } catch {}
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err: any) {
            ErrorLogger.error('Mind map generation error', err);
            setError(err.message || 'Failed to generate mind map');
        } finally {
            setIsGenerating(false);
        }
    };

    // Handle mouse wheel zoom
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(z => Math.max(0.3, Math.min(3, z * delta)));
    }, []);

    // Handle pan start
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 0) {
            setIsPanning(true);
            setLastPanPoint({ x: e.clientX, y: e.clientY });
        }
    }, []);

    // Handle pan move
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isPanning) {
            const dx = e.clientX - lastPanPoint.x;
            const dy = e.clientY - lastPanPoint.y;
            setPan(p => ({ x: p.x + dx, y: p.y + dy }));
            setLastPanPoint({ x: e.clientX, y: e.clientY });
        }
    }, [isPanning, lastPanPoint]);

    // Handle pan end
    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
    }, []);

    // Export as PNG
    const exportAsPNG = useCallback(async () => {
        if (!svgRef.current) return;

        try {
            const svgData = new XMLSerializer().serializeToString(svgRef.current);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 1600;
                canvas.height = 1200;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, 1600, 1200);

                    const link = document.createElement('a');
                    link.download = `mindmap-${topic.replace(/\s+/g, '-')}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                }
                URL.revokeObjectURL(url);
            };
            img.src = url;
        } catch (err) {
            ErrorLogger.error('Mind map export failed', err);
        }
    }, [topic]);

    // Reset view
    const resetView = useCallback(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, []);

    const renderNode = (node: MindMapNode, level: number = 0, parentAngle: number = 0, index: number = 0, total: number = 1) => {
        const isRoot = level === 0;
        const baseRadius = isRoot ? 0 : 140 + level * 100;
        const angleSpread = level === 1 ? 360 : 50;
        const startAngle = level === 1 ? -90 : parentAngle - angleSpread / 2;
        const angle = level === 1
            ? startAngle + (360 / total) * index
            : startAngle + (angleSpread / (total + 1)) * (index + 1);

        const centerX = 800;
        const centerY = 600;
        const x = isRoot ? centerX : centerX + Math.cos((angle * Math.PI) / 180) * baseRadius;
        const y = isRoot ? centerY : centerY + Math.sin((angle * Math.PI) / 180) * baseRadius;

        const nodeWidth = isRoot ? 180 : level === 1 ? 140 : 120;
        const nodeHeight = isRoot ? 80 : level === 1 ? 60 : 50;
        const fontSize = isRoot ? 16 : level === 1 ? 13 : 11;
        const bgColor = node.color || (isRoot ? '#3b82f6' : '#1e293b');

        return (
            <g key={node.id}>
                {/* Connection line to parent */}
                {!isRoot && (
                    <path
                        d={`M ${centerX} ${centerY} Q ${(centerX + x) / 2} ${(centerY + y) / 2 - 20} ${x} ${y}`}
                        fill="none"
                        stroke={node.color || '#475569'}
                        strokeWidth={level === 1 ? 2.5 : 1.5}
                        strokeOpacity={0.6}
                    />
                )}

                {/* Node */}
                <g transform={`translate(${x - nodeWidth / 2}, ${y - nodeHeight / 2})`}>
                    <rect
                        width={nodeWidth}
                        height={nodeHeight}
                        rx={12}
                        fill={bgColor}
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth={1}
                    />
                    <text
                        x={nodeWidth / 2}
                        y={nodeHeight / 2}
                        fill="white"
                        fontSize={fontSize}
                        fontWeight={isRoot ? 700 : 600}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{ fontFamily: 'system-ui, sans-serif' }}
                    >
                        {node.label.length > 20 ? node.label.slice(0, 20) + '...' : node.label}
                    </text>
                </g>

                {/* Render children */}
                {node.children?.map((child, i) =>
                    renderNode(child, level + 1, angle, i, node.children!.length)
                )}
            </g>
        );
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    useEffect(() => {
        try {
            const local = JSON.parse(localStorage.getItem('local_mindmaps') || '[]');
            setRecentMindmaps(local);
        } catch {
            setRecentMindmaps([]);
        }
    }, []);

    return (
        <div className="h-full">
            <div className="p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 max-w-6xl mx-auto">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-white flex items-center gap-3 mb-2">
                            <Network className="w-8 h-8 text-purple-400" />
                            AI Mind Map Generator
                        </h1>
                        <p className="text-slate-400">Powered by DUB5 AI</p>
                    </div>

                    {mindMapData && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setZoom(z => Math.max(0.3, z - 0.2))}
                                className="p-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-colors"
                            >
                                <ZoomOut size={18} />
                            </button>
                            <span className="text-slate-400 text-sm w-14 text-center">{Math.round(zoom * 100)}%</span>
                            <button
                                onClick={() => setZoom(z => Math.min(3, z + 0.2))}
                                className="p-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-colors"
                            >
                                <ZoomIn size={18} />
                            </button>
                            <button
                                onClick={resetView}
                                className="p-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-colors ml-2"
                                title="Reset View"
                            >
                                <RotateCcw size={18} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Input Section */}
                <div className="max-w-2xl mx-auto mb-6">
                    <div className="glass-card p-6">
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && generateMindMap()}
                                placeholder="Enter a topic (e.g., 'Photosynthesis', 'World War II')"
                                className="flex-1 bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
                            />
                            <button
                                onClick={generateMindMap}
                                disabled={isGenerating || !topic.trim()}
                                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Generate
                                    </>
                                )}
                            </button>
                        </div>
                        {error && (
                            <p className="mt-3 text-red-400 text-sm">{error}</p>
                        )}
                    </div>
                </div>

                {!mindMapData && recentMindmaps.length > 0 && (
                    <div className="glass-card p-6 mb-8 max-w-6xl mx-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-bold">Recent Mind Maps</h3>
                            <button
                                className="text-slate-400 text-sm hover:text-white"
                                onClick={() => {
                                    localStorage.removeItem('local_mindmaps');
                                    setRecentMindmaps([]);
                                }}
                            >
                                Clear List
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {recentMindmaps.slice(0, 8).map((mm) => (
                                <button
                                    key={mm.id}
                                    className="p-3 rounded-lg bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-colors"
                                    onClick={() => {
                                        setTopic(mm.title);
                                        setMindMapData(mm.data);
                                        setZoom(1);
                                        setPan({ x: 0, y: 0 });
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center text-purple-400">
                                            <Network className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{mm.title}</p>
                                            <p className="text-slate-500 text-xs">{new Date(mm.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Mind Map Canvas */}
                {mindMapData ? (
                    <div className="max-w-6xl mx-auto">
                        <div
                            ref={containerRef}
                            className="glass-card overflow-hidden cursor-grab active:cursor-grabbing"
                            style={{ height: '600px' }}
                            onWheel={handleWheel}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            <svg
                                ref={svgRef}
                                width="100%"
                                height="100%"
                                viewBox="0 0 1600 1200"
                                style={{
                                    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                                    transformOrigin: 'center center'
                                }}
                            >
                                <defs>
                                    <filter id="glow">
                                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                        <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                <g filter="url(#glow)">
                                    {renderNode(mindMapData)}
                                </g>
                            </svg>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-center gap-4 mt-6">
                            <button
                                onClick={() => generateMindMap()}
                                className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 flex items-center gap-2 transition-colors"
                            >
                                <RefreshCw size={18} />
                                Regenerate
                            </button>
                            <button
                                onClick={exportAsPNG}
                                className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 flex items-center gap-2 transition-colors"
                            >
                                <Download size={18} />
                                Export as PNG
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="glass-card p-12 text-center max-w-2xl mx-auto">
                        <Network className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">Create Your Mind Map</h3>
                        <p className="text-slate-400">
                            Enter a topic above and let DUB5 AI generate a comprehensive mind map for you.
                            Perfect for studying, brainstorming, or organizing your thoughts.
                        </p>
                        <p className="text-slate-500 text-sm mt-4">
                            Tip: Use mouse wheel to zoom, click and drag to pan
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

