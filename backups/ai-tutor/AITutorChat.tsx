import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, X } from 'lucide-react';
import { streamDub5AI } from '@/lib/dub5';
import ErrorLogger from '@/lib/ErrorLogger';

export function AITutorChat({ context = '', onClose }: { context?: string; onClose?: () => void }) {
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
    const [input, setInput] = useState('');
    const [streaming, setStreaming] = useState(false);
    const [currentStream, setCurrentStream] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortController = useRef<AbortController | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages, currentStream]);

    const handleSend = async () => {
        if (!input.trim() || streaming) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setStreaming(true);
        setCurrentStream('');

        abortController.current = new AbortController();

        const fullInput = context
            ? `Context: ${context}\n\nQuestion: ${userMessage}`
            : userMessage;

        try {
            await streamDub5AI({
                input: fullInput,
                task: 'chat',
                onChunk: (chunk) => {
                    setCurrentStream(prev => prev + chunk);
                },
                onComplete: (fullText) => {
                    setMessages(prev => [...prev, { role: 'assistant', content: fullText }]);
                    setCurrentStream('');
                    setStreaming(false);
                },
                onError: (error) => {
                    ErrorLogger.error('Streaming error:', error);
                    setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, er ging iets mis. Probeer het opnieuw.' }]);
                    setCurrentStream('');
                    setStreaming(false);
                },
                signal: abortController.current.signal,
            });
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                ErrorLogger.error('Chat error:', error);
            }
        }
    };

    const handleStop = () => {
        abortController.current?.abort();
        if (currentStream) {
            setMessages(prev => [...prev, { role: 'assistant', content: currentStream + ' [gestopt]' }]);
        }
        setCurrentStream('');
        setStreaming(false);
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-lg shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">AI Tutor</h3>
                {onClose && (
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                            }`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}

                {currentStream && (
                    <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-lg p-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white">
                            <p className="text-sm whitespace-pre-wrap">{currentStream}</p>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Stel je vraag..."
                        disabled={streaming}
                        className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
                    />
                    {streaming ? (
                        <button
                            onClick={handleStop}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Stop
                        </button>
                    ) : (
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
