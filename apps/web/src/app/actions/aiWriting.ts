'use server';

import { dub5ai } from '@/lib/dub5ai';
import ErrorLogger from '@/lib/ErrorLogger';

export type WritingMode = 
    | 'improve' 
    | 'summarize' 
    | 'expand' 
    | 'fix_grammar' 
    | 'tone_academic' 
    | 'tone_simple' 
    | 'brainstorm'
    | 'plagiarism_check'
    | 'remove_ai_style'
    | 'ai_detector'
    | 'remove_watermarks';

export async function processWriting(text: string, mode: WritingMode) {
    try {
        let prompt = '';
        
        switch (mode) {
            case 'improve':
                prompt = `Please improve the following text. Make it more professional, clear, and engaging while keeping the original meaning: \n\n${text}`;
                break;
            case 'summarize':
                prompt = `Please summarize the following text into a few concise bullet points or a short paragraph of the most important information: \n\n${text}`;
                break;
            case 'expand':
                prompt = `Please expand on the following text. Add more detail, explanations, and depth to the points mentioned: \n\n${text}`;
                break;
            case 'fix_grammar':
                prompt = `Please fix any grammar, spelling, or punctuation errors in the following text. Return the corrected version only: \n\n${text}`;
                break;
            case 'tone_academic':
                prompt = `Please rewrite the following text in a formal academic tone suitable for an essay or research paper: \n\n${text}`;
                break;
            case 'tone_simple':
                prompt = `Please simplify the following text so it is easy to understand for a child, using simple language and analogies if helpful: \n\n${text}`;
                break;
            case 'brainstorm':
                prompt = `Based on the following topic or draft, please brainstorm 5-10 related ideas, questions, or next steps to explore: \n\n${text}`;
                break;
            case 'plagiarism_check':
                prompt = `Act as a professional plagiarism checker and academic rewriter. 
                1. Thoroughly analyze the following text for potential plagiarism, lack of originality, or overly common academic phrasing.
                2. Rewrite the text completely from scratch while maintaining the exact core arguments and facts.
                3. Use a completely different sentence structure, unique vocabulary, and natural transitions.
                4. Ensure the output would pass any plagiarism detector (like Turnitin or Copyscape) with 0% similarity.
                5. Maintain all specific data points, citations (if any), and specialized terminology, but surround them with unique prose.
                
                Return ONLY the rewritten, unique version of the text: \n\n${text}`;
                break;
            case 'remove_ai_style':
                prompt = `Transform the following text to be completely undetectable by advanced AI detectors (GPTZero, Originality.ai, Winston, etc.). 
                - Apply "Human-Like Burstiness": Vary sentence lengths significantly (mix short, punchy sentences with longer, complex ones).
                - Apply "High Perplexity": Use more varied and less predictable word choices that a human would use, avoiding AI-typical "filler" words.
                - Inject "Human Nuance": Use subtle idioms, transitional phrases like "to be fair" or "as it turns out", and occasional non-standard but correct structures.
                - Eliminate AI Patterns: Remove common AI lists, "In conclusion" summaries, and repetitive "Firstly, Secondly" structures.
                - Maintain the original meaning and professional level of the text.
                
                Return ONLY the humanized, undetectable version: \n\n${text}`;
                break;
            case 'ai_detector':
                prompt = `Perform a deep forensic linguistic analysis on the following text to detect AI-generated patterns. 
                Look for:
                - Over-consistent sentence length and structure.
                - Use of extremely common "predictable" next-word sequences.
                - Lack of "burstiness" and "perplexity".
                - Typical AI formatting and transitional phrases.
                
                Provide a brief 2-3 sentence analysis of the findings, and then output the final assessment in this EXACT format at the very end: "AI Probability: [0-100]%, Human Probability: [0-100]%".
                
                Text to analyze: \n\n${text}`;
                break;
            case 'remove_watermarks':
                prompt = `Perform a deep "text cleaning" to remove any potential hidden digital watermarks or tracking markers used by LLMs (like OpenAI's multi-token watermarking).
                1. Strip all zero-width spaces (U+200B), non-breaking spaces, and hidden Unicode characters.
                2. Identify and replace homoglyphs (characters that look the same but have different Unicode IDs).
                3. Scramble and replace specific token-frequency patterns that might be used for statistical watermarking.
                4. Replace "AI-signature" phrases (e.g., "It's important to note", "In summary", "At the end of the day") with human alternatives.
                5. Ensure the text flows naturally and remains grammatically perfect.
                
                Return ONLY the cleaned, watermark-free text: \n\n${text}`;
                break;
            default:
                prompt = text;
        }

        const result = await dub5ai.chat([{ role: 'user', content: prompt }]);
        
        if (result.error) throw new Error(result.error);
        
        let metadata: any = {};
        
        if (mode === 'ai_detector') {
            const aiMatch = result.content.match(/AI Probability: (\d+)%/i);
            const humanMatch = result.content.match(/Human Probability: (\d+)%/i);
            
            if (aiMatch && humanMatch) {
                metadata.aiDetection = {
                    ai: parseInt(aiMatch[1]),
                    human: parseInt(humanMatch[1])
                };
            }
        }
        
        return { 
            success: true, 
            text: result.content,
            metadata: Object.keys(metadata).length > 0 ? metadata : undefined
        };
    } catch (error: any) {
        ErrorLogger.error('AI Writing Action Error:', error);
        return { success: false, error: error.message || 'Failed to process text' };
    }
}
