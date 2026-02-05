/**
 * API Utility for handling requests to the backend.
 * Prioritizes NEXT_PUBLIC_API_URL and provides fallbacks for production/local environments.
 */

export const getApiBaseUrl = () => {
    // 1. Check for explicitly defined environment variable
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // 2. Client-side logic
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        
        // If we are on localhost, default to the known local API port
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3003';
        }

        // If we are in production, default to the current origin (assuming proxied or same-domain)
        return window.location.origin;
    }

    // 3. Server-side fallback (e.g. during SSR)
    return '';
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const baseUrl = getApiBaseUrl();
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return response.json();
};
