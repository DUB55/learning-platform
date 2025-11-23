'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Plus, CheckCircle2, Circle, Trash2, Calendar as CalendarIcon, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function TodoPage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

    useEffect(() => {
        if (user) {
            fetchTasks();
        }
    }, [user]);

    const fetchTasks = async () => {
        try {
            const { data } = await supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) setTasks(data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newTaskTitle.trim()) return;

        try {
            const { error } = await supabase
                .from('tasks')
                .insert([
                    {
                        user_id: user.id,
                        title: newTaskTitle,
                        is_completed: false,
                        type: 'assignment' // Default type
                    }
                ] as any);

            if (error) throw error;

            setNewTaskTitle('');
            fetchTasks();
        } catch (error) {
            console.error('Error adding task:', error);
        }
    };

    const toggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ is_completed: !currentStatus })
                .eq('id', taskId);

            if (error) throw error;

            // Optimistic update
            setTasks(tasks.map(t => t.id === taskId ? { ...t, is_completed: !currentStatus } : t));
        } catch (error) {
            console.error('Error updating task:', error);
            fetchTasks(); // Revert on error
        }
    };

    const deleteTask = async (taskId: string) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);

            if (error) throw error;

            setTasks(tasks.filter(t => t.id !== taskId));
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (filter === 'active') return !task.is_completed;
        if (filter === 'completed') return task.is_completed;
        return true;
    });

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
                            filteredTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className={`glass-card p-4 flex items-center gap-4 group transition-all ${task.is_completed ? 'opacity-50' : ''
                                        }`}
                                >
                                    <button
                                        onClick={() => toggleTaskCompletion(task.id, task.is_completed)}
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.is_completed
                                                ? 'bg-blue-500 border-blue-500 text-white'
                                                : 'border-slate-500 text-transparent hover:border-blue-500'
                                            }`}
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                    </button>

                                    <div className="flex-1">
                                        <h3 className={`font-medium text-white ${task.is_completed ? 'line-through text-slate-400' : ''}`}>
                                            {task.title}
                                        </h3>
                                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                            {task.due_date && (
                                                <div className="flex items-center gap-1">
                                                    <CalendarIcon className="w-3 h-3" />
                                                    <span>{new Date(task.due_date).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                            {task.type && (
                                                <div className="flex items-center gap-1 capitalize">
                                                    <Tag className="w-3 h-3" />
                                                    <span>{task.type}</span>
                                                </div>
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
        </div>
    );
}
