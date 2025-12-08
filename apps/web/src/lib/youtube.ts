import { YoutubeTranscript } from 'youtube-transcript';

export interface VideoTranscript {
    text: string;
    duration: number;
    offset: number;
}

export async function fetchYoutubeTranscript(videoIdOrUrl: string): Promise<string> {
    try {
        const transcriptItems = await YoutubeTranscript.fetchTranscript(videoIdOrUrl);
        return transcriptItems.map(item => item.text).join(' ');
    } catch (error) {
        console.error('Error fetching YouTube transcript:', error);
        throw new Error('Failed to fetch transcript. The video might not have captions enabled.');
    }
}
