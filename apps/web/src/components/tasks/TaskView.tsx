'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Check, Trash2, Calendar as CalendarIcon, Tag, Edit2, ChevronRight, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTasks, type Task } from '@/hooks/useTasks';
import ContextMenu from '@/components/ContextMenu';
import { xpService } from '@/lib/xpService';
import ErrorLogger from '@/lib/ErrorLogger';

interface TaskViewProps {
    className?: string;
}

export default function TaskView({ className }: TaskViewProps) {
    const { user } = useAuth();
    const { tasks, isLoading: loading, mutate } = useTasks(user);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
    const [showLocalOnly, setShowLocalOnly] = useState<boolean>(false);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; taskId: string } | null>(null);
    const [editingTask, setEditingTask] = useState<{ id: string; title: string } | null>(null);
    const [editingCategory, setEditingCategory] = useState<{ id: string; type: string } | null>(null);
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
    const [addingSubtaskTo, setAddingSubtaskTo] = useState<string | null>(null);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

    const addTaskControllerRef = useRef<AbortController | null>(null);
    const taskUpdateControllerRefs = useRef<Map<string, AbortController>>(new Map());
    const deleteControllerRefs = useRef<Map<string, AbortController>>(new Map());

    useEffect(() => {
        return () => {
            addTaskControllerRef.current?.abort();
            taskUpdateControllerRefs.current.forEach(c => c.abort());
            deleteControllerRefs.current.forEach(c => c.abort());
        };
    }, []);

    const handleAddTask = async (e: React.FormEvent, parentId?: string) => {
        e.preventDefault();
        const title = parentId ? newSubtaskTitle : newTaskTitle;
        if (!user || !title.trim()) return;

        addTaskControllerRef.current?.abort();
        addTaskControllerRef.current = new AbortController();
        const signal = addTaskControllerRef.current.signal;

        const tempId = Math.random().toString();
        const maxPosition = tasks.length > 0 ? Math.max(...tasks.map((t: any) => t.position || 0)) : 0;

        const newTask: Task = {
            id: tempId,
            user_id: user.id,
            title: title,
            is_completed: false,
            type: 'assignment',
            position: maxPosition + 1,
            parent_id: parentId || null,
            created_at: new Date().toISOString(),
            due_date: null
        };

        try {
            await mutate([...tasks, newTask], false);
            if (parentId) {
                setNewSubtaskTitle('');
                setAddingSubtaskTo(null);
                setExpandedTasks(prev => new Set(prev).add(parentId));
            } else {
                setNewTaskTitle('');
            }

            const { data, error } = await (supabase
                .from('tasks') as any)
                .insert([
                    {
                        user_id: user.id,
                        title: title,
                        is_completed: false,
                        type: 'assignment',
                        position: maxPosition + 1,
                        parent_id: parentId || null,
                        due_date: null
                    }
                ])
                .select()
                .abortSignal(signal as any)
                .single();

            if (error) {
                if (error.name === 'AbortError') return;
                throw error;
            }
            await mutate();
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            ErrorLogger.error('Error adding task', error);
            await mutate();
        }
    };

    const toggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
        taskUpdateControllerRefs.current.get(taskId)?.abort();
        const controller = new AbortController();
        taskUpdateControllerRefs.current.set(taskId, controller);
        const signal = controller.signal;

        try {
            const updatedTasks = tasks.map((t: any) =>
                t.id === taskId ? { ...t, is_completed: !currentStatus } : t
            );
            await mutate(updatedTasks, false);

            const { error } = await (supabase
                .from('tasks') as any)
                .update({ is_completed: !currentStatus })
                .eq('id', taskId)
                .abortSignal(signal as any);

            if (error) {
                if (error.name === 'AbortError') return;
                throw error;
            }

            if (!currentStatus && user) {
                await (supabase.rpc as any)('increment_tasks_completed', { user_uuid: user.id });
                await xpService.checkTaskAchievements(user.id);
            }
            await mutate();
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            ErrorLogger.error('Error updating task', error);
            await mutate();
        }
    };

    const deleteTask = async (taskId: string) => {
        const controller = new AbortController();
        deleteControllerRefs.current.set(taskId, controller);
        try {
            // Find if this task has subtasks
            const taskToDelete = tasks.find(t => t.id === taskId);
            const subtaskIds = tasks.filter(t => t.parent_id === taskId).map(t => t.id);
            
            // Optimistic update
            await mutate(tasks.filter((t: any) => t.id !== taskId && t.parent_id !== taskId), false);

            // Delete subtasks first
            if (subtaskIds.length > 0) {
                await (supabase.from('tasks') as any)
                    .delete()
                    .in('id', subtaskIds);
            }

            // Delete the task itself
            const { error } = await (supabase
                .from('tasks') as any)
                .delete()
                .eq('id', taskId)
                .abortSignal(controller.signal as any);

            if (error) throw error;
            await mutate();
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            ErrorLogger.error('Error deleting task', error);
            await mutate();
        }
    };

    const toggleExpand = (taskId: string) => {
        setExpandedTasks(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) next.delete(taskId);
            else next.add(taskId);
            return next;
        });
    };

    const taskTree = useMemo(() => {
        const mainTasks = tasks.filter(t => !t.parent_id);
        const subtasks = tasks.filter(t => t.parent_id);
        
        return mainTasks.map(task => ({
            ...task,
            subtasks: subtasks.filter(st => st.parent_id === task.id)
        })).sort((a, b) => (b.position || 0) - (a.position || 0));
    }, [tasks]);

    const filteredTasks = taskTree.filter(task => {
        if (showLocalOnly && task.source !== 'local') return false;
        if (filter === 'active') return !task.is_completed;
        if (filter === 'completed') return task.is_completed;
        return true;
    });

    const renderTask = (task: any, isSubtask = false) => {
        const completedSubtasks = task.subtasks?.filter((st: any) => st.is_completed).length || 0;
        const totalSubtasks = task.subtasks?.length || 0;
        const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

        return (
            <div key={task.id} className={`${isSubtask ? 'ml-8 mt-2' : 'mt-3'}`}>
                <div className={`glass-card p-4 flex items-center gap-4 group transition-all ${task.is_completed ? 'opacity-50' : ''}`}>
                    {!isSubtask && totalSubtasks > 0 && (
                        <button onClick={() => toggleExpand(task.id)} className="text-slate-500 hover:text-white transition-colors">
                            {expandedTasks.has(task.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    )}
                    
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
                        <div className="flex items-center gap-2">
                            <h3 className={`font-medium text-white ${task.is_completed ? 'line-through text-slate-400' : ''}`}>
                                {task.title}
                            </h3>
                            {!isSubtask && totalSubtasks > 0 && (
                                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full font-bold">
                                    {completedSubtasks}/{totalSubtasks}
                                </span>
                            )}
                        </div>
                        {!isSubtask && totalSubtasks > 0 && (
                            <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500 transition-all duration-500" 
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        {!isSubtask && (
                            <button
                                onClick={() => setAddingSubtaskTo(addingSubtaskTo === task.id ? null : task.id)}
                                className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
                                title="Add subtask"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => deleteTask(task.id)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {addingSubtaskTo === task.id && (
                    <div className="ml-12 mt-2">
                        <form onSubmit={(e) => handleAddTask(e, task.id)} className="flex gap-2">
                            <input
                                type="text"
                                value={newSubtaskTitle}
                                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                placeholder="Add subtask..."
                                className="flex-1 bg-slate-800/30 border border-white/5 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                                autoFocus
                            />
                            <button type="submit" className="text-xs bg-blue-600/20 text-blue-400 px-3 py-1 rounded-lg hover:bg-blue-600/30">
                                Add
                            </button>
                        </form>
                    </div>
                )}

                {!isSubtask && expandedTasks.has(task.id) && task.subtasks?.map((st: any) => renderTask(st, true))}
            </div>
        );
    };

    return (
        <div className={`flex-1 flex flex-col ${className}`}>
            <div className="glass-card p-4 mb-8">
                <form onSubmit={(e) => handleAddTask(e)} className="flex gap-4">
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

            <div className="space-y-1">
                {loading ? (
                    <div className="text-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                        <p>No tasks found</p>
                    </div>
                ) : (
                    filteredTasks.map(task => renderTask(task))
                )}
            </div>
        </div>
    );
}
