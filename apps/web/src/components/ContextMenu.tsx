'use client';

import { useState, useEffect, useRef } from 'react';

interface ContextMenuItem {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    danger?: boolean;
    divider?: boolean;
}

interface ContextMenuProps {
    items: ContextMenuItem[];
    position: { x: number; y: number } | null;
    onClose: () => void;
}

export default function ContextMenu({ items, position, onClose }: ContextMenuProps) {
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
                className="fixed z-50 w-48 rounded-xl border border-white/10 shadow-xl overflow-hidden bg-slate-800 animate-fade-in"
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                }}
            >
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
            </div>
        </>
    );
}
