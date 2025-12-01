'use client';

import { supabase } from './supabase';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    created_at: string;
}

/**
 * Generate a summary of chat history for context in continued conversations
 * This helps maintain context while reducing token usage
 */
export async function generateChatSummary(messages: ChatMessage[]): Promise<string> {
    if (messages.length <= 10) {
        // Not enough messages to warrant summarization
        return '';
    }

    // Take first 5 and last 5 messages for summary
    const firstMessages = messages.slice(0, 5);
    const lastMessages = messages.slice(-5);
    const middleCount = messages.length - 10;

    const conversationContext = [
        ...firstMessages.map(m => `${m.role}: ${m.content}`),
        middleCount > 0 ? `[... ${middleCount} messages omitted ...]` : '',
        ...lastMessages.map(m => `${m.role}: ${m.content}`)
    ].filter(Boolean).join('\n\n');

    // Create a concise summary prompt
    const summary = `Previous conversation summary:\n${conversationContext}\n\nKey points discussed: ${extractKeyPoints(messages)}`;

    return summary;
}

/**
 * Extract key topics and points from messages
 */
function extractKeyPoints(messages: ChatMessage[]): string {
    // Simple heuristic: collect important keywords and topics
    const userMessages = messages.filter(m => m.role === 'user');
    const topics = userMessages
        .map(m => m.content)
        .join(' ')
        .split(/\s+/)
        .filter(word => word.length > 5) // Filter meaningful words
        .slice(0, 15) // Take top 15 words
        .join(', ');

    return topics || 'General discussion';
}

/**
 * Save chat summary to database
 */
export async function saveChatSummary(chatId: string, summary: string): Promise<void> {
    try {
        await supabase
            .from('ai_chat_sessions')
            .update({ chat_summary: summary })
            .eq('id', chatId);
    } catch (error) {
        console.error('Error saving chat summary:', error);
    }
}

/**
 * Get chat summary from database
 */
export async function getChatSummary(chatId: string): Promise<string | null> {
    try {
        const { data } = await supabase
            .from('ai_chat_sessions')
            .select('chat_summary')
            .eq('id', chatId)
            .single();

        return data?.chat_summary || null;
    } catch (error) {
        console.error('Error fetching chat summary:', error);
        return null;
    }
}

/**
 * Prepare context for AI with summary injection
 * This function is called before sending a new message in an existing chat
 */
export async function prepareContextWithSummary(
    chatId: string,
    messages: ChatMessage[]
): Promise<ChatMessage[]> {
    // If chat has many messages, generate and inject summary
    if (messages.length > 10) {
        const summary = await generateChatSummary(messages);

        // Save summary to database for future use
        await saveChatSummary(chatId, summary);

        // Create a system message with the summary (invisible to user)
        const summaryMessage: ChatMessage = {
            id: 'summary-' + Date.now(),
            role: 'system',
            content: summary,
            created_at: new Date().toISOString()
        };

        // Return recent messages + summary
        return [summaryMessage, ...messages.slice(-10)];
    }

    // Return all messages if less than threshold
    return messages;
}
