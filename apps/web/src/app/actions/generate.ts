'use server';

import { fetchYoutubeTranscript } from '@/lib/youtube';
import { dub5ai } from '@/lib/dub5ai';
import ErrorLogger from '@/lib/ErrorLogger';

export type GenerateOptions = {
    type: 'flashcards' | 'summary' | 'quiz' | 'smart-notes';
    summaryType?: 'long' | 'normal' | 'short';
    topic?: string;
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
        } else if (options.type === 'quiz') {
            const quiz = await dub5ai.generatePracticeTest(transcript, options.topic || 'Video Content');
            return { success: true, data: quiz, type: 'quiz' };
        } else if (options.type === 'smart-notes') {
            const notes = await dub5ai.generateSummary(transcript, 'long');
            return { success: true, data: notes, type: 'smart-notes' };
        } else {
            const summary = await dub5ai.generateSummary(transcript, options.summaryType || 'normal');
            return { success: true, data: summary, type: 'summary' };
        }
    } catch (error: any) {
        ErrorLogger.error('YouTube Generation Error:', error);
        return { success: false, error: error.message || 'Failed to generate content' };
    }
}

// File Import
import { extractTextFromPdf, extractTextFromImage } from '@/lib/document-parser';

export async function generateFromFile(formData: FormData, options: GenerateOptions) {
    try {
        const file = formData.get('file') as File;
        if (!file) throw new Error('No file provided');

        let text = '';
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (file.type === 'application/pdf') {
            text = await extractTextFromPdf(buffer);
        } else if (file.type === 'text/plain') {
            text = await file.text();
        } else if (file.type.startsWith('image/')) {
            text = await extractTextFromImage(buffer);
        } else {
            throw new Error('Unsupported file type. Please use PDF, Text, or Image files.');
        }

        // 2. Generate Content
        if (!text.trim()) throw new Error('No text content found in file');

        if (options.type === 'flashcards') {
            const cards = await dub5ai.generateLearningSet(text.slice(0, 50000));
            return { success: true, data: cards, type: 'flashcards' };
        } else if (options.type === 'quiz') {
            const quiz = await dub5ai.generatePracticeTest(text.slice(0, 50000), options.topic || file.name);
            return { success: true, data: quiz, type: 'quiz' };
        } else if (options.type === 'smart-notes') {
            const notes = await dub5ai.generateSummary(text.slice(0, 50000), 'long');
            return { success: true, data: notes, type: 'smart-notes' };
        } else {
            const summary = await dub5ai.generateSummary(text.slice(0, 50000), options.summaryType || 'normal');
            return { success: true, data: summary, type: 'summary' };
        }

    } catch (error: any) {
        ErrorLogger.error('File Generation Error:', error);
        return { success: false, error: error.message || 'Failed to process file' };
    }
}

