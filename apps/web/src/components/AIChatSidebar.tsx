'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Plus, Trash2, MoreVertical } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Chat {
    id: string;
    title: string;
    created_at: string;
}

interface Props {
    currentChatId?: string;
    onSelectChat: (chatId: string) => void;
    onNewChat: () => void;
}

export default function AIChatSidebar({ currentChatId, onSelectChat, onNewChat }: Props) {
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChats();

        // Subscribe to changes
        const channel = supabase
            .channel('ai_chats_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_chats' }, () => {
                fetchChats();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchChats = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await (supabase.from('ai_chats') as any)
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (data) setChats(data);
        setLoading(false);
    };

    const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();
        if (!confirm('Delete this chat?')) return;

        await (supabase.from('ai_chats') as any).delete().eq('id', chatId);
        if (currentChatId === chatId) {
            onNewChat();
        }
    };

    return (
        <div className="w-64 bg-slate-900 border-r border-white/10 flex flex-col h-full">
            <div className="p-4">
                <button
                    onClick={onNewChat}
                    className="w-full glass-button py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-white hover:bg-white/10 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    <span>New Chat</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-1">
                {loading ? (
                    <div className="text-center py-4 text-slate-500 text-sm">Loading history...</div>
                ) : chats.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-sm">No chat history</div>
                ) : (
                    chats.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => onSelectChat(chat.id)}
                            className={`group flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors ${currentChatId === chat.id
                                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                }`}
                        >
                            <MessageSquare className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate text-sm flex-1">{chat.title}</span>
                            <button
                                onClick={(e) => handleDeleteChat(e, chat.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
