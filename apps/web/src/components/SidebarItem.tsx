'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
    const router = useRouter();

    // Prefetch on hover for instant navigation
    const handleMouseEnter = () => {
        if (href) {
            router.prefetch(href);
        }
    };

    // Active state now applies to the ICON CONTAINER, not the row
    // Row hover effect remains for subtle feedback

    // Inner content rendering
    const content = (
        <>
            {/* Icon Container - Fixed width for perfect vertical alignment */}
            <div className="w-12 flex-shrink-0 flex items-center justify-center">
                {/* Icon is now just the icon, background is handled by the row to prevent flickering */}
                <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${active
                    ? 'text-blue-500'
                    : `${color || 'text-slate-400'} group-hover:text-white`
                    }`}>
                    <Icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                </div>
            </div>

            {/* Text Rail */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out flex items-center
                ${compact ? 'w-0 opacity-0' : 'w-40 opacity-100'}
            `}>
                <span className={`font-medium whitespace-nowrap px-1 transition-colors duration-200 ${active
                    ? 'text-blue-400 font-semibold'
                    : 'text-slate-300 group-hover:text-white'
                    }`}>
                    {label}
                </span>
            </div>
        </>
    );

    // Row styles: 
    // - Active state always applies to the ROW to prevent flickering during sidebar expansion/hover.
    // - In compact mode, the row is 52px wide, which looks like a square indicator.
    const baseClasses = `h-11 flex items-center mb-1 mx-1 transition-all duration-200 cursor-pointer select-none rounded-lg group border ${active
        ? 'bg-blue-500/10 border-blue-500/20 shadow-sm shadow-blue-500/5'
        : 'border-transparent hover:bg-white/5'
        } ${className || ''}`;

    if (href) {
        return (
            <Link
                href={href}
                onClick={onClick}
                onMouseEnter={handleMouseEnter}
                prefetch={true}
                className={baseClasses}
            >
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
