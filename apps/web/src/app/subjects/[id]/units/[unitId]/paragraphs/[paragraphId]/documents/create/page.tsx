'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

import {
    ArrowLeft, Plus, Type, Image as ImageIcon, Youtube, Code,
    Table, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
    List, ListOrdered, Save, Palette, Trash2, GripVertical, Eye
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { documentSchema } from '@/lib/validation';
import YoutubeImportModal from '@/components/imports/YoutubeImportModal';
import FileImportModal from '@/components/imports/FileImportModal';



interface DocumentElement {
    id: string;
    type: 'text' | 'youtube' | 'image' | 'table' | 'html';
    content: string;
    styling?: {
        color?: string;
        fontSize?: string;
        fontFamily?: string;
        alignment?: 'left' | 'center' | 'right';
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
    };
    order: number;
}

export default function CreateDocumentPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const paragraphId = params.paragraphId as string;

    const [title, setTitle] = useState('');
    const [documentType, setDocumentType] = useState<'text' | 'youtube' | 'image' | 'html'>('text');
    const [elements, setElements] = useState<DocumentElement[]>([]);
    const [showAddElement, setShowAddElement] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [draggedElement, setDraggedElement] = useState<string | null>(null);
    const [showYoutubeModal, setShowYoutubeModal] = useState(false);
    const [showFileModal, setShowFileModal] = useState(false);

    const handleFileSuccess = (data: any, type: 'flashcards' | 'summary') => {
        if (type === 'summary') {
            const newElement: DocumentElement = {
                id: Date.now().toString(),
                type: 'text',
                content: data, // Markdown summary
                order: elements.length,
                styling: {
                    color: '#ffffff',
                    fontSize: '16px',
                    fontFamily: 'Inter',
                    alignment: 'left'
                }
            };
            setElements(prev => [...prev, newElement]);
        }
    };


    const handleYoutubeSuccess = (data: any, type: 'flashcards' | 'summary') => {
        if (type === 'summary') {
            const newElement: DocumentElement = {
                id: Date.now().toString(),
                type: 'text',
                content: data, // Markdown summary
                order: elements.length,
                styling: {
                    color: '#ffffff',
                    fontSize: '16px',
                    fontFamily: 'Inter',
                    alignment: 'left'
                }
            };
            setElements(prev => [...prev, newElement]);
        }
    };


    // Permissions (check from database in production)
    const [permissions, setPermissions] = useState({
        allow_html: true, // Changed to true for admin
        allow_youtube: true,
        allow_images: true,
        allow_rich_text: true,
        allow_tables: true
    });

    useEffect(() => {
        // Fetch user permissions
        fetchPermissions();
    }, [user]);

    const fetchPermissions = async () => {
        if (!user) return;

        // Check if admin (admins have all permissions)
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (profile?.is_admin) {
            setPermissions({
                allow_html: true,
                allow_youtube: true,
                allow_images: true,
                allow_rich_text: true,
                allow_tables: true
            });
            return;
        }

        // Fetch permission settings from database
        const { data: settings } = await (supabase
            .from('admin_permission_settings') as any)
            .select('setting_key, default_value')
            .in('setting_key', [
                'documents.allow_html',
                'documents.allow_youtube',
                'documents.allow_images',
                'documents.allow_rich_text',
                'documents.allow_tables'
            ]);

        if (settings) {
            const perms: any = {};
            settings.forEach(s => {
                const key = s.setting_key.split('.')[1];
                perms[key] = s.default_value === 'true';
            });
            setPermissions(perms);
        }
    };

    const addElement = (type: DocumentElement['type']) => {
        const newElement: DocumentElement = {
            id: Date.now().toString(),
            type,
            content: type === 'table' ? JSON.stringify({ rows: 3, cols: 3, data: Array(3).fill(Array(3).fill('')) }) : '',
            order: elements.length,
            styling: type === 'text' ? {
                color: '#ffffff',
                fontSize: '16px',
                fontFamily: 'Inter',
                alignment: 'left'
            } : undefined
        };

        setElements([...elements, newElement]);
        setShowAddElement(false);
    };

    const updateElement = (id: string, updates: Partial<DocumentElement>) => {
        setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
    };

    const updateStyling = (id: string, styling: Partial<DocumentElement['styling']>) => {
        setElements(elements.map(el =>
            el.id === id ? { ...el, styling: { ...el.styling, ...styling } } : el
        ));
    };

    const removeElement = (id: string) => {
        setElements(elements.filter(el => el.id !== id).map((el, index) => ({ ...el, order: index })));
    };

    const handleDragStart = (id: string) => {
        setDraggedElement(id);
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedElement || draggedElement === targetId) return;

        const draggedIndex = elements.findIndex(el => el.id === draggedElement);
        const targetIndex = elements.findIndex(el => el.id === targetId);

        const newElements = [...elements];
        const [removed] = newElements.splice(draggedIndex, 1);
        newElements.splice(targetIndex, 0, removed);

        setElements(newElements.map((el, index) => ({ ...el, order: index })));
    };

    const handleDragEnd = () => {
        setDraggedElement(null);
    };

    const handleSave = async () => {
        try {
            // Validate input
            const validationResult = documentSchema.safeParse({
                title,
                content: '', // Content is handled separately or is empty for now
                type: documentType,
                elements: elements
            });

            if (!validationResult.success) {
                const errorMessage = validationResult.error.errors[0].message;
                alert(errorMessage);
                return;
            }

            if (!user) {
                alert('You must be logged in to create a document');
                return;
            }

            setIsSaving(true);

            const dbDocumentType = documentType === 'text' ? 'rich_text' : documentType;

            const { data, error } = await supabase
                .from('documents')
                .insert([{
                    paragraph_id: paragraphId,
                    user_id: user.id,
                    title: title,
                    content: {},
                    document_type: dbDocumentType,
                    elements: elements as any,
                    type: documentType
                }])

                .select()
                .single();

            if (error) throw error;

            router.push(`/subjects/${params.id}/units/${params.unitId}/paragraphs/${paragraphId}/documents/${data.id}`);
        } catch (error: any) {
            console.error('Error creating document:', error);
            alert(`Failed to create document: ${error.message || JSON.stringify(error)}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full overflow-y-auto p-8 relative">


            <div className="flex-1 relative">
                <div className="max-w-5xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </button>

                    <div className="mb-10">
                        <h1 className="text-3xl font-serif font-bold text-white mb-2">Create Document</h1>
                        <p className="text-slate-400">Build your document with rich content and elements</p>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowYoutubeModal(true)}
                                className="bg-red-600 hover:bg-red-500 text-white flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors shadow-lg shadow-red-900/20"
                            >
                                <Youtube size={18} /> Import from YouTube
                            </button>
                            <button
                                onClick={() => setShowFileModal(true)}
                                className="bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors shadow-lg shadow-purple-900/20"
                            >
                                <FileText size={18} /> Import File
                            </button>
                        </div>

                    </div>


                    {/* Document Title */}
                    <div className="glass-card p-6 mb-6">
                        <label className="block text-slate-400 text-sm mb-2">Document Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter document title"
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white text-xl focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Document Elements */}
                    <div className="space-y-4 mb-6">
                        {elements.map((element) => (
                            <div
                                key={element.id}
                                draggable
                                onDragStart={() => handleDragStart(element.id)}
                                onDragOver={(e) => handleDragOver(e, element.id)}
                                onDragEnd={handleDragEnd}
                                className={`glass-card p-6 ${draggedElement === element.id ? 'opacity-50' : ''}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="cursor-grab active:cursor-grabbing pt-2">
                                        <GripVertical className="w-5 h-5 text-slate-500" />
                                    </div>

                                    <div className="flex-1">
                                        {element.type === 'text' && (
                                            <div>
                                                {/* Text Formatting Toolbar */}
                                                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
                                                    <button
                                                        onClick={() => updateStyling(element.id, { bold: !element.styling?.bold })}
                                                        className={`p-2 rounded ${element.styling?.bold ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:bg-white/5'}`}
                                                    >
                                                        <Bold className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateStyling(element.id, { italic: !element.styling?.italic })}
                                                        className={`p-2 rounded ${element.styling?.italic ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:bg-white/5'}`}
                                                    >
                                                        <Italic className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateStyling(element.id, { underline: !element.styling?.underline })}
                                                        className={`p-2 rounded ${element.styling?.underline ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:bg-white/5'}`}
                                                    >
                                                        <Underline className="w-4 h-4" />
                                                    </button>

                                                    <div className="w-px h-6 bg-white/10 mx-2"></div>

                                                    <button
                                                        onClick={() => updateStyling(element.id, { alignment: 'left' })}
                                                        className={`p-2 rounded ${element.styling?.alignment === 'left' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:bg-white/5'}`}
                                                    >
                                                        <AlignLeft className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateStyling(element.id, { alignment: 'center' })}
                                                        className={`p-2 rounded ${element.styling?.alignment === 'center' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:bg-white/5'}`}
                                                    >
                                                        <AlignCenter className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateStyling(element.id, { alignment: 'right' })}
                                                        className={`p-2 rounded ${element.styling?.alignment === 'right' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:bg-white/5'}`}
                                                    >
                                                        <AlignRight className="w-4 h-4" />
                                                    </button>

                                                    <div className="w-px h-6 bg-white/10 mx-2"></div>

                                                    <input
                                                        type="color"
                                                        value={element.styling?.color || '#ffffff'}
                                                        onChange={(e) => updateStyling(element.id, { color: e.target.value })}
                                                        className="w-8 h-8 rounded cursor-pointer"
                                                    />

                                                    <select
                                                        value={element.styling?.fontSize || '16px'}
                                                        onChange={(e) => updateStyling(element.id, { fontSize: e.target.value })}
                                                        className="bg-slate-800/50 border border-white/10 rounded px-2 py-1 text-white text-sm"
                                                    >
                                                        <option value="12px">12px</option>
                                                        <option value="14px">14px</option>
                                                        <option value="16px">16px</option>
                                                        <option value="18px">18px</option>
                                                        <option value="20px">20px</option>
                                                        <option value="24px">24px</option>
                                                        <option value="32px">32px</option>
                                                    </select>

                                                    <select
                                                        value={element.styling?.fontFamily || 'Inter'}
                                                        onChange={(e) => updateStyling(element.id, { fontFamily: e.target.value })}
                                                        className="bg-slate-800/50 border border-white/10 rounded px-2 py-1 text-white text-sm"
                                                    >
                                                        <option value="Inter">Inter</option>
                                                        <option value="Arial">Arial</option>
                                                        <option value="Georgia">Georgia</option>
                                                        <option value="Times New Roman">Times New Roman</option>
                                                        <option value="Courier New">Courier New</option>
                                                    </select>
                                                </div>

                                                <textarea
                                                    value={element.content}
                                                    onChange={(e) => updateElement(element.id, { content: e.target.value })}
                                                    placeholder="Enter your text..."
                                                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white min-h-[100px] resize-none focus:outline-none focus:border-blue-500"
                                                    style={{
                                                        color: element.styling?.color,
                                                        fontSize: element.styling?.fontSize,
                                                        fontFamily: element.styling?.fontFamily,
                                                        textAlign: element.styling?.alignment,
                                                        fontWeight: element.styling?.bold ? 'bold' : 'normal',
                                                        fontStyle: element.styling?.italic ? 'italic' : 'normal',
                                                        textDecoration: element.styling?.underline ? 'underline' : 'none'
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {element.type === 'youtube' && (
                                            <div>
                                                <label className="block text-slate-400 text-sm mb-2">YouTube URL</label>
                                                <input
                                                    type="url"
                                                    value={element.content}
                                                    onChange={(e) => updateElement(element.id, { content: e.target.value })}
                                                    placeholder="https://www.youtube.com/watch?v=..."
                                                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                        )}

                                        {element.type === 'image' && (
                                            <div>
                                                <label className="block text-slate-400 text-sm mb-2">Image URL</label>
                                                <input
                                                    type="url"
                                                    value={element.content}
                                                    onChange={(e) => updateElement(element.id, { content: e.target.value })}
                                                    placeholder="https://example.com/image.jpg"
                                                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 mb-3"
                                                />
                                                {element.content && (
                                                    <img src={element.content} alt="Preview" className="max-w-full h-auto rounded-lg" />
                                                )}
                                            </div>
                                        )}

                                        {element.type === 'html' && (
                                            <div>
                                                <label className="block text-slate-400 text-sm mb-2">HTML Code</label>
                                                <textarea
                                                    value={element.content}
                                                    onChange={(e) => updateElement(element.id, { content: e.target.value })}
                                                    placeholder="<div>Your HTML here...</div>"
                                                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white min-h-[100px] resize-none focus:outline-none focus:border-blue-500 font-mono text-sm"
                                                />
                                                <p className="text-xs text-green-400 mt-2">✓ HTML will render directly without restrictions</p>
                                            </div>
                                        )}

                                        {element.type === 'table' && (
                                            <div>
                                                <p className="text-slate-400 text-sm mb-3">Table (3x3)</p>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {Array(9).fill(null).map((_, i) => (
                                                        <input
                                                            key={i}
                                                            type="text"
                                                            placeholder={`Cell ${i + 1}`}
                                                            className="bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => removeElement(element.id)}
                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Element Button */}
                    <button
                        onClick={() => setShowAddElement(true)}
                        className="w-full glass-card p-6 hover:bg-white/5 transition-colors flex items-center justify-center gap-2 mb-8"
                    >
                        <Plus className="w-5 h-5 text-blue-400" />
                        <span className="text-blue-400 font-medium">Add Element</span>
                    </button>

                    {/* Save Button */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => router.back()}
                            className="flex-1 px-6 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !title.trim()}
                            className="flex-1 glass-button rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            <span>{isSaving ? 'Saving...' : 'Save Document'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

            {/* Add Element Modal */ }
    {
        showAddElement && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="glass-card p-8 w-full max-w-3xl">
                    <h2 className="text-2xl font-bold text-white mb-6">Add Element</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {permissions.allow_rich_text && (
                            <button
                                onClick={() => addElement('text')}
                                className="glass-card p-6 hover:bg-white/10 transition-all flex flex-col items-center gap-3 group"
                            >
                                <Type className="w-10 h-10 text-blue-400 group-hover:scale-110 transition-transform" />
                                <span className="text-white font-medium">Text</span>
                            </button>
                        )}

                        {permissions.allow_youtube && (
                            <button
                                onClick={() => addElement('youtube')}
                                className="glass-card p-6 hover:bg-white/10 transition-all flex flex-col items-center gap-3 group"
                            >
                                <Youtube className="w-10 h-10 text-red-400 group-hover:scale-110 transition-transform" />
                                <span className="text-white font-medium">YouTube</span>
                            </button>
                        )}

                        {permissions.allow_images && (
                            <button
                                onClick={() => addElement('image')}
                                className="glass-card p-6 hover:bg-white/10 transition-all flex flex-col items-center gap-3 group"
                            >
                                <ImageIcon className="w-10 h-10 text-green-400 group-hover:scale-110 transition-transform" />
                                <span className="text-white font-medium">Image</span>
                            </button>
                        )}

                        {permissions.allow_tables && (
                            <button
                                onClick={() => addElement('table')}
                                className="glass-card p-6 hover:bg-white/10 transition-all flex flex-col items-center gap-3 group"
                            >
                                <Table className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform" />
                                <span className="text-white font-medium">Table</span>
                            </button>
                        )}

                        {permissions.allow_html && (
                            <button
                                onClick={() => addElement('html')}
                                className="glass-card p-6 hover:bg-white/10 transition-all flex flex-col items-center gap-3 group"
                            >
                                <Code className="w-10 h-10 text-amber-400 group-hover:scale-110 transition-transform" />
                                <span className="text-white font-medium">HTML</span>
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setShowAddElement(false)}
                        className="w-full mt-6 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        )
    }

    <YoutubeImportModal
        isOpen={showYoutubeModal}
        onClose={() => setShowYoutubeModal(false)}
        onSuccess={handleYoutubeSuccess}
        allowedModes={['summary']}
    />
        </div >
    );

}
