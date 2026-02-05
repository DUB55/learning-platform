'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { xpService, UserXP } from '@/lib/xpService';
import { useAuth } from './AuthContext';
import ErrorLogger from '@/lib/ErrorLogger';

interface UserXPContextType {
    userXP: UserXP | null;
    loading: boolean;
    refreshXP: () => Promise<void>;
    xpProgress: number;
    xpForNext: number;
}

const UserXPContext = createContext<UserXPContextType>({
    userXP: null,
    loading: true,
    refreshXP: async () => {},
    xpProgress: 0,
    xpForNext: 100,
});

export const useUserXP = () => useContext(UserXPContext);

export function UserXPProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [userXP, setUserXP] = useState<UserXP | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchXP = useCallback(async () => {
        if (!user) {
            setUserXP(null);
            setLoading(false);
            return;
        }

        try {
            const xp = await xpService.getUserXP(user.id);
            setUserXP(xp);
        } catch (error) {
            ErrorLogger.error('Failed to fetch user XP', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchXP();

        if (!user) return;

        // Set up realtime listener for XP updates
        const channel = supabase
            .channel(`user_xp_${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'user_xp',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    setUserXP(payload.new as UserXP);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchXP]);

    // Calculate progress correctly
    // Level 1: 0-99 XP
    // Level 2: 100-399 XP
    // Level 3: 400-899 XP
    // Range for Level L: xpForNextLevel(L-1) to xpForNextLevel(L)
    
    const currentLevel = userXP?.level || 1;
    const totalXP = userXP?.total_xp || 0;
    
    const xpForCurrentStart = currentLevel > 1 ? xpService.xpForNextLevel(currentLevel - 1) : 0;
    const xpForNextStart = xpService.xpForNextLevel(currentLevel);
    
    const range = xpForNextStart - xpForCurrentStart;
    const earnedInLevel = totalXP - xpForCurrentStart;
    const xpProgress = Math.min(100, Math.max(0, (earnedInLevel / range) * 100));

    return (
        <UserXPContext.Provider 
            value={{ 
                userXP, 
                loading, 
                refreshXP: fetchXP,
                xpProgress,
                xpForNext: xpForNextStart
            }}
        >
            {children}
        </UserXPContext.Provider>
    );
}
