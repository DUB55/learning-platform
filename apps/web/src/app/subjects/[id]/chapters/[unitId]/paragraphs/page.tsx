 'use client';
 
 import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, FileText, Layers, Plus, Edit2, Trash2, Eye } from 'lucide-react';
import ResourceMenu from '@/components/ResourceMenu';
 
 type Paragraph = {
   id: string;
   unit_id: string;
   title: string;
   order_index: number | null;
   created_at: string | null;
 };
 
 export default function UnitParagraphsPage() {
   const params = useParams();
   const router = useRouter();
   const subjectId = params.id as string;
   const unitId = params.unitId as string;
 
   const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddParaModal, setShowAddParaModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingParagraph, setEditingParagraph] = useState<{ id: string; title: string } | null>(null);
  
  const addParaControllerRef = useRef<AbortController | null>(null);
  const fetchDataControllerRef = useRef<AbortController | null>(null);

  const fetchParas = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const { data, error } = await (supabase.from('paragraphs') as any)
        .select('*')
        .eq('unit_id', unitId)
        .order('order_index', { ascending: true })
        .abortSignal(signal);

      if (error) {
        if (error.name === 'AbortError') return;
        console.error('Error fetching paragraphs:', error);
        return;
      }
      setParagraphs(data || []);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error in fetchParas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataControllerRef.current?.abort();
    const controller = new AbortController();
    fetchDataControllerRef.current = controller;
    fetchParas(controller.signal);
    return () => {
      fetchDataControllerRef.current?.abort();
      addParaControllerRef.current?.abort();
    };
  }, [unitId]);

  const handleAddPara = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      addParaControllerRef.current?.abort();
      const controller = new AbortController();
      addParaControllerRef.current = controller;

      const { error } = await (supabase.from('paragraphs') as any).insert([
        {
          unit_id: unitId,
          title: newTitle,
          order_index: paragraphs.length,
        }
      ]).abortSignal(controller.signal as any);

      if (error) {
        if (error.name === 'AbortError') return;
        throw error;
      }

      setNewTitle('');
      setShowAddParaModal(false);
      
      fetchDataControllerRef.current?.abort();
      const fetchController = new AbortController();
      fetchDataControllerRef.current = fetchController;
      fetchParas(fetchController.signal);
    } catch (error) {
      console.error('Error adding paragraph:', error);
    } finally {
      addParaControllerRef.current = null;
    }
  };

  const handleRenameParagraph = async (paraId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('paragraphs')
        .update({ title: newTitle })
        .eq('id', paraId);

      if (error) throw error;
      fetchParas();
    } catch (error) {
      console.error('Error renaming paragraph:', error);
    }
  };

  const handleDeleteParagraph = async (paraId: string) => {
    if (!confirm('Are you sure you want to delete this paragraph? This will delete all content inside.')) return;
    try {
      const { error } = await supabase
        .from('paragraphs')
        .delete()
        .eq('id', paraId);

      if (error) throw error;
      fetchParas();
    } catch (error) {
      console.error('Error deleting paragraph:', error);
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
     <div className="h-full p-8">
       <div className="max-w-6xl mx-auto">
         <button
           onClick={() => router.push(`/subjects/${subjectId}/chapters`)}
           className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
         >
           <ArrowLeft className="w-4 h-4" />
           <span>Back to Chapters</span>
         </button>
 
         <div className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-serif font-bold text-white">Paragraphs</h1>
            </div>
            <p className="text-slate-400">Browse paragraphs for this chapter</p>
          </div>
          <button
            onClick={() => setShowAddParaModal(true)}
            className="glass-button px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Paragraph</span>
          </button>
        </div>
 
         {paragraphs.length === 0 ? (
           <div className="glass-card p-12 text-center">
             <p className="text-slate-400">No paragraphs</p>
           </div>
         ) : (
           <div className="space-y-2">
             {paragraphs.map((para) => (
               <div
                 key={para.id}
                 onClick={() => router.push(`/subjects/${subjectId}/chapters/${unitId}/paragraphs/${para.id}/documents`)}
                 className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-colors"
               >
                 <div className="w-7 h-7 rounded bg-slate-700/50 flex items-center justify-center text-slate-300">
                   <FileText className="w-4 h-4" />
                 </div>
                 <div className="flex-1">
                   {editingParagraph && editingParagraph.id === para.id ? (
                     <input
                       type="text"
                       value={editingParagraph.title}
                       onChange={(e) => setEditingParagraph({ ...editingParagraph, title: e.target.value })}
                       onBlur={() => {
                         if (editingParagraph.title !== para.title) {
                           handleRenameParagraph(para.id, editingParagraph.title);
                         }
                         setEditingParagraph(null);
                       }}
                       onKeyDown={(e) => {
                         if (e.key === 'Enter') {
                           if (editingParagraph.title !== para.title) {
                             handleRenameParagraph(para.id, editingParagraph.title);
                           }
                           setEditingParagraph(null);
                         }
                         if (e.key === 'Escape') setEditingParagraph(null);
                       }}
                       onClick={(e) => e.stopPropagation()}
                       autoFocus
                       className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white text-sm focus:outline-none focus:border-blue-500 w-full"
                     />
                   ) : (
                     <p className="text-white text-sm">{para.title}</p>
                   )}
                 </div>
                 <div onClick={(e) => e.stopPropagation()}>
                   <ResourceMenu 
                     title="Paragraph Actions"
                     actions={[
                       {
                         label: 'View Documents',
                         icon: Eye,
                         onClick: () => router.push(`/subjects/${subjectId}/chapters/${unitId}/paragraphs/${para.id}/documents`)
                       },
                       {
                         label: 'Rename',
                         icon: Edit2,
                         onClick: () => setEditingParagraph({ id: para.id, title: para.title })
                       },
                       {
                         label: 'Delete',
                         icon: Trash2,
                         onClick: () => handleDeleteParagraph(para.id),
                         variant: 'danger'
                       }
                     ]}
                   />
                 </div>
               </div>
             ))}
           </div>
        )}

        {/* Add Paragraph Modal */}
        {showAddParaModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="glass-card p-8 w-full max-w-md relative animate-in fade-in zoom-in duration-200">
              <h2 className="text-2xl font-bold text-white mb-6">Add New Paragraph</h2>
              <form onSubmit={handleAddPara}>
                <div className="mb-6">
                  <label className="block text-slate-400 text-sm mb-2 font-medium">Paragraph Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="e.g. Limits and Continuity"
                    autoFocus
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => { setShowAddParaModal(false); setNewTitle(''); }}
                    className="flex-1 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 glass-button rounded-xl font-bold"
                  >
                    Create Paragraph
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
