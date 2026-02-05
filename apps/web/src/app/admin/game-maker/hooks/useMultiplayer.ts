import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface Collaborator {
    id: string;
    name: string;
    avatar?: string;
    color: string;
    lastSeen: number;
    selection?: string | null;
    activity?: 'idle' | 'editing' | 'viewing' | 'moving';
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export function useMultiplayer(gameId: string) {
    const { user, profile } = useAuth();
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

    // Simulatie van real-time aanwezigheid
    // In een echte app zouden we Supabase Presence of WebSockets gebruiken
    useEffect(() => {
        if (!user) return;

        // Voeg onszelf toe (simulatie)
        const self: Collaborator = {
            id: user.id,
            name: profile?.full_name || user.email?.split('@')[0] || 'Anonymous',
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            lastSeen: Date.now(),
        };

        // Simuleer een andere gebruiker die af en toe verschijnt
        const mockCollaborator: Collaborator = {
            id: 'mock-user-1',
            name: 'DevPartner',
            color: '#10b981',
            lastSeen: Date.now(),
            selection: null
        };

        setCollaborators([self, mockCollaborator]);

        // In een echte implementatie zouden we hier luisteren naar veranderingen in de database/presence
        const interval = setInterval(() => {
            setCollaborators(prev => prev.map(c => {
                if (c.id === 'mock-user-1') {
                    const activities: Collaborator['activity'][] = ['idle', 'editing', 'viewing', 'moving'];
                    return { 
                        ...c, 
                        lastSeen: Date.now(), 
                        selection: Math.random() > 0.7 ? 'obj-1' : null,
                        activity: activities[Math.floor(Math.random() * activities.length)]
                    };
                }
                return c;
            }));
        }, 8000);

        return () => clearInterval(interval);
    }, [user, profile]);

    const updateSelection = (objectId: string | null) => {
        setCollaborators(prev => prev.map(c => 
            c.id === user?.id ? { ...c, selection: objectId } : c
        ));
        // Hier zouden we `supabase.channel(gameId).send(...)` aanroepen
    };

    return { collaborators, updateSelection };
}
