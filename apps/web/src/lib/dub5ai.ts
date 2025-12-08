import { supabase } from './supabase';

export interface AIMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface AIResponse {
    content: string;
    error?: string;
}

class Dub5AIService {
    private apiUrl = 'https://chatbot-beta-weld.vercel.app/api/chatbot';

    /**
     * Sends a streaming request to Dub5 AI
     */
    async streamRequest(
        input: string,
        options: {
            task?: string;
            params?: any;
            context?: any[];
            onChunk?: (content: string) => void;
        } = {}
    ): Promise<string> {
        const { task, params, context, onChunk } = options;

        try {
            const body = {
                input,
                task,
                params,
                context
            };

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep the last incomplete line in buffer

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data:')) continue;

                    const jsonPart = trimmed.slice(5).trim();
                    try {
                        const obj = JSON.parse(jsonPart);

                        // Handle different event types
                        if (!obj.type || obj.type === 'content') {
                            const content = obj.content || '';
                            fullContent += content;
                            if (onChunk) onChunk(content);
                        }
                        // We can handle 'meta', 'file', 'action' here in the future
                    } catch (e) {
                        console.warn('Error parsing SSE JSON:', e);
                    }
                }
            }

            return fullContent;
        } catch (error: any) {
            console.error('Dub5 AI Request Error:', error);
            throw error;
        }
    }

    /**
     * Chat with streaming support
     */
    async chat(messages: AIMessage[], onChunk?: (content: string) => void): Promise<AIResponse> {
        try {
            const lastMessage = messages[messages.length - 1];
            const history = messages.slice(0, -1);

            const content = await this.streamRequest(lastMessage.content, {
                context: history,
                onChunk
            });

            return { content };
        } catch (error: any) {
            return {
                content: '',
                error: error.message || 'Failed to communicate with AI'
            };
        }
    }

    /**
     * Generates a learning set from text context
     */
    async generateLearningSet(context: string): Promise<{ term: string; definition: string }[]> {
        const prompt = `Extract key terms and definitions from the following text. Return ONLY a raw JSON array of objects with "term" and "definition" keys. Do not include markdown formatting or code blocks. Text: ${context.slice(0, 5000)}`;

        try {
            const result = await this.streamRequest(prompt, {
                task: 'extract', // Using 'extract' task as it fits best
                params: { format: 'json' }
            });

            // Clean up the result in case it contains markdown code blocks
            const cleanResult = result.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanResult);
        } catch (error) {
            console.error('Failed to parse learning set:', error);
            throw new Error('Failed to generate learning set');
        }
    }

    /**
     * Generates a study plan JSON
     */
    async generateStudyPlan(goal: string, schedule: string): Promise<any> {
        const now = new Date().toISOString();
        const prompt = `Create a study plan for the goal: "${goal}" with this schedule availability: "${schedule}". 
        Current date is ${now}.
        Return ONLY a raw JSON object with:
        1. "title": string (a catchy title for the plan)
        2. "events": array of objects, each having:
           - "title": string (event title)
           - "start_time": string (ISO 8601 timestamp for the event start)
           - "end_time": string (ISO 8601 timestamp for the event end)
           - "description": string (what to study)
        
        Ensure the dates are valid and in the future relative to ${now}.
        `;

        try {
            const result = await this.streamRequest(prompt, {
                task: 'plan',
                params: { format: 'json' }
            });

            const cleanResult = result.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanResult);
        } catch (error) {
            console.error('Failed to generate study plan:', error);
            throw new Error('Failed to generate study plan');
        }
    }

    /**
     * Generates a practice test JSON
     */
    async generatePracticeTest(context: string, topic: string): Promise<{ title: string; questions: any[] }> {
        const prompt = `Create a practice test about "${topic}" based on the following text: "${context.slice(0, 4000)}". 
        Return ONLY a raw JSON object with:
        1. "title": string
        2. "questions": array of objects, each having:
           - "question_text": string
           - "question_type": "multiple_choice" | "true_false" | "short_answer"
           - "options": array of strings (only for multiple_choice)
           - "correct_answer": string
           - "explanation": string
        `;

        try {
            const result = await this.streamRequest(prompt, {
                task: 'quiz',
                params: { format: 'json' }
            });

            const cleanResult = result.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanResult);
        } catch (error) {
            console.error('Failed to generate practice test:', error);
            throw new Error('Failed to generate practice test');
        }
    }

    /**
     * Generates a PowerPoint presentation JSON
     */
    async generatePresentation(topic: string, context?: string): Promise<{ title: string; slides: any[] }> {
        const contextText = context ? `Context: ${context.slice(0, 3000)}` : '';
        const prompt = `Create a PowerPoint presentation about "${topic}". ${contextText}
        Return ONLY a raw JSON object with:
        1. "title": string (presentation title)
        2. "slides": array of objects, each having:
           - "title": string (slide title)
           - "subtitle": string (optional subtitle)
           - "content": array of strings (bullet points)
           - "image_prompt": string (a descriptive prompt for an AI image generator to visualize this slide's content)
           - "type": "title" | "content" | "section"
        
        Create 5-8 slides with a good flow: title slide, content slides, and a conclusion.
        `;


        try {
            const result = await this.streamRequest(prompt, {
                task: 'presentation',
                params: { format: 'json' }
            });

            const cleanResult = result.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanResult);
        } catch (error) {
            console.error('Failed to generate presentation:', error);
            throw new Error('Failed to generate presentation');
        }
    }

    /**
     * Generates a summary from text
     */
    async generateSummary(context: string, type: 'long' | 'normal' | 'short'): Promise<string> {
        let promptType = '';
        switch (type) {
            case 'long':
                promptType = 'a detailed, comprehensive summary covering all key points and supporting details';
                break;
            case 'short':
                promptType = 'a concise summary in bullet points, focusing only on the most critical facts';
                break;
            default:
                promptType = 'a standard summary that captures the main ideas';
        }

        const prompt = `Create ${promptType} of the following text: "${context.slice(0, 6000)}". Result should be formatted in Markdown.`;

        try {
            const result = await this.streamRequest(prompt, {
                task: 'summary',
                params: { type }
            });
            return result;
        } catch (error) {
            console.error('Failed to generate summary:', error);
            throw new Error('Failed to generate summary');
        }
    }
}


export const dub5ai = new Dub5AIService();
