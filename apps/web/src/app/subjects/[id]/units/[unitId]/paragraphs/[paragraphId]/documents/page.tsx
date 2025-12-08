'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

import { Plus, FileText, BookOpen, Folder, Grid, ArrowLeft, MoreVertical, Edit2, Trash2, Globe } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ResourceContextMenu from '@/components/ResourceContextMenu';

interface Folder {
    id: string;
    name: string;
    description: string | null;
    color: string;
    icon: string;
    order_index: number;
}

interface Document {
    id: string;
    title: string;
    document_type: 'text' | 'youtube' | 'image' | 'html';
    folder_id: string | null;
    is_global: boolean;
    created_at: string;
}

interface LearningSet {
    id: string;
    title: string;
    description: string | null;
    folder_id: string | null;
    is_public: boolean;
    created_at: string;
}

export default function EnhancedDocumentsPage() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const params = useParams();
    const paragraphId = params.paragraphId as string;

    const [paragraph, setParagraph] = useState<any>(null);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [learningSets, setLearningSets] = useState<LearningSet[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [resourceMenu, setResourceMenu] = useState<{ x: number; y: number; resource: any; type: string } | null>(null);
    const [editingResource, setEditingResource] = useState<{ id: string; type: string } | null>(null);

    useEffect(() => {
        if (user && paragraphId) {
            fetchData();

            // Real-time subscriptions
            const docsChannel = supabase
                .channel('docs-changes')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'documents', filter: `paragraph_id=eq.${paragraphId}` },
                    () => fetchData()
                )
                .subscribe();

            const foldersChannel = supabase
                .channel('folders-changes')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'folders', filter: `paragraph_id=eq.${paragraphId}` },
                    () => fetchData()
                )
                .subscribe();

            const setsChannel = supabase
                .channel('sets-changes')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'learning_sets', filter: `paragraph_id=eq.${paragraphId}` },
                    () => fetchData()
                )
                .subscribe();

            return () => {
                supabase.removeChannel(docsChannel);
                supabase.removeChannel(foldersChannel);
                supabase.removeChannel(setsChannel);
            };
        }
    }, [user, paragraphId]);

    const fetchData = async () => {
        setLoading(true);

        // Fetch paragraph
        const { data: paragraphData } = await supabase
            .from('paragraphs')
            .select('*')
            .eq('id', paragraphId)
            .single();

        if (paragraphData) setParagraph(paragraphData);

        // Fetch folders
        const { data: foldersData } = await supabase
            .from('folders')
            .select('*')
            .eq('paragraph_id', paragraphId)
            .order('order_index');

        if (foldersData) setFolders(foldersData);

        // Fetch documents
        const { data: documentsData } = await supabase
            .from('documents')
            .select('*')
            .eq('paragraph_id', paragraphId)
            .order('created_at', { ascending: false });

        if (documentsData) setDocuments(documentsData);

        // Fetch learning sets
        const { data: setsData } = await supabase
            .from('learning_sets')
            .select('*')
            .eq('paragraph_id', paragraphId)
            .order('created_at', { ascending: false });

        if (setsData) setLearningSets(setsData);

        setLoading(false);
    };

    const handleCreateFolder = async () => {
        if (!user || !newFolderName.trim()) return;

        const { data, error } = await supabase
            .from('folders')
            .insert([{
                paragraph_id: paragraphId,
                user_id: user.id,
                name: newFolderName,
                order_index: folders.length
            }])
            .select()
            .single();

        if (!error && data) {
            setShowFolderModal(false);
            setNewFolderName('');
            fetchData();
        }
    };

    const handleCreateDocument = () => {
        router.push(`/subjects/${params.id}/units/${params.unitId}/paragraphs/${paragraphId}/documents/create`);
    };

    const handleCreateLearningSet = () => {
        router.push(`/subjects/${params.id}/units/${params.unitId}/paragraphs/${paragraphId}/learning-sets/create`);
    };

    const handleResourceContextMenu = (e: React.MouseEvent, resource: any, type: string) => {
        e.preventDefault();
        e.stopPropagation();
        setResourceMenu({ x: e.clientX, y: e.clientY, resource, type });
    };

    const handleToggleGlobal = async (resource: any, type: string) => {
        const table = type === 'document' ? 'documents' : type === 'learning_set' ? 'learning_sets' : 'folders';
        const field = type === 'learning_set' ? 'is_public' : 'is_global';
        const currentValue = type === 'learning_set' ? resource.is_public : resource.is_global;

        await supabase
            .from(table)
            .update({ [field]: !currentValue })
            .eq('id', resource.id);

        fetchData();
        setResourceMenu(null);
    };

    const handleRename = (resource: any, type: string) => {
        setEditingResource({ id: resource.id, type });
        setResourceMenu(null);
    };

    const handleSaveRename = async (newTitle: string) => {
        if (!editingResource) return;

        const table = editingResource.type === 'document' ? 'documents' :
            editingResource.type === 'learning_set' ? 'learning_sets' : 'folders';
        const field = editingResource.type === 'folder' ? 'name' : 'title';

        await supabase
            .from(table)
            .update({ [field]: newTitle })
            .eq('id', editingResource.id);

        setEditingResource(null);
        fetchData();
    };

    const handleDelete = async (resource: any, type: string) => {
        if (!confirm(`Delete this ${type}?`)) return;

        const table = type === 'document' ? 'documents' : type === 'learning_set' ? 'learning_sets' : 'folders';

        await supabase
            .from(table)
            .delete()
            .eq('id', resource.id);

        setResourceMenu(null);
        fetchData();
    };

    const getResourceMenuItems = (resource: any, type: string) => {
        const items = [];

        if (profile?.is_admin) {
            items.push({
                icon: <Globe className="w-4 h-4" />,
                label: (type === 'learning_set' ? resource.is_public : resource.is_global) ? 'Make Private' : 'Make Global',
                onClick: () => handleToggleGlobal(resource, type)
            });
        }

        items.push(
            {
                icon: <Edit2 className="w-4 h-4" />,
                label: 'Rename',
                onClick: () => handleRename(resource, type)
            },
            {
                icon: <Trash2 className="w-4 h-4" />,
                label: 'Delete',
                onClick: () => handleDelete(resource, type),
                danger: true
            }
        );

        return items;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-8 relative">
            

            <div className="flex-1 relative">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </button>

                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-white mb-2">
                                {paragraph?.title || 'Resources'}
                            </h1>
                            <p className="text-slate-400">Documents, learning sets, and folders</p>
                        </div>

                        <button
                            onClick={() => setShowAddModal(true)}
                            className="glass-button p-4 rounded-xl hover:scale-105 transition-transform"
                        >
                            <Plus className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Folders */}
                    {folders.length > 0 && (
                        <div className="mb-10">
                            <h2 className="text-xl font-bold text-white mb-4">Folders</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {folders.map((folder) => (
                                    <div
                                        key={folder.id}
                                        className="glass-card p-6 hover:bg-white/5 transition-colors cursor-pointer"
                                        onClick={() => {/* Navigate to folder view */ }}
                                        onContextMenu={(e) => handleResourceContextMenu(e, folder, 'folder')}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <Folder className="w-8 h-8 text-blue-400" />
                                            {profile?.is_admin && folder.is_global && (
                                                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded border border-purple-500/30">
                                                    Global
                                                </span>
                                            )}
                                        </div>
                                        {editingResource?.id === folder.id && editingResource.type === 'folder' ? (
                                            <input
                                                type="text"
                                                defaultValue={folder.name}
                                                onBlur={(e) => handleSaveRename(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(e.currentTarget.value)}
                                                className="w-full bg-slate-800/50 border border-blue-500 rounded px-2 py-1 text-white"
                                                autoFocus
                                            />
                                        ) : (
                                            <h3 className="text-white font-bold">{folder.name}</h3>
                                        )}
                                        {folder.description && (
                                            <p className="text-slate-400 text-sm mt-2">{folder.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Documents */}
                    {documents.length > 0 && (
                        <div className="mb-10">
                            <h2 className="text-xl font-bold text-white mb-4">Documents</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="glass-card p-6 hover:bg-white/5 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/subjects/${params.id}/units/${params.unitId}/paragraphs/${paragraphId}/documents/${doc.id}`)}
                                        onContextMenu={(e) => handleResourceContextMenu(e, doc, 'document')}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <FileText className="w-8 h-8 text-green-400" />
                                            {profile?.is_admin && doc.is_global && (
                                                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded border border-purple-500/30">
                                                    Global
                                                </span>
                                            )}
                                        </div>
                                        {editingResource?.id === doc.id && editingResource.type === 'document' ? (
                                            <input
                                                type="text"
                                                defaultValue={doc.title}
                                                onBlur={(e) => handleSaveRename(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(e.currentTarget.value)}
                                                className="w-full bg-slate-800/50 border border-blue-500 rounded px-2 py-1 text-white"
                                                autoFocus
                                            />
                                        ) : (
                                            <h3 className="text-white font-bold">{doc.title}</h3>
                                        )}

                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Learning Sets */}
                    {learningSets.length > 0 && (
                        <div className="mb-10">
                            <h2 className="text-xl font-bold text-white mb-4">Learning Sets</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {learningSets.map((set) => (
                                    <div
                                        key={set.id}
                                        className="glass-card p-6 hover:bg-white/5 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/subjects/${params.id}/units/${params.unitId}/paragraphs/${paragraphId}/learning-sets/${set.id}`)}
                                        onContextMenu={(e) => handleResourceContextMenu(e, set, 'learning_set')}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <BookOpen className="w-8 h-8 text-purple-400" />
                                            {profile?.is_admin && set.is_public && (
                                                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded border border-purple-500/30">
                                                    Global
                                                </span>
                                            )}
                                        </div>
                                        {editingResource?.id === set.id && editingResource.type === 'learning_set' ? (
                                            <input
                                                type="text"
                                                defaultValue={set.title}
                                                onBlur={(e) => handleSaveRename(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(e.currentTarget.value)}
                                                className="w-full bg-slate-800/50 border border-blue-500 rounded px-2 py-1 text-white"
                                                autoFocus
                                            />
                                        ) : (
                                            <h3 className="text-white font-bold">{set.title}</h3>
                                        )}
                                        {set.description && (
                                            <p className="text-slate-400 text-sm mt-2">{set.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {folders.length === 0 && documents.length === 0 && learningSets.length === 0 && (
                        <div className="text-center py-20">
                            <Grid className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">No resources yet</h3>
                            <p className="text-slate-400 mb-6">Click the + button to add your first resource</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Resource Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="glass-card p-8 w-full max-w-2xl">
                        <h2 className="text-2xl font-bold text-white mb-6">Add Resource</h2>
                        <div className="grid grid-cols-3 gap-4">
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    handleCreateLearningSet();
                                }}
                                className="glass-card p-8 hover:bg-white/10 transition-all flex flex-col items-center gap-4 group"
                            >
                                <BookOpen className="w-12 h-12 text-purple-400 group-hover:scale-110 transition-transform" />
                                <span className="text-white font-medium">Learning Set</span>
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    handleCreateDocument();
                                }}
                                className="glass-card p-8 hover:bg-white/10 transition-all flex flex-col items-center gap-4 group"
                            >
                                <FileText className="w-12 h-12 text-green-400 group-hover:scale-110 transition-transform" />
                                <span className="text-white font-medium">Document</span>
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setShowFolderModal(true);
                                }}
                                className="glass-card p-8 hover:bg-white/10 transition-all flex flex-col items-center gap-4 group"
                            >
                                <Folder className="w-12 h-12 text-blue-400 group-hover:scale-110 transition-transform" />
                                <span className="text-white font-medium">Folder</span>
                            </button>
                        </div>
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="w-full mt-6 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Create Folder Modal */}
            {showFolderModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="glass-card p-8 w-full max-w-md">
                        <h2 className="text-2xl font-bold text-white mb-6">Create Folder</h2>
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="Folder name"
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white mb-6 focus:outline-none focus:border-blue-500"
                            autoFocus
                        />
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setShowFolderModal(false);
                                    setNewFolderName('');
                                }}
                                className="flex-1 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateFolder}
                                className="flex-1 glass-button rounded-lg"
                                disabled={!newFolderName.trim()}
                            >
                                Create Folder
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resource Context Menu */}
            {resourceMenu && (
                <ResourceContextMenu
                    position={{ x: resourceMenu.x, y: resourceMenu.y }}
                    resourceType={resourceMenu.type as any}
                    isAdmin={profile?.is_admin || false}
                    isGlobal={(resourceMenu.type === 'learning_set' ? resourceMenu.resource.is_public : resourceMenu.resource.is_global) || false}
                    onClose={() => setResourceMenu(null)}
                    items={getResourceMenuItems(resourceMenu.resource, resourceMenu.type)}
                />
            )}
        </div>
    );
}
