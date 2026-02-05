'use client';

import React, { useEffect, useState } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';

export default function WindowControls() {
    const [isMaximized, setIsMaximized] = useState(false);
    const [isElectron, setIsElectron] = useState(false);

    useEffect(() => {
        // Check if running in Electron
        const isElec = typeof window !== 'undefined' && (window as any).electron !== undefined;
        setIsElectron(isElec);

        if (isElec) {
            const checkMaximized = async () => {
                const maximized = await (window as any).electron.isMaximized();
                setIsMaximized(maximized);
            };
            
            checkMaximized();
            
            // Periodically check or listen for resize
            window.addEventListener('resize', checkMaximized);
            return () => window.removeEventListener('resize', checkMaximized);
        }
    }, []);

    if (!isElectron) return null;

    const handleMinimize = () => (window as any).electron.minimize();
    const handleMaximize = () => {
        if (isMaximized) {
            (window as any).electron.unmaximize();
        } else {
            (window as any).electron.maximize();
        }
        setIsMaximized(!isMaximized);
    };
    const handleClose = () => (window as any).electron.close();

    return (
        <div className="flex items-center h-10 electron-no-drag bg-slate-900/40 backdrop-blur-md rounded-bl-xl border-l border-b border-white/10 overflow-hidden shadow-2xl">
            <button 
                onClick={handleMinimize}
                className="w-12 h-full flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-all group"
                title="Minimize"
            >
                <Minus className="w-4 h-4 group-active:scale-90" />
            </button>
            <button 
                onClick={handleMaximize}
                className="w-12 h-full flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-all group"
                title={isMaximized ? "Restore" : "Maximize"}
            >
                {isMaximized ? <Copy className="w-3.5 h-3.5 group-active:scale-90" /> : <Square className="w-3.5 h-3.5 group-active:scale-90" />}
            </button>
            <button 
                onClick={handleClose}
                className="w-12 h-full flex items-center justify-center hover:bg-red-500/90 text-slate-400 hover:text-white transition-all group"
                title="Close"
            >
                <X className="w-4 h-4 group-active:scale-90" />
            </button>
        </div>
    );
}
