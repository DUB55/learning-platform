'use server';

import { fetchYoutubeTranscript } from '@/lib/youtube';
import { dub5ai } from '@/lib/dub5ai';

export type GenerateOptions = {
    type: 'flashcards' | 'summary';
    summaryType?: 'long' | 'normal' | 'short';
};

export async function generateFromYoutube(url: string, options: GenerateOptions) {
    try {
        // 1. Fetch Transcript
        const transcript = await fetchYoutubeTranscript(url);
        if (!transcript) throw new Error('Could not fetch transcript');

        // 2. Generate Content
        if (options.type === 'flashcards') {
            const cards = await dub5ai.generateLearningSet(transcript);
            return { success: true, data: cards, type: 'flashcards' };
        } else {
            const summary = await dub5ai.generateSummary(transcript, options.summaryType || 'normal');
            return { success: true, data: summary, type: 'summary' };
        }
    } catch (error: any) {
        console.error('YouTube Generation Error:', error);
        return { success: false, error: error.message || 'Failed to generate content' };
    }
}

// File Import
import { extractTextFromPdf } from '@/lib/document-parser';

export async function generateFromFile(formData: FormData, options: GenerateOptions) {
    try {
        const file = formData.get('file') as File;
        if (!file) throw new Error('No file provided');

        let text = '';
        if (file.type === 'application/pdf') {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            text = await extractTextFromPdf(buffer);
        } else if (file.type === 'text/plain') {
            text = await file.text();
        } else {
            throw new Error('Unsupported file type. Please use PDF or Text files.');
        }

        // 2. Generate Content
        if (options.type === 'flashcards') {
            // Chunking might be needed for large PDFs, but for now we slice max length
            // Dub5AI generateLearningSet takes a string.
            const cards = await dub5ai.generateLearningSet(text.slice(0, 50000));
            return { success: true, data: cards, type: 'flashcards' };
        } else {
            const summary = await dub5ai.generateSummary(text.slice(0, 50000), options.summaryType || 'normal');
            return { success: true, data: summary, type: 'summary' };
        }

    } catch (error: any) {
        console.error('File Generation Error:', error);
        return { success: false, error: error.message || 'Failed to process file' };
    }
}

