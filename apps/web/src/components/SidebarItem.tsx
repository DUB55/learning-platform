'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
    icon: LucideIcon;
    label: string;
    href?: string;
    onClick?: () => void;
    active?: boolean;
    compact?: boolean;
    color?: string;
    className?: string;
}

export default function SidebarItem({
    icon: Icon,
    label,
    href,
    onClick,
    active,
    compact,
    color,
    className
}: SidebarItemProps) {
    // Inner content rendering
    const content = (
        <>
            {/* Icon Rail - Fixed width w-[68px] (approx 4.25rem) */}
            <div className="w-[68px] flex-shrink-0 flex items-center justify-center">
                {/* Perfect Square Icon Container */}
                <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${active
                        ? 'bg-blue-600 shadow-lg shadow-blue-500/25 text-white'
                        : `${color || 'text-slate-400'} group-hover:bg-white/5 group-hover:text-white`
                    }`}>
                    <Icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                </div>
            </div>

            {/* Text Rail */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out flex items-center
                ${compact ? 'w-0 opacity-0' : 'w-40 opacity-100'}
            `}>
                <span className={`font-medium whitespace-nowrap px-1 transition-colors duration-200 ${
                    active 
                        ? 'text-blue-400 font-semibold' 
                        : 'text-slate-300 group-hover:text-white'
                }`}>
                    {label}
                </span>
            </div>
        </>
    );

    // Row styles with hover effect on entire row
    const baseClasses = `h-12 flex items-center mb-1 transition-all duration-200 cursor-pointer select-none rounded-xl group hover:bg-white/5 ${className || ''}`;

    if (href) {
        return (
            <Link href={href} onClick={onClick} className={baseClasses}>
                {content}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={`${baseClasses} w-full`}>
            {content}
        </button>
    );
}

