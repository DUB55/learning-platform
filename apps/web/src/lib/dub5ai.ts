import { supabase } from './supabase';

export interface AIMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

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
    async generateStudyPlan(context: string): Promise<any> {
        const prompt = `Create a study plan based on this request: "${context}". Return ONLY a raw JSON object with a "title" and an "events" array (each having title, start (ISO string), duration (minutes)).`;

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
}

export const dub5ai = new Dub5AIService();
