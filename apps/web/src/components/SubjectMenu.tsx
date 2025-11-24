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
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
                <MoreVertical className="w-5 h-5" />
            </button>

            <Eye className="w-4 h-4" />
            <span className="text-sm">View Details</span>
        </button>

                        {
        isOwner && (
            <>
                <button
                    onClick={() => {
                        onEdit?.();
                        setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                    <Edit2 className="w-4 h-4" />
                    <span className="text-sm">Edit Subject</span>
                </button>

                <div className="border-t border-white/10"></div>

                <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">Delete</span>
                </button>
            </>
        )
    }
                    </div >
                </>
            )
}
        </div >
    );
}
