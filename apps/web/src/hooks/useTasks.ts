import useSWR from 'swr';
import { supabase } from '@/lib/supabase';

export interface Task {
    id: string;
    user_id: string;
    title: string;
    is_completed: boolean;
    type: 'test' | 'review' | 'assignment' | 'deadline' | null;
    due_date: string | null;
    created_at: string;
}

const fetcher = async () => {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Task[];
};

export function useTasks(user: any) {
    const { data, error, isLoading, mutate } = useSWR<Task[]>(
        user ? 'tasks' : null,
        fetcher,
        {
            revalidateOnFocus: true, // Revalidate when window gets focus
            revalidateOnMount: true, // Ensure data is fetched on mount
            dedupingInterval: 2000, // Reduce deduping to allow quicker updates
            fallbackData: []
        }
    );

    return {
        tasks: data || [],
        isLoading,
        isError: error,
        mutate
    };
}
