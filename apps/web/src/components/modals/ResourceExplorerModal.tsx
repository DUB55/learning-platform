'use client';

import React, { useState, useEffect } from 'react';
import { 
    X, 
    Search, 
    ChevronRight, 
    Folder, 
    FileText, 
    Brain, 
    FileQuestion, 
    Star, 
    Clock, 
    Monitor, 
    HardDrive,
    ArrowLeft,
    ArrowRight,
    Home,
    LayoutGrid,
    List,
    MoreVertical,
    ChevronDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface ResourceExplorerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (resource: any) => void;
    title?: string;
}

type ExplorerPath = {
    id: string;
    name: string;
    type: 'root' | 'subject' | 'unit' | 'paragraph';
};

export default function ResourceExplorerModal({ 
    isOpen, 
    onClose, 
    onSelect,
    title = "Select Study Material"
}: ResourceExplorerModalProps) {
    const { user } = useAuth();
    const [path, setPath] = useState<ExplorerPath[]>([{ id: 'root', name: 'This PC', type: 'root' }]);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const currentPath = path[path.length - 1];

    useEffect(() => {
        if (isOpen && user) {
            fetchItems();
        }
    }, [isOpen, path, user]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            if (currentPath.type === 'root') {
                const { data } = await supabase
                    .from('subjects')
                    .select('*')
                    .eq('user_id', user!.id);
                setItems(data?.map(s => ({ ...s, type: 'subject' })) || []);
            } else if (currentPath.type === 'subject') {
                const { data } = await supabase
                    .from('units')
                    .select('*')
                    .eq('subject_id', currentPath.id);
                setItems(data?.map(u => ({ ...u, type: 'unit' })) || []);
            } else if (currentPath.type === 'unit') {
                const { data } = await supabase
                    .from('paragraphs')
                    .select('*')
                    .eq('unit_id', currentPath.id);
                setItems(data?.map(p => ({ ...p, type: 'paragraph' })) || []);
            } else if (currentPath.type === 'paragraph') {
                // Fetch learning sets for this paragraph
                const { data: leersets } = await supabase
                    .from('leersets')
                    .select('*')
                    .eq('paragraph_id', currentPath.id);
                
                setItems(leersets?.map(l => ({ ...l, type: 'leerset' })) || []);
            }
        } catch (error) {
            console.error('Error fetching explorer items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleItemClick = (item: any) => {
        if (item.type === 'leerset') {
            onSelect(item);
            onClose();
        } else {
            setPath([...path, { id: item.id, name: item.title, type: item.type }]);
        }
    };

    const navigateBack = () => {
        if (path.length > 1) {
            setPath(path.slice(0, -1));
        }
    };

    const navigateToRoot = () => {
        setPath([{ id: 'root', name: 'This PC', type: 'root' }]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-5xl h-[80vh] bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded-lg shadow-2xl overflow-hidden flex flex-col border border-white/10 text-slate-900 dark:text-slate-200 font-sans">
                {/* Title Bar (Windows Style) */}
                <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-[#2d2d2d] border-b border-black/10 dark:border-white/5 select-none">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center">
                            <Monitor className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-medium">{title}</span>
                    </div>
                    <div className="flex items-center">
                        <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <div className="w-3 h-0.5 bg-current" />
                        </button>
                        <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <div className="w-3 h-3 border border-current" />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-red-500 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#2d2d2d] border-b border-black/10 dark:border-white/5">
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={navigateBack}
                            disabled={path.length <= 1}
                            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <button 
                            disabled={true}
                            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30"
                        >
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={navigateToRoot}
                            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5"
                        >
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Address Bar */}
                    <div className="flex-1 flex items-center gap-1 px-2 py-1 bg-[#f0f0f0] dark:bg-[#3c3c3c] border border-black/10 dark:border-white/10 rounded text-xs overflow-hidden">
                        <Home className="w-3 h-3 text-blue-500 shrink-0" />
                        <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                        {path.map((p, i) => (
                            <React.Fragment key={p.id}>
                                <button 
                                    onClick={() => setPath(path.slice(0, i + 1))}
                                    className="hover:bg-black/5 dark:hover:bg-white/5 px-1 rounded whitespace-nowrap"
                                >
                                    {p.name}
                                </button>
                                {i < path.length - 1 && <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Search Bar */}
                    <div className="w-48 relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input 
                            type="text"
                            placeholder={`Search ${currentPath.name}`}
                            className="w-full bg-[#f0f0f0] dark:bg-[#3c3c3c] border border-black/10 dark:border-white/10 rounded pl-8 pr-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-48 bg-white dark:bg-[#2d2d2d] border-r border-black/10 dark:border-white/5 overflow-y-auto p-2 hidden md:block">
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-1 tracking-wider">Quick access</h4>
                                <div className="space-y-0.5">
                                    <button className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-blue-500/10 hover:text-blue-500 text-xs text-left transition-colors">
                                        <Star className="w-3.5 h-3.5 text-yellow-500" />
                                        <span>Favorites</span>
                                    </button>
                                    <button className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-blue-500/10 hover:text-blue-500 text-xs text-left transition-colors">
                                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                                        <span>Recent</span>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-1 tracking-wider">This PC</h4>
                                <div className="space-y-0.5">
                                    <button 
                                        onClick={navigateToRoot}
                                        className={`w-full flex items-center gap-2 px-2 py-1 rounded text-xs text-left transition-colors ${currentPath.type === 'root' ? 'bg-blue-500/20 text-blue-500' : 'hover:bg-blue-500/10 hover:text-blue-500'}`}
                                    >
                                        <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                                        <span>My Library</span>
                                    </button>
                                    <button className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-blue-500/10 hover:text-blue-500 text-xs text-left transition-colors">
                                        <Folder className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Subjects</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* File Grid */}
                    <div className="flex-1 bg-white dark:bg-[#1e1e1e] overflow-y-auto p-4">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : items.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Folder className="w-12 h-12 mb-2 opacity-20" />
                                <p className="text-sm italic">This folder is empty.</p>
                            </div>
                        ) : (
                            <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" : "flex flex-col gap-1"}>
                                {items.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleItemClick(item)}
                                        className={viewMode === 'grid' 
                                            ? "group flex flex-col items-center p-2 rounded hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 cursor-pointer transition-all text-center"
                                            : "flex items-center gap-3 px-3 py-1.5 rounded hover:bg-blue-500/10 cursor-pointer transition-all"
                                        }
                                    >
                                        <div className={viewMode === 'grid' ? "w-16 h-16 flex items-center justify-center mb-2" : "w-6 h-6 flex items-center justify-center"}>
                                            {item.type === 'subject' && <Folder className="w-12 h-12 text-blue-500 fill-blue-500/20" />}
                                            {item.type === 'unit' && <Folder className="w-12 h-12 text-amber-500 fill-amber-500/20" />}
                                            {item.type === 'paragraph' && <Folder className="w-12 h-12 text-emerald-500 fill-emerald-500/20" />}
                                            {item.type === 'leerset' && <Brain className="w-12 h-12 text-purple-500" />}
                                        </div>
                                        <div className={viewMode === 'grid' ? "" : "flex-1"}>
                                            <p className="text-xs font-medium truncate max-w-[120px]">{item.title}</p>
                                            <p className="text-[10px] text-slate-500">
                                                {item.type === 'subject' && 'Subject'}
                                                {item.type === 'unit' && 'Chapter'}
                                                {item.type === 'paragraph' && 'Paragraph'}
                                                {item.type === 'leerset' && 'Learning Set'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Bar */}
                <div className="px-3 py-1 bg-[#f0f0f0] dark:bg-[#2d2d2d] border-t border-black/10 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-500 select-none">
                    <div className="flex items-center gap-4">
                        <span>{items.length} items</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-1 rounded ${viewMode === 'grid' ? 'bg-black/10 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                        >
                            <LayoutGrid className="w-3 h-3" />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-1 rounded ${viewMode === 'list' ? 'bg-black/10 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                        >
                            <List className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
