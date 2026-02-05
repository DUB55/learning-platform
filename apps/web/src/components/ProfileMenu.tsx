'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, Settings, Shield, FileText, Lock, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { user, profile, signOut } = useAuth();

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getInitials = () => {
        if (profile?.full_name) {
            return profile.full_name
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
        }
        return user?.email?.[0].toUpperCase() || '?';
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* Profile Picture Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px] hover:scale-105 transition-transform"
            >
                {profile?.avatar_url ? (
                    <div className="relative w-full h-full rounded-full overflow-hidden">
                        <Image
                            src={profile.avatar_url}
                            alt="Profile"
                            fill
                            className="object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white font-medium text-sm">
                        {getInitials()}
                    </div>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 glass-card border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-sm font-medium text-white truncate">
                            {profile?.full_name || 'User'}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                        <MenuItem
                            icon={<Settings className="w-4 h-4" />}
                            label="Settings"
                            href="/settings"
                            onClick={() => setIsOpen(false)}
                        />
                        <MenuItem
                            icon={<User className="w-4 h-4" />}
                            label="Profile"
                            href="/profile"
                            onClick={() => setIsOpen(false)}
                        />
                        {profile?.is_admin && (
                            <MenuItem
                                icon={<Shield className="w-4 h-4" />}
                                label="Admin Panel"
                                href="/admin"
                                onClick={() => setIsOpen(false)}
                            />
                        )}
                        <div className="my-1 border-t border-white/10"></div>
                        <MenuItem
                            icon={<Lock className="w-4 h-4" />}
                            label="Privacy"
                            href="/privacy"
                            onClick={() => setIsOpen(false)}
                        />
                        <MenuItem
                            icon={<FileText className="w-4 h-4" />}
                            label="Terms"
                            href="/terms"
                            onClick={() => setIsOpen(false)}
                        />
                        <div className="my-1 border-t border-white/10"></div>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                signOut();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm">Sign Out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function MenuItem({
    icon,
    label,
    href,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    href: string;
    onClick: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
        >
            {icon}
            <span className="text-sm">{label}</span>
        </Link>
    );
}
