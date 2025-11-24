'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Plus, Search, FileText, Link as LinkIcon, Video, Image as ImageIcon, MoreVertical, Trash2, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

type Resource = Database['public']['Tables']['resources']['Row'];

export default function LibraryPage() {
    const { user } = useAuth();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // New Resource State
    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [newType, setNewType] = useState<Resource['type']>('link');

    useEffect(() => {
        if (user) {
            fetchResources();
        }
    }, [user]);

    const fetchResources = async () => {
        try {
            const { data, error } = await supabase
                .from('resources')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setResources(data);
        } catch (error) {
            console.error('Error fetching resources:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddResource = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newTitle.trim() || !newUrl.trim()) return;

        try {
            const { data, error } = await supabase
                .from('resources')
                .insert([
                    {
                        user_id: user.id,
                        title: newTitle,
                        url: newUrl,
                        type: newType
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            setResources([data, ...resources]);
            setIsAdding(false);
            setNewTitle('');
            setNewUrl('');
            setNewType('link');
        } catch (error) {
            console.error('Error adding resource:', error);
        }
    };

    const handleDeleteResource = async (id: string) => {
        try {
            const { error } = await supabase
                .from('resources')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setResources(resources.filter(r => r.id !== id));
        } catch (error) {
            console.error('Error deleting resource:', error);
        }
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText className="w-5 h-5 text-red-400" />;
            case 'video': return <Video className="w-5 h-5 text-blue-400" />;
            case 'image': return <ImageIcon className="w-5 h-5 text-purple-400" />;
            default: return <LinkIcon className="w-5 h-5 text-emerald-400" />;
        }
    };

    const filteredResources = resources.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto relative p-8">
                <div className="max-w-6xl mx-auto">
                    <header className="mb-10 flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-white mb-2">Library</h1>
                            <p className="text-slate-400">Manage your study materials and resources</p>
                        </div>
                        <button
                            onClick={() => setIsAdding(!isAdding)}
                            className="glass-button px-4 py-2 rounded-xl flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Add Resource</span>
                        </button>
                    </header>

                    {/* Add Resource Form */}
                    {isAdding && (
                        <div className="glass-card p-6 mb-8 animate-fade-in">
                            <h3 className="text-lg font-medium text-white mb-4">Add New Resource</h3>
                            <form onSubmit={handleAddResource} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-400">Title</label>
                                        <input
                                            type="text"
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            placeholder="e.g., Calculus Textbook"
                                            className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-400">Type</label>
                                        <select
                                            value={newType}
                                            onChange={(e) => setNewType(e.target.value as any)}
                                            className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="link">Link</option>
                                            <option value="pdf">PDF</option>
                                            <option value="video">Video</option>
                                            <option value="image">Image</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400">URL</label>
                                    <input
                                        type="url"
                                        value={newUrl}
                                        onChange={(e) => setNewUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsAdding(false)}
                                        className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newTitle || !newUrl}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        Save Resource
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Search */}
                    <div className="relative mb-8">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search resources..."
                            className="w-full bg-slate-800/30 border border-white/5 rounded-xl px-4 py-3 pl-12 text-white focus:outline-none focus:border-white/10 transition-colors"
                        />
                    </div>

                    {/* Resources Grid */}
                    {loading ? (
                        <div className="text-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                        </div>
                    ) : filteredResources.length === 0 ? (
                        <div className="text-center py-20 text-slate-500">
                            <p>No resources found. Add one to get started!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredResources.map((resource) => (
                                <div key={resource.id} className="glass-card p-4 group hover:bg-white/5 transition-all">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="p-2 rounded-lg bg-slate-800/50 border border-white/5">
                                            {getIconForType(resource.type)}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteResource(resource.id)}
                                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <h3 className="font-medium text-white mb-1 truncate" title={resource.title}>
                                        {resource.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 mb-4">
                                        Added {new Date(resource.created_at).toLocaleDateString()}
                                    </p>

                                    <a
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        <span>Open Resource</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
