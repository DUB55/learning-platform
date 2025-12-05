'use client';

import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface SiteContent {
    selector: string;
    text: string;
}

// Apply changes to DOM
const applyChangesToDOM = (contentMap: Map<string, string>) => {
    contentMap.forEach((text, selector) => {
        try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (el instanceof HTMLElement && el.innerText !== text) {
                    // Only update if not currently being edited
                    if (el.contentEditable !== 'true') {
                        el.innerText = text;
                    }
                }
            });
        } catch (e) {
            // Ignore invalid selectors
        }
    });
};

export default function SiteContentLoader() {
    const [contentMap, setContentMap] = useState<Map<string, string>>(() => {
        // Initialize from localStorage synchronously during state init
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('site_content_cache');
            if (cached) {
                try {
                    return new Map(JSON.parse(cached));
                } catch (e) {
                    console.error('Failed to parse site content cache', e);
                }
            }
        }
        return new Map();
    });
    const initialApplyDone = useRef(false);

    // Apply cached content synchronously on first render (before paint)
    useLayoutEffect(() => {
        if (contentMap.size > 0 && !initialApplyDone.current) {
            applyChangesToDOM(contentMap);
            initialApplyDone.current = true;
        }
    }, []);

    useEffect(() => {
        fetchContent();

        // Realtime subscription
        const channel = supabase
            .channel('site_content_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'site_content' }, (payload) => {
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    const newRecord = payload.new as SiteContent;
                    setContentMap(prev => {
                        const newMap = new Map(prev).set(newRecord.selector, newRecord.text);
                        // Update cache
                        localStorage.setItem('site_content_cache', JSON.stringify(Array.from(newMap.entries())));
                        return newMap;
                    });
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchContent = async () => {
        const { data } = await (supabase.from('site_content') as any).select('selector, text');
        if (data) {
            const map = new Map<string, string>();
            data.forEach((item: SiteContent) => map.set(item.selector, item.text));
            setContentMap(map);
            // Update cache
            localStorage.setItem('site_content_cache', JSON.stringify(Array.from(map.entries())));
        }
    };

    // Apply changes when contentMap updates
    useEffect(() => {
        if (contentMap.size === 0) return;

        applyChangesToDOM(contentMap);

        // Observe DOM changes to re-apply (for dynamic content)
        const observer = new MutationObserver(() => {
            applyChangesToDOM(contentMap);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });

        return () => observer.disconnect();
    }, [contentMap]);

    return null; // Headless component
}
