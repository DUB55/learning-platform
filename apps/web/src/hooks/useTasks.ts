import useSWR from 'swr';
import { supabase } from '@/lib/supabase';

export interface Task {
    id: string;
    user_id: string;
    title: string;
    is_completed: boolean;
    type: 'test' | 'review' | 'assignment' | 'deadline' | null;
    due_date: string | null;
    position?: number;
    parent_id?: string | null;
    created_at: string;
    source?: 'remote' | 'local';
}

const fetcher = async (url: string) => {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        if (error.name === 'AbortError') return [];
        throw error;
    }
    return data as Task[];
};

export function useTasks(user: { id: string } | null) {
    const { data, error, isLoading, mutate } = useSWR<Task[]>(
        user ? 'tasks' : null,
        fetcher,
        {
            revalidateOnFocus: true,
            revalidateOnMount: true,
            dedupingInterval: 2000,
            fallbackData: [],
            shouldRetryOnError: false
        }
    );

    let localTasks: Task[] = [];
    try {
        const raw = localStorage.getItem('local_tasks');
        if (raw) {
            const parsed = JSON.parse(raw) as Task[];
            if (Array.isArray(parsed)) {
                localTasks = parsed.map(t => ({ ...t, source: 'local' }));
            }
        }
    } catch {}

    const remoteTasks = (data || []).map(t => ({ ...t, source: 'remote' as const }));
    const remoteIds = new Set(remoteTasks.map(t => t.id));
    const dedupedLocal = localTasks.filter(t => !remoteIds.has(t.id));
    const mergedTasks = [...remoteTasks, ...dedupedLocal];

    return {
        tasks: mergedTasks,
        isLoading,
        isError: error,
        mutate
    };
}
