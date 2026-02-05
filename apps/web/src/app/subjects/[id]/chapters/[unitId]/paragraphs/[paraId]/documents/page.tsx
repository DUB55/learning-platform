 'use client';
 
 import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, FileText, Plus, Brain, FileQuestion, HelpCircle, MoreVertical, FileCode, Video, Image as ImageIcon, File, MonitorPlay, Edit2, Trash2, Globe, Lock, Eye } from 'lucide-react';
import ResourceContextMenu from '@/components/ResourceContextMenu';
import ResourceMenu from '@/components/ResourceMenu';

type ContentItem = {
  id: string;
  paragraph_id?: string | null;
  unit_id?: string | null; // Used for quizzes
  title: string;
  description?: string | null;
  created_at: string | null;
  type: 'smart_note' | 'learning_set' | 'quiz' | 'html' | 'video' | 'image' | 'pdf' | 'powerpoint' | 'txt';
  visibility?: 'global' | 'admin';
  content?: any;
};

export default function ParagraphDocumentsPage() {
  const { profile } = useAuth();
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id as string;
  const unitId = params.unitId as string;
  const paraId = params.paraId as string;

  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState<{ x: number; y: number } | null>(null);
  const [showAddModal, setShowAddModal] = useState<{ type: ContentItem['type'] } | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemUrl, setNewItemUrl] = useState('');
  const [newItemContent, setNewItemContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string, title: string } | null>(null);
  
  const addControllerRef = useRef<AbortController | null>(null);

  const handleInlineRename = async (itemId: string, newTitle: string) => {
    if (!newTitle.trim() || newTitle === editingItem?.title) {
      setEditingItem(null);
      return;
    }

    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      const table = item.type === 'learning_set' ? 'learning_sets' : 
                   item.type === 'quiz' ? 'quizzes' : 'documents';

      const { error } = await (supabase.from(table) as any)
        .update({ title: newTitle })
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.map(i => i.id === itemId ? { ...i, title: newTitle } : i));
    } catch (error) {
      console.error('Error renaming item:', error);
    } finally {
      setEditingItem(null);
    }
  };

  const fetchAllContent = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      // Fetch everything in parallel
      const [docsRes, setsRes, quizzesRes] = await Promise.all([
        (supabase.from('documents') as any)
          .select('id,title,created_at,paragraph_id,document_type,content')
          .eq('paragraph_id', paraId)
          .abortSignal(signal),
        (supabase.from('learning_sets') as any)
          .select('id,title,description,created_at,paragraph_id')
          .eq('paragraph_id', paraId)
          .abortSignal(signal),
        (supabase.from('quizzes') as any)
          .select('id,title,description,created_at,unit_id')
          .eq('unit_id', paraId)
          .abortSignal(signal)
      ]);

      const docs = docsRes.data;
      const sets = setsRes.data;
      const quizzes = quizzesRes.data;

      const combinedItems: ContentItem[] = [
        ...(docs || []).map((d: any) => ({ 
          ...d, 
          type: d.document_type || 'smart_note',
          visibility: d.content?.visibility || 'global'
        })),
        ...(sets || []).map((s: any) => ({ ...s, type: 'learning_set' as const, visibility: 'global' })),
        ...(quizzes || []).map((q: any) => ({ ...q, type: 'quiz' as const, visibility: 'global' }))
      ];

      // Sort by created_at descending
      combinedItems.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setItems(combinedItems);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchAllContent(controller.signal);
    return () => {
      controller.abort();
      addControllerRef.current?.abort();
    };
  }, [paraId]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim() || !showAddModal) return;

    setIsAdding(true);
    addControllerRef.current?.abort();
    addControllerRef.current = new AbortController();

    try {
      const type = showAddModal.type;
      let result;
      
      if (type === 'smart_note' || type === 'html' || type === 'video' || type === 'image' || type === 'pdf' || type === 'powerpoint' || type === 'txt') {
        // Calculate max order_index
        const { data: maxOrderData } = await (supabase.from('documents') as any)
          .select('order_index')
          .eq('paragraph_id', paraId)
          .order('order_index', { ascending: false })
          .limit(1)
          .single();
          
        const nextOrderIndex = (maxOrderData?.order_index || 0) + 1;

        // Prepare content based on type
        let content: any = { visibility: 'global' };
        
        if (type === 'video' || type === 'image' || type === 'pdf' || type === 'powerpoint') {
          content = { ...content, url: newItemUrl };
        } else if (type === 'html') {
          content = { ...content, html: newItemContent };
        } else if (type === 'txt') {
          content = { ...content, text: newItemContent };
        }

        result = await (supabase.from('documents') as any).insert([
          {
            paragraph_id: paraId,
            title: newItemTitle,
            document_type: type,
            content: content,
            order_index: nextOrderIndex
          }
        ]).select().single();
      }

      // Handle other types if needed (quizzes/learning sets usually created via separate flow)

      if (result?.error) throw result.error;

      setNewItemTitle('');
      setNewItemUrl('');
      setNewItemContent('');
      setShowAddModal(null);
      fetchAllContent(addControllerRef.current.signal);
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleVisibility = async (item: ContentItem) => {
    // Only for documents for now
    if (item.type === 'learning_set' || item.type === 'quiz') return;
    
    const newVisibility = item.visibility === 'global' ? 'admin' : 'global';
    try {
       // Optimistic update
       setItems(items.map(i => i.id === item.id ? { ...i, visibility: newVisibility } : i));

       const { error } = await (supabase.from('documents') as any)
         .update({
           content: { ...item.content, visibility: newVisibility }
         })
         .eq('id', item.id);

       if (error) throw error;
    } catch (error) {
      console.error('Error toggling visibility:', error);
      // Revert
      setItems(items.map(i => i.id === item.id ? { ...i, visibility: item.visibility } : i));
    }
  };


  const handleDeleteItem = async (item: ContentItem) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const table = item.type === 'learning_set' ? 'learning_sets' : 
                   item.type === 'quiz' ? 'quizzes' : 'documents';
      
      const { error } = await (supabase.from(table) as any)
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      setItems(items.filter(i => i.id !== item.id));
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const handleItemClick = (item: ContentItem) => {
    switch (item.type) {
      case 'smart_note':
      case 'html':
      case 'video':
      case 'image':
      case 'pdf':
      case 'powerpoint':
      case 'txt':
        router.push(`/subjects/${subjectId}/chapters/${unitId}/paragraphs/${paraId}/documents/${item.id}`);
        break;
      case 'learning_set':
        router.push(`/subjects/${subjectId}/chapters/${unitId}/paragraphs/${paraId}/learning-sets/${item.id}`);
        break;
      case 'quiz':
        router.push(`/subjects/${subjectId}/chapters/${unitId}/paragraphs/${paraId}/quizzes/${item.id}`);
        break;
    }
  };

  const getContentIcon = (type: ContentItem['type']) => {
    switch (type) {
      case 'smart_note':
        return <FileText className="w-5 h-5" />;
      case 'html':
        return <FileCode className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'image':
        return <ImageIcon className="w-5 h-5" />;
      case 'pdf':
        return <File className="w-5 h-5" />; // Or FileText
      case 'powerpoint':
        return <MonitorPlay className="w-5 h-5" />;
      case 'txt':
        return <FileText className="w-5 h-5" />;
      case 'learning_set':
        return <Brain className="w-5 h-5" />;
      case 'quiz':
        return <FileQuestion className="w-5 h-5" />;
    }
  };

  const getContentColors = (type: ContentItem['type']) => {
    switch (type) {
      case 'smart_note':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'html':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'video':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'image':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'pdf':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'powerpoint':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'txt':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'learning_set':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'quiz':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  const getContentTypeLabel = (type: ContentItem['type']) => {
    switch (type) {
      case 'smart_note': return 'Smart Note';
      case 'html': return 'HTML';
      case 'video': return 'Video';
      case 'image': return 'Image';
      case 'pdf': return 'PDF';
      case 'powerpoint': return 'PowerPoint';
      case 'txt': return 'Text File';
      case 'learning_set': return 'Learning Set';
      case 'quiz': return 'Quiz';
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full p-8 relative overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.push(`/subjects/${subjectId}/chapters`)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Chapters</span>
        </button>

        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-serif font-bold text-white">Content</h1>
            </div>
            <p className="text-slate-400">Study materials linked to this paragraph</p>
          </div>
          <button
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setShowAddMenu({ x: rect.left - 180, y: rect.bottom + 8 });
            }}
            className="glass-button px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Content</span>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="glass-card p-12 text-center border border-white/5">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-white font-bold mb-2">No content yet</h3>
            <p className="text-slate-500 mb-6">Start by adding a document, learning set, or quiz.</p>
            <button
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setShowAddMenu({ x: rect.left, y: rect.bottom + 8 });
              }}
              className="glass-button px-6 py-2 rounded-xl"
            >
              Add Your First Item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`group glass-card p-5 border hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300 cursor-pointer ${item.visibility === 'admin' ? 'border-red-500/30 bg-red-500/5' : 'border-white/5'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border group-hover:scale-110 transition-transform ${getContentColors(item.type)}`}>
                    {getContentIcon(item.type)}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.visibility === 'admin' && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Admin</span>}
                    <ResourceMenu 
                      title="Item Actions"
                      actions={[
                        {
                          label: 'View',
                          icon: Eye,
                          onClick: () => handleItemClick(item)
                        },
                        ...(profile?.is_admin ? [{
                          label: item.visibility === 'global' ? 'Make Private' : 'Make Global',
                          icon: item.visibility === 'global' ? Lock : Globe,
                          onClick: () => handleToggleVisibility(item)
                        }] : []),
                        {
                          label: 'Rename',
                          icon: Edit2,
                          onClick: () => setEditingItem({ id: item.id, title: item.title })
                        },
                        {
                          label: 'Delete',
                          icon: Trash2,
                          onClick: () => handleDeleteItem(item),
                          variant: 'danger' as const
                        }
                      ]}
                    />
                  </div>
                </div>
                {editingItem?.id === item.id ? (
                  <input
                    autoFocus
                    type="text"
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    onBlur={() => handleInlineRename(item.id, editingItem.title)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleInlineRename(item.id, editingItem.title);
                      if (e.key === 'Escape') setEditingItem(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-slate-900 border border-blue-500/50 rounded px-2 py-1 text-sm text-white focus:outline-none mb-1"
                  />
                ) : (
                  <h3 className="text-white font-bold mb-1 group-hover:text-blue-400 transition-colors line-clamp-1">{item.title}</h3>
                )}
                {item.description && (
                  <p className="text-xs text-slate-400 mb-3 line-clamp-1">{item.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className={`px-1.5 py-0.5 rounded border uppercase tracking-wider font-medium text-[10px] ${getContentColors(item.type)}`}>
                    {getContentTypeLabel(item.type)}
                  </span>
                  <span>•</span>
                  <span>{new Date(item.created_at || '').toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Content Menu */}
        {showAddMenu && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setShowAddMenu(null)} />
            <div
              className="fixed z-[101] glass-card p-2 w-56 border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
              style={{ top: showAddMenu.y, left: showAddMenu.x }}
            >
              <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-white/5 mb-1">
                Add Content
              </div>
              <button
                onClick={() => { setShowAddModal({ type: 'html' }); setShowAddMenu(null); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <FileCode className="w-4 h-4 text-orange-400" />
                <span className="text-sm">HTML / Code</span>
              </button>
              <button
                onClick={() => { setShowAddModal({ type: 'video' }); setShowAddMenu(null); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <Video className="w-4 h-4 text-red-400" />
                <span className="text-sm">Video</span>
              </button>
              <button
                onClick={() => { setShowAddModal({ type: 'image' }); setShowAddMenu(null); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <span className="text-sm">Image</span>
              </button>
              <button
                onClick={() => { setShowAddModal({ type: 'pdf' }); setShowAddMenu(null); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <File className="w-4 h-4 text-red-400" />
                <span className="text-sm">PDF</span>
              </button>
              <button
                onClick={() => { setShowAddModal({ type: 'powerpoint' }); setShowAddMenu(null); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <MonitorPlay className="w-4 h-4 text-orange-400" />
                <span className="text-sm">PowerPoint</span>
              </button>
              <button
                onClick={() => { setShowAddModal({ type: 'txt' }); setShowAddMenu(null); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-sm">Text File</span>
              </button>
              <div className="h-px bg-white/5 my-1" />
              <button
                onClick={() => {
                  router.push(`/subjects/${subjectId}/chapters/${unitId}/paragraphs/${paraId}/documents?action=new`);
                  setShowAddMenu(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-sm">Smart Notes</span>
              </button>
              <button
                onClick={() => {
                  router.push(`/subjects/${subjectId}/chapters/${unitId}/paragraphs/${paraId}/learning-sets?action=new`);
                  setShowAddMenu(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <Brain className="w-4 h-4 text-indigo-400" />
                <span className="text-sm">Learning Set</span>
              </button>
              <button
                onClick={() => {
                  router.push(`/subjects/${subjectId}/chapters/${unitId}/paragraphs/${paraId}/quizzes?action=new`);
                  setShowAddMenu(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <FileQuestion className="w-4 h-4 text-emerald-400" />
                <span className="text-sm">Quiz</span>
              </button>
            </div>
          </>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="glass-card p-8 w-full max-w-md relative animate-in fade-in zoom-in duration-200">
              <h2 className="text-2xl font-bold text-white mb-6">Add {getContentTypeLabel(showAddModal.type)}</h2>
              <form onSubmit={handleAddItem}>
                <div className="mb-4">
                  <label className="block text-slate-400 text-sm mb-2 font-medium">Title</label>
                  <input
                    type="text"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="Enter title..."
                    autoFocus
                  />
                </div>
                {['video', 'image', 'pdf', 'powerpoint'].includes(showAddModal.type) && (
                  <div className="mb-6">
                    <label className="block text-slate-400 text-sm mb-2 font-medium">URL</label>
                    <input
                      type="text"
                      value={newItemUrl}
                      onChange={(e) => setNewItemUrl(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      placeholder="https://..."
                    />
                  </div>
                )}
                {['html', 'txt'].includes(showAddModal.type) && (
                  <div className="mb-6">
                    <label className="block text-slate-400 text-sm mb-2 font-medium">Content</label>
                    <textarea
                      value={newItemContent}
                      onChange={(e) => setNewItemContent(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white h-32 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
                      placeholder={showAddModal.type === 'html' ? '<div>...</div>' : 'Enter text content...'}
                    />
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(null); setNewItemTitle(''); setNewItemUrl(''); setNewItemContent(''); }}
                    className="flex-1 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="flex-1 glass-button rounded-xl flex items-center justify-center gap-2"
                  >
                    {isAdding ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Add Item</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Resource Context Menu */}
        {resourceMenu && (
          <ResourceContextMenu
            items={getResourceMenuItems(resourceMenu.itemId)}
            position={{ x: resourceMenu.x, y: resourceMenu.y }}
            onClose={() => setResourceMenu(null)}
            resourceType="document"
            isGlobal={items.find(i => i.id === resourceMenu.itemId)?.visibility === 'global'}
            isAdmin={profile?.is_admin || false}
          />
        )}
      </div>
    </div>
  );
}
