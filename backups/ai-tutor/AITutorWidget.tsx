'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { AITutorChat } from './AITutorChat';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import ErrorLogger from '@/lib/ErrorLogger';

export default function AITutorWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const { user, profile } = useAuth();
    const pathname = usePathname();
    const [context, setContext] = useState('');

    // Hide for admins
    // if (!user || profile?.is_admin) return null; // MOVED TO RENDER

    // Fetch context when probing a document page
    useEffect(() => {
        const fetchContext = async () => {
            // Reset context on nav change
            setContext('');

            if (!pathname) return;

            // Check if we are on a document page
            // Path: /subjects/[id]/units/[unitId]/paragraphs/[paraId]/documents/[docId]
            // We can look for "documents/" segment and take the next one
            const match = pathname.match(/\/documents\/([^\/]+)/);
            if (match && match[1] && match[1] !== 'create') {
                const docId = match[1];
                try {
                    const { data, error } = await supabase
                        .from('documents')
                        .select('content, title')
                        .eq('id', docId)
                        .single();

                    if (data && data.content) {
                        setContext(`Current Document: ${data.title}\n\nContent:\n${data.content}`);
                    }
                } catch (err) {
                    ErrorLogger.error("Failed to load AI context", err);
                }
            }
        };

        fetchContext();
    }, [pathname]);

    if (!user || profile?.is_admin) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {isOpen ? (
                <div className="w-[400px] h-[600px] shadow-2xl rounded-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <AITutorChat context={context} onClose={() => setIsOpen(false)} />
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full shadow-lg hover:shadow-blue-500/25 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
                >
                    <MessageCircle className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                    {context && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f172a]" />
                    )}
                </button>
            )}
        </div>
    );
}
