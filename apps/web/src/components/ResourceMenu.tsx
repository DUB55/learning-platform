'use client';

import { useState } from 'react';
import { MoreVertical, LucideIcon } from 'lucide-react';

interface ResourceMenuAction {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    variant?: 'default' | 'danger';
}

interface ResourceMenuProps {
    title: string;
    actions: ResourceMenuAction[];
}

export default function ResourceMenu({ title, actions }: ResourceMenuProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    ></div>

                    {/* Menu */}
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 shadow-xl z-50 overflow-hidden bg-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 mb-1">
                            {title}
                        </div>
                        {actions.map((action, index) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    action.onClick();
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
                                    action.variant === 'danger'
                                        ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <action.icon className="w-4 h-4" />
                                <span className="text-sm">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
