'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Plus, Check, Circle, Trash2, Calendar as CalendarIcon, Tag, Edit2, FolderOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTasks } from '@/hooks/useTasks';
import ContextMenu from '@/components/ContextMenu';

export default function TodoPage() {
    const { user } = useAuth();
    const { tasks, isLoading: loading, mutate } = useTasks(user);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; taskId: string } | null>(null);
    const [editingTask, setEditingTask] = useState<{ id: string; title: string } | null>(null);
    const [editingCategory, setEditingCategory] = useState<{ id: string; type: string } | null>(null);
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newTaskTitle.trim()) return;

        const tempId = Math.random().toString();
        const maxPosition = tasks.length > 0 ? Math.max(...tasks.map((t: any) => t.position || 0)) : 0;

        const newTask = {
            id: tempId,
            user_id: user.id,
            title: newTaskTitle,
            is_completed: false,
            type: 'assignment',
            position: maxPosition + 1,
            created_at: new Date().toISOString()
        };

        try {
            await mutate([...tasks, newTask], false);
            setNewTaskTitle('');

            const { data, error } = await supabase
                .from('tasks')
                .insert([
                    {
                        user_id: user.id,
                        title: newTaskTitle,
                        is_completed: false,
                        type: 'assignment',
                        position: maxPosition + 1
                    }
                ] as any)
                .select()
                .single();

            if (error) throw error;
            await mutate();
        } catch (error) {
            console.error('Error adding task:', error);
            await mutate();
        }
    };

    const toggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
        try {
            const updatedTasks = tasks.map((t: any) =>
                t.id === taskId ? { ...t, is_completed: !currentStatus } : t
            );
            await mutate(updatedTasks, false);

            const { error } = await supabase
                .from('tasks')
                .update({ is_completed: !currentStatus })
                .eq('id', taskId);

            if (error) throw error;
            await mutate();
        } catch (error) {
            console.error('Error updating task:', error);
            await mutate();
        }
    };

    const deleteTask = async (taskId: string) => {
        try {
            const updatedTasks = tasks.filter((t: any) => t.id !== taskId);
            await mutate(updatedTasks, false);

            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);

            if (error) throw error;
            await mutate();
        } catch (error) {
            console.error('Error deleting task:', error);
            await mutate();
        }
    };

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.effectAllowed = 'move';
        // Make the drag image transparent or custom if needed
    };

    const handleDragOver = (e: React.DragEvent, targetTaskId: string) => {
        e.preventDefault();
        if (!draggedTaskId || draggedTaskId === targetTaskId) return;

        const draggedIndex = tasks.findIndex((t: any) => t.id === draggedTaskId);
        const targetIndex = tasks.findIndex((t: any) => t.id === targetTaskId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const newTasks = [...tasks];
        const [draggedItem] = newTasks.splice(draggedIndex, 1);
        newTasks.splice(targetIndex, 0, draggedItem);

        // Update positions locally
        const updatedTasks = newTasks.map((t, index) => ({ ...t, position: index }));
        mutate(updatedTasks, false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setDraggedTaskId(null);

        // Save new positions to server
        try {
            const updates = tasks.map((t: any, index: number) => ({
                id: t.id,
                position: index,
                user_id: user!.id, // Required for RLS
                title: t.title // Required for update
            }));

            // We can't batch update easily with upsert if we only want to update position
            // So we'll update one by one for now or use a custom RPC if performance is an issue
            // For a todo list, Promise.all is fine
            await Promise.all(updates.map((t: any) =>
                supabase.from('tasks').update({ position: t.position }).eq('id', t.id)
            ));

        } catch (error) {
            console.error('Error saving order:', error);
            await mutate(); // Revert on error
        }
    };

    const filteredTasks = tasks
        .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
        .filter((task: any) => {
            if (filter === 'active') return !task.is_completed;
            if (filter === 'completed') return task.is_completed;
            return true;
        });

    const handleContextMenu = (e: React.MouseEvent, taskId: string) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            taskId
        });
    };

    const handleSaveCategory = async () => {
        if (!editingCategory) return;

        try {
            // Optimistic update
            const updatedTasks = tasks.map((t: any) =>
                t.id === editingCategory.id ? { ...t, type: editingCategory.type } : t
            );
            await mutate(updatedTasks, false);

            const { error } = await supabase
                .from('tasks')
                .update({ type: editingCategory.type })
                .eq('id', editingCategory.id);

            if (!error) {
                setEditingCategory(null);
                await mutate();
            }
        } catch (error) {
            console.error('Error changing category:', error);
            await mutate();
        }
    };

    const handleEditTask = (taskId: string) => {
        const task = tasks.find((t: any) => t.id === taskId);
        if (task) {
            setEditingTask({ id: task.id, title: task.title });
        }
    };

    const handleSaveEdit = async () => {
        if (!editingTask) return;

        try {
            const { error } = await supabase
                .from('tasks')
                .update({ title: editingTask.title })
                .eq('id', editingTask.id);

            if (!error) {
                await mutate();
                setEditingTask(null);
            }
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    const getContextMenuItems = (taskId: string) => {
        const task = tasks.find((t: any) => t.id === taskId);
        if (!task) return [];

        return [
            {
                icon: <Edit2 className="w-4 h-4" />,
                label: 'Edit Task',
                onClick: () => handleEditTask(taskId)
            },
            {
                icon: <Tag className="w-4 h-4" />,
                label: 'Change Category',
                onClick: () => setEditingCategory({ id: taskId, type: task.type || 'assignment' })
            },
            {
                icon: <Trash2 className="w-4 h-4" />,
                label: 'Delete',
                onClick: () => deleteTask(taskId),
                danger: true,
                divider: true
            }
        ];
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto relative p-8">
                <div className="max-w-4xl mx-auto">
                    <header className="mb-10">
                        <h1 className="text-3xl font-serif font-bold text-white mb-2">To-do List</h1>
                        <p className="text-slate-400">Stay organized and track your progress</p>
                    </header>

                    {/* Add Task Input */}
                    <div className="glass-card p-4 mb-8">
                        <form onSubmit={handleAddTask} className="flex gap-4">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="Add a new task..."
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 pl-12 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                                <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            </div>
                            <button
                                type="submit"
                                disabled={!newTaskTitle.trim()}
                                className="glass-button px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add
                            </button>
                        </form>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 mb-6">
                        {(['all', 'active', 'completed'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Task List */}
                    <div className="space-y-3">
                        {loading ? (
                            <div className="text-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                            </div>
                        ) : filteredTasks.length === 0 ? (
                            <div className="text-center py-16 text-slate-500">
                                <p>No tasks found</p>
                            </div>
                        ) : (
                            filteredTasks.map((task: any) => (
                                <div
                                    key={task.id}
                                    draggable={!task.is_completed}
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                    onDragOver={(e) => handleDragOver(e, task.id)}
                                    onDrop={handleDrop}
                                    className={`glass-card p-4 flex items-center gap-4 group transition-all cursor-move ${task.is_completed ? 'opacity-50' : ''
                                        } ${draggedTaskId === task.id ? 'opacity-0' : ''}`}
                                    onContextMenu={(e) => handleContextMenu(e, task.id)}
                                >
                                    <button
                                        onClick={() => toggleTaskCompletion(task.id, task.is_completed)}
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.is_completed
                                            ? 'bg-blue-500 border-blue-500 text-white'
                                            : 'border-slate-500 text-transparent hover:border-blue-500'
                                            }`}
                                    >
                                        {task.is_completed && <Check className="w-4 h-4" />}
                                    </button>

                                    <div className="flex-1">
                                        {editingTask && editingTask.id === task.id ? (
                                            <input
                                                type="text"
                                                value={editingTask.title}
                                                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                                                onBlur={handleSaveEdit}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSaveEdit();
                                                    if (e.key === 'Escape') setEditingTask(null);
                                                }}
                                                autoFocus
                                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-1 text-white focus:outline-none focus:border-blue-500"
                                            />
                                        ) : (
                                            <h3 className={`font-medium text-white ${task.is_completed ? 'line-through text-slate-400' : ''}`}>
                                                {task.title}
                                            </h3>
                                        )}
                                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                            {task.due_date && (
                                                <div className="flex items-center gap-1">
                                                    <CalendarIcon className="w-3 h-3" />
                                                    <span>{new Date(task.due_date).toLocaleDateString()}</span>
                                                </div>
                                            )}

                                            {editingCategory && editingCategory.id === task.id ? (
                                                <div className="flex items-center gap-1">
                                                    <Tag className="w-3 h-3 text-blue-400" />
                                                    <input
                                                        type="text"
                                                        value={editingCategory.type}
                                                        onChange={(e) => setEditingCategory({ ...editingCategory, type: e.target.value })}
                                                        onBlur={handleSaveCategory}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveCategory();
                                                            if (e.key === 'Escape') setEditingCategory(null);
                                                        }}
                                                        autoFocus
                                                        className="bg-slate-800/50 border border-blue-500/50 rounded px-2 py-0.5 text-blue-400 text-xs focus:outline-none w-24"
                                                    />
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setEditingCategory({ id: task.id, type: task.type || 'assignment' })}
                                                    className="flex items-center gap-1 capitalize hover:text-blue-400 transition-colors"
                                                >
                                                    <Tag className="w-3 h-3" />
                                                    <span>{task.type || 'assignment'}</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => deleteTask(task.id)}
                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    items={getContextMenuItems(contextMenu.taskId)}
                    position={{ x: contextMenu.x, y: contextMenu.y }}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
}
