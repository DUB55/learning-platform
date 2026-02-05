import ErrorLogger from './ErrorLogger';

export interface DUB5StreamOptions {
    input: string;
    task?: string;
    params?: Record<string, unknown>;
    onChunk?: (text: string) => void;
    onComplete?: (fullText: string) => void;
    onError?: (error: Error) => void;
    signal?: AbortSignal;
}

export async function streamDub5AI(options: DUB5StreamOptions): Promise<string> {
    const { input, task, params, onChunk, onComplete, onError, signal } = options;

    const body: { input: string; task?: string; params?: Record<string, unknown> } = { input };
    if (task) body.task = task;
    if (params) body.params = params;

    try {
        const response = await fetch('https://chatbot-beta-weld.vercel.app/api/chatbot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal,
        });

        if (!response.ok) {
            throw new Error(`DUB5 Error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data:')) continue;

                try {
                    const jsonStr = trimmed.slice(5).trim();
                    const obj = JSON.parse(jsonStr);

                    if (obj.content) {
                        fullText += obj.content;
                        onChunk?.(obj.content);
                    }
                } catch (err) {
                    ErrorLogger.error('Parse error:', err);
                }
            }
        }

        onComplete?.(fullText);
        return fullText;
    } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err);
        throw err;
    }
}

// Non-streaming call for simple tasks
export async function callDub5AI(input: string, task?: string, params?: Record<string, unknown>): Promise<string> {
    let result = '';
    await streamDub5AI({
        input,
        task,
        params,
        onChunk: (chunk) => { result += chunk; },
    });
    return result;
}
