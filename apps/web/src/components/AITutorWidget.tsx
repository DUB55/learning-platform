'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { AITutorChat } from './AITutorChat';
import { useAuth } from '@/contexts/AuthContext';

export default function AITutorWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {isOpen ? (
                <div className="w-[400px] h-[600px] shadow-2xl rounded-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <AITutorChat onClose={() => setIsOpen(false)} />
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg hover:shadow-blue-500/25 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                >
                    <MessageCircle className="w-7 h-7" />
                </button>
            )}
        </div>
    );
}
