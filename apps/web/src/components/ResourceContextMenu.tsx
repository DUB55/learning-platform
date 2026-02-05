'use client';

import { useEffect, useRef } from 'react';
import { Globe, Lock } from 'lucide-react';

interface ResourceMenuItem {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    danger?: boolean;
    divider?: boolean;
}

interface ResourceContextMenuProps {
    items: ResourceMenuItem[];
    position: { x: number; y: number } | null;
    onClose: () => void;
    resourceType: 'subject' | 'unit' | 'paragraph' | 'document';
    isGlobal: boolean;
    isAdmin: boolean;
}

export default function ResourceContextMenu({
    items,
    position,
    onClose,
    resourceType,
    isGlobal,
    isAdmin
}: ResourceContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (position) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [position, onClose]);

    if (!position) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" />

            {/* Context Menu */}
            <div
                ref={menuRef}
                className="fixed z-50 w-56 rounded-xl border border-white/10 shadow-xl overflow-hidden bg-slate-800 animate-fade-in"
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                }}
            >
                {/* Status Badge */}
                <div className="px-4 py-2 bg-slate-900/50 border-b border-white/5">
                    <div className="flex items-center gap-2 text-xs">
                        {isGlobal ? (
                            <>
                                <Globe className="w-3 h-3 text-blue-400" />
                                <span className="text-blue-400">Global {resourceType}</span>
                            </>
                        ) : (
                            <>
                                <Lock className="w-3 h-3 text-slate-500" />
                                <span className="text-slate-500">Private {resourceType}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Menu Items */}
                {items.map((item, index) => (
                    <div key={index}>
                        {item.divider && <div className="border-t border-white/10" />}
                        <button
                            onClick={() => {
                                item.onClick();
                                onClose();
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${item.danger
                                    ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            <div className="w-4 h-4 flex items-center justify-center">
                                {item.icon}
                            </div>
                            <span className="text-sm">{item.label}</span>
                        </button>
                    </div>
                ))}

                {/* Admin Note */}
                {isAdmin && (
                    <div className="px-4 py-2 bg-slate-900/50 border-t border-white/5">
                        <p className="text-xs text-slate-500">Admin controls</p>
                    </div>
                )}
            </div>
        </>
    );
}
