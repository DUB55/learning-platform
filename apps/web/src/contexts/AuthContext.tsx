'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import ErrorLogger from '@/lib/ErrorLogger';
import { xpService } from '@/lib/xpService';

interface Profile {
    id: string;
    full_name?: string;
    bio?: string;
    is_admin?: boolean;
    avatar_url?: string;
    xp?: number;
    level?: number;
    [key: string]: unknown;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, fullName?: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    updateXP: (amount: number, reason?: string) => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    signIn: async () => { },
    signUp: async () => { },
    signInWithGoogle: async () => { },
    signOut: async () => { },
    updateXP: async () => { },
    refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        let unsub: { unsubscribe: () => void } | null = null;
        const init = async () => {
            try {
                initTimeoutRef.current = setTimeout(() => {
                    setLoading(false);
                }, 6000);
                const { data } = await supabase.auth.getSession();
                const session = data?.session || null;
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    await fetchProfile(session.user.id);
                } else {
                    if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
                    setLoading(false);
                }
            } catch {
                setSession(null);
                setUser(null);
                setProfile(null);
                if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
                setLoading(false);
            }
            try {
                const sub = supabase.auth.onAuthStateChange((_event, session) => {
                    setSession(session);
                    setUser(session?.user ?? null);
                    if (session?.user) {
                        fetchProfile(session.user.id);
                    } else {
                        setProfile(null);
                        if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
                        setLoading(false);
                    }
                });
                unsub = sub.data.subscription;
            } catch {
                unsub = null;
            }
        };
        init();
        return () => {
            try {
                unsub?.unsubscribe();
            } catch { }
        };
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            const timeoutId = setTimeout(() => {
                setLoading(false);
            }, 5000);
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            clearTimeout(timeoutId);
            if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
            setProfile((data ?? null) as Profile | null);
        } catch (error) {
            ErrorLogger.error('Error fetching profile', error);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
    };

    const signUp = async (email: string, password: string, fullName?: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                data: {
                    full_name: fullName || email.split('@')[0]
                }
            },
        });
        if (error) throw error;
    };

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`,
            },
        });
        if (error) throw error;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        // Redirect to landing page after logout
        if (typeof window !== 'undefined') {
            window.location.href = '/';
        }
    };

    const updateXP = async (amount: number, reason: string = 'Activity reward') => {
        if (!user) return;

        const success = await xpService.awardXP(user.id, amount, reason);
        
        if (success) {
            // Refresh profile to get updated XP and level
            await fetchProfile(user.id);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    return (
        <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signInWithGoogle, signOut, updateXP, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}
