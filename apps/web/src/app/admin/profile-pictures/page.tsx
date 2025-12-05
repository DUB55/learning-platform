'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, Image, GripVertical } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ProfilePicture {
    id: string;
    name: string;
    url: string;
    sort_order: number;
}

export default function AdminProfilePicturesPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [pictures, setPictures] = useState<ProfilePicture[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingPicture, setEditingPicture] = useState<ProfilePicture | null>(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formUrl, setFormUrl] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user || !profile?.is_admin) {
                router.push('/dashboard');
                return;
            }
            fetchPictures();
        }
    }, [user, profile, loading, router]);

    const fetchPictures = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await (supabase
                .from('profile_pictures') as any)
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;
            setPictures(data || []);
        } catch (error) {
            console.error('Error fetching profile pictures:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!formName.trim() || !formUrl.trim()) {
            alert('Please fill in both name and URL');
            return;
        }

        setSaving(true);
        try {
            const maxOrder = pictures.length > 0
                ? Math.max(...pictures.map(p => p.sort_order))
                : 0;

            const { error } = await (supabase
                .from('profile_pictures') as any)
                .insert([{
                    name: formName.trim(),
                    url: formUrl.trim(),
                    sort_order: maxOrder + 1
                }]);

            if (error) throw error;

            setFormName('');
            setFormUrl('');
            setShowAddModal(false);
            fetchPictures();
        } catch (error: any) {
            console.error('Error adding picture:', error);
            alert('Failed to add picture: ' + (error.message || 'Unknown error'));
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = async () => {
        if (!editingPicture || !formName.trim() || !formUrl.trim()) {
            alert('Please fill in both name and URL');
            return;
        }

        setSaving(true);
        try {
            const { error } = await (supabase
                .from('profile_pictures') as any)
                .update({
                    name: formName.trim(),
                    url: formUrl.trim()
                })
                .eq('id', editingPicture.id);

            if (error) throw error;

            setEditingPicture(null);
            setFormName('');
            setFormUrl('');
            fetchPictures();
        } catch (error: any) {
            console.error('Error updating picture:', error);
            alert('Failed to update picture: ' + (error.message || 'Unknown error'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            const { error } = await (supabase
                .from('profile_pictures') as any)
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchPictures();
        } catch (error: any) {
            console.error('Error deleting picture:', error);
            alert('Failed to delete picture: ' + (error.message || 'Unknown error'));
        }
    };

    const openEditModal = (picture: ProfilePicture) => {
        setEditingPicture(picture);
        setFormName(picture.name);
        setFormUrl(picture.url);
    };

    const closeModal = () => {
        setShowAddModal(false);
        setEditingPicture(null);
        setFormName('');
        setFormUrl('');
    };

    if (loading || !profile?.is_admin) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto relative p-8">
                <div className="max-w-6xl mx-auto">
                    <header className="mb-8">
                        <button
                            onClick={() => router.push('/admin')}
                            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Admin</span>
                        </button>
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-serif font-bold text-white mb-2">Profile Pictures</h1>
                                <p className="text-slate-400">Manage profile picture options for all users</p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Picture
                            </button>
                        </div>
                    </header>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : pictures.length === 0 ? (
                        <div className="glass-card p-12 text-center">
                            <Image className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                            <p className="text-slate-400 mb-4">No profile pictures configured</p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="text-blue-400 hover:text-blue-300"
                            >
                                Add your first picture
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {pictures.map((picture) => (
                                <div
                                    key={picture.id}
                                    className="glass-card overflow-hidden group relative"
                                >
                                    {/* Image */}
                                    <div className="aspect-square bg-slate-800 overflow-hidden">
                                        <img
                                            src={picture.url}
                                            alt={picture.name}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect fill="%23334155" width="100" height="100"/><text fill="%2394a3b8" font-size="12" x="50" y="55" text-anchor="middle">Error</text></svg>';
                                            }}
                                        />
                                    </div>

                                    {/* Name & Actions */}
                                    <div className="p-3">
                                        <p className="text-white text-sm font-medium truncate mb-2">{picture.name}</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEditModal(picture)}
                                                className="flex-1 text-xs py-1.5 px-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(picture.id, picture.name)}
                                                className="text-xs py-1.5 px-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors flex items-center justify-center"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Order badge */}
                                    <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                                        #{picture.sort_order}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Add/Edit Modal */}
            {(showAddModal || editingPicture) && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">
                                {editingPicture ? 'Edit Profile Picture' : 'Add Profile Picture'}
                            </h2>
                            <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="e.g., Mr. Smith"
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Image URL</label>
                                <input
                                    type="url"
                                    value={formUrl}
                                    onChange={(e) => setFormUrl(e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* Preview */}
                            {formUrl && (
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Preview</label>
                                    <div className="w-32 h-32 rounded-xl overflow-hidden bg-slate-800 border border-white/10">
                                        <img
                                            src={formUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={editingPicture ? handleEdit : handleAdd}
                                disabled={saving || !formName.trim() || !formUrl.trim()}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Saving...' : (editingPicture ? 'Update' : 'Add Picture')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
