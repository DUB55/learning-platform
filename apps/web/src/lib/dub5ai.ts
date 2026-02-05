// removed unused supabase import

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
            params?: Record<string, unknown>;
            context?: AIMessage[];
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
                    } catch (_e) {
                        // Silently handle parse errors
                    }
                }
            }

            return fullContent;
        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            throw err;
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
        } catch (error: unknown) {
            return {
                content: '',
                error: error instanceof Error ? error.message : 'Failed to communicate with AI'
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
        } catch (_error) {
            throw new Error('Failed to generate learning set');
        }
    }

    /**
     * Generates a study plan JSON
     */
    async generateStudyPlan(goal: string, schedule: string): Promise<{ title: string; events: Array<{ title: string; start_time: string; end_time: string; description: string }> }> {
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
            return JSON.parse(cleanResult) as { title: string; events: Array<{ title: string; start_time: string; end_time: string; description: string }> };
        } catch (_error) {
            throw new Error('Failed to generate study plan');
        }
    }

    /**
     * Generates a practice test JSON
     */
    async generatePracticeTest(context: string, topic: string): Promise<{ title: string; questions: Array<{ question_text: string; question_type: 'multiple_choice' | 'true_false' | 'short_answer'; options?: string[]; correct_answer: string; explanation: string }> }> {
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
            return JSON.parse(cleanResult) as { title: string; questions: Array<{ question_text: string; question_type: 'multiple_choice' | 'true_false' | 'short_answer'; options?: string[]; correct_answer: string; explanation: string }> };
        } catch (_error) {
            throw new Error('Failed to generate practice test');
        }
    }

    /**
     * Generates a PowerPoint presentation JSON
     */
    async generatePresentation(topic: string, context?: string): Promise<{ title: string; slides: Array<{ title: string; subtitle?: string; content: string[]; image_prompt?: string; type: 'title' | 'content' | 'section' }> }> {
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
            return JSON.parse(cleanResult) as { title: string; slides: Array<{ title: string; subtitle?: string; content: string[]; image_prompt?: string; type: 'title' | 'content' | 'section' }> };
        } catch (_error) {
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
        } catch (_error) {
            throw new Error('Failed to generate summary');
        }
    }

    /**
     * Generates an Explainer Video Script
     */
    async generateExplainerScript(topic: string, durationMinutes: number, material?: string): Promise<any> {
        const materialContext = material ? `Based on this reference material: "${material.slice(0, 4000)}"` : '';
        const prompt = `Create a detailed educational video script about "${topic}". ${materialContext}
        The video should be approximately ${durationMinutes} minutes long.
        Return ONLY a raw JSON object with the following structure:
        {
          "title": "string",
          "duration": number (total seconds),
          "segments": [
            {
              "startTime": number (seconds),
              "endTime": number (seconds),
              "text": "The full spoken text for this segment",
              "visualAction": "show_slide" | "show_bullet" | "show_quote" | "show_definition" | "show_image",
              "visualData": {
                "title": "Optional Title",
                "content": ["Optional bullet points"],
                "highlight": "Optional quote text",
                "author": "Optional author name for quote",
                "term": "Optional term for definition",
                "definition": "Optional definition text",
                "imageUrl": "Optional image URL (leave empty for placeholder)"
              }
            }
          ]
        }
        Ensure the segments cover the entire duration and have a logical educational flow.
        IMPORTANT: Return ONLY the JSON, no markdown, no explanations.`;

        try {
            const result = await this.streamRequest(prompt, {
                task: 'script_generation',
                params: { duration: durationMinutes, hasMaterial: !!material }
            });

            const cleanResult = result.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanResult);
        } catch (error) {
            throw new Error('Failed to generate explainer script');
        }
    }

    /**
     * Generates a 3D Scene Orchestration Script for Imagine Explainers Optie B
     */
    async generate3DSceneScript(topic: string, durationMinutes: number, material?: string): Promise<any> {
        const materialContext = material ? `Based on this reference material: "${material.slice(0, 4000)}"` : '';
        const prompt = `Create a 3D educational scene orchestration script about "${topic}". ${materialContext}
        The experience should be approximately ${durationMinutes} minutes long.
        
        Return ONLY a raw JSON object with the following structure:
        {
          "title": "string",
          "settings": {
            "environment": "empty" | "city" | "forest" | "jungle" | "mountains" | "ocean",
            "weather": "none" | "rain" | "snow" | "sun" | "storm",
            "timeOfDay": number (0-24),
            "groundType": "grass" | "snow" | "sand" | "concrete" | "dirt" | "water"
          },
          "initialObjects": [
            {
              "type": "model" | "character" | "car" | "house" | "tree" | "building" | "fence" | "rock" | "crate" | "lamp" | "flower" | "bush" | "mushroom" | "skyscraper" | "bridge" | "fountain" | "bench" | "barrel" | "chest",
              "position": [x, y, z],
              "rotation": [x, y, z],
              "scale": [x, y, z],
              "color": "string (hex)"
            }
          ],
          "timeline": [
            {
              "startTime": number (seconds),
              "endTime": number (seconds),
              "narration": "The spoken explanation text",
              "cameraAction": {
                "type": "move" | "lookAt" | "orbit" | "follow",
                "position": [x, y, z],
                "target": [x, y, z] | "string (object id)"
              },
              "visualEvents": [
                {
                  "type": "spawn" | "animate" | "highlight" | "destroy" | "speech_bubble",
                  "objectId": "string",
                  "params": {
                    "animation": "idle" | "walk" | "run" | "jump" | "wave",
                    "color": "string",
                    "text": "string (for speech bubble)"
                  }
                }
              ]
            }
          ]
        }
        
        Ensure the script creates a rich, educational 3D environment that evolves with the narration.
        IMPORTANT: Return ONLY the JSON, no markdown, no explanations.`;

        try {
            const result = await this.streamRequest(prompt, {
                task: 'scene_orchestration',
                params: { duration: durationMinutes, hasMaterial: !!material }
            });

            const cleanResult = result.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanResult);
        } catch (error) {
            throw new Error('Failed to generate 3D scene script');
        }
    }

    /**
     * Executes a magic command for the Game Maker (e.g., "place a car", "make it rain")
     */
    async executeMagicCommand(command: string): Promise<any> {
        const prompt = `You are a 3D Game Maker Assistant. Execute the following command: "${command}".
        Return ONLY a raw JSON object with one or more of these properties:
        1. "spawn": array of objects to add, each having:
           - "type": "model" | "character" | "car" | "house" | "tree" | "building" | "fence" | "rock" | "crate" | "lamp" | "flower" | "bush" | "mushroom" | "skyscraper" | "bridge" | "fountain" | "bench" | "barrel" | "chest"
           - "position": [x, y, z] (keep them near [0, 0, 0] if not specified, spaced out if multiple)
           - "rotation": [x, y, z]
           - "scale": [x, y, z]
           - "color": "string (hex)"
        2. "settings": object with world updates:
           - "environment": "empty" | "city" | "forest" | "jungle" | "mountains" | "ocean"
           - "weather": "none" | "rain" | "snow" | "sun" | "storm"
           - "timeOfDay": number (0-24)
           - "groundType": "grass" | "snow" | "sand" | "concrete" | "dirt" | "water"
        3. "message": string (confirmation message to the user)
        
        Example: "place 3 trees and make it night" -> { "spawn": [...3 trees...], "settings": { "timeOfDay": 22 }, "message": "Created 3 trees and set the time to night." }
        
        IMPORTANT: Return ONLY the JSON, no markdown.`;

        try {
            const result = await this.streamRequest(prompt, {
                task: 'magic_command',
                params: { format: 'json' }
            });

            const cleanResult = result.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanResult);
        } catch (error) {
            throw new Error('Failed to execute magic command');
        }
    }
    /**
     * Synthesizes information from multiple text documents
     */
    async synthesizeDocuments(documents: Array<{ title: string, content: string }>): Promise<string> {
        const context = documents.map(doc => `Document: ${doc.title}\nContent: ${doc.content}`).join('\n\n');
        const prompt = `Synthesize the following documents into a single, cohesive educational summary. Identify common themes, conflicting information, and key takeaways across all sources. 
        Documents:
        ${context.slice(0, 10000)}
        
        Format the response in Markdown with clear sections.`;

        try {
            const result = await this.streamRequest(prompt, {
                task: 'synthesis',
                params: { docCount: documents.length }
            });
            return result;
        } catch (_error) {
            throw new Error('Failed to synthesize documents');
        }
    }

    /**
     * Generates active recall cues from content
     */
    async generateActiveRecallCues(content: string): Promise<Array<{ question: string, hint: string }>> {
        const prompt = `Based on the following content, generate 5 challenging active recall questions that test deep understanding rather than simple memorization. Provide a subtle hint for each.
        Content: ${content.slice(0, 5000)}
        
        Return ONLY a raw JSON array of objects with "question" and "hint" keys.`;

        try {
            const result = await this.streamRequest(prompt, {
                task: 'recall',
                params: { format: 'json' }
            });

            const cleanResult = result.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanResult);
        } catch (_error) {
            throw new Error('Failed to generate active recall cues');
        }
    }
}

export const dub5ai = new Dub5AIService();
