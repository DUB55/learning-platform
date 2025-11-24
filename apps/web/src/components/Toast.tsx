'use client';

import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose: () => void;
}

export default function Toast({ message, type = 'info', duration = 5000, onClose }: ToastProps) {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-5 h-5" />;
            case 'error':
                return <AlertCircle className="w-5 h-5" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5" />;
            default:
                return <Info className="w-5 h-5" />;
        }
    };

    const getColors = () => {
        switch (type) {
            case 'success':
                return 'border-green-500/30 bg-green-500/10 text-green-400';
            case 'error':
                return 'border-red-500/30 bg-red-500/10 text-red-400';
            case 'warning':
                return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
            default:
                return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
        }
    };

    return (
        <div
            className={`fixed top-4 right-4 z-[100] glass-card p-4 border ${getColors()} min-w-[320px] max-w-md animate-slide-in-right`}
            role="alert"
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                    {getIcon()}
                </div>
                <div className="flex-1">
                    <p className="text-white text-sm leading-relaxed">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
                >
                    <X className="w-4 h-4 text-slate-400" />
                </button>
            </div>
        </div>
    );
}
