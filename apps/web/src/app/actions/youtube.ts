'use server';

import { fetchYoutubeTranscript } from '@/lib/youtube';

export async function getYoutubeTranscript(url: string) {
    try {
        const text = await fetchYoutubeTranscript(url);
        return { success: true, text };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to fetch transcript' };
    }
}
