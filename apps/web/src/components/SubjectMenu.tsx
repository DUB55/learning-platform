'use client';

import { useState } from 'react';
import { MoreVertical, Edit2, Trash2, Eye } from 'lucide-react';

interface SubjectMenuProps {
    subjectId: string;
    subjectTitle: string;
    isOwner: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    onView?: () => void;
}

export default function SubjectMenu({ subjectId, subjectTitle, isOwner, onEdit, onDelete, onView }: SubjectMenuProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete "${subjectTitle}"? This will delete all units, paragraphs, and documents.`)) {
            onDelete?.();
        }
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
                <MoreVertical className="w-5 h-5" />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    ></div>

                    {/* Menu - Fully Opaque */}
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 shadow-xl z-50 overflow-hidden bg-slate-800">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onView?.();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <Eye className="w-4 h-4" />
                            <span className="text-sm">View Details</span>
                        </button>

                        {isOwner && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit?.();
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    <span className="text-sm">Edit Subject</span>
                                </button>

                                <div className="border-t border-white/10"></div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete();
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="text-sm">Delete</span>
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
