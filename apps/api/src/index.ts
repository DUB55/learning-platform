import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Supabase client with service role
const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DUB5_ENDPOINT = 'https://chatbot-beta-weld.vercel.app/api/chatbot';

// ============================================
// DUB5 AI Integration Helper
// ============================================

async function callDub5AI(input: string, task?: string, params?: any): Promise<string> {
    const body: any = { input };
    if (task) body.task = task;
    if (params) body.params = params;

    const response = await fetch(DUB5_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(`DUB5 AI Error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let result = '';
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
                    result += obj.content;
                }
            } catch (err) {
                console.error('Parse error:', err);
            }
        }
    }

    return result.trim();
}

// ============================================
// SRS SM-2 Algorithm Implementation
// ============================================

interface SRSCalculation {
    easeFactor: number;
    intervalDays: number;
    repetitions: number;
}

function calculateSM2(quality: number, currentEase: number, currentInterval: number, currentReps: number): SRSCalculation {
    let easeFactor = currentEase;
    let intervalDays = currentInterval;
    let repetitions = currentReps;

    if (quality >= 3) {
        // Correct response
        if (repetitions === 0) {
            intervalDays = 1;
        } else if (repetitions === 1) {
            intervalDays = 6;
        } else {
            intervalDays = Math.round(intervalDays * easeFactor);
        }
        repetitions += 1;
    } else {
        // Incorrect response - reset
        repetitions = 0;
        intervalDays = 1;
    }

    // Update ease factor
    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    return { easeFactor, intervalDays, repetitions };
}

// ============================================
// API Routes
// ============================================

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// Leersets Management
// ============================================

// Import leerset from text (admin)
app.post('/api/leersets/import-text', async (req: Request, res: Response) => {
    try {
        const { leersetId, text, userId } = req.body;

        if (!leersetId || !text || !userId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Verify user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (!profile || !['admin', 'teacher'].includes(profile.role)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Parse text: each line is "term definition"
        const lines = text.split('\n').filter((l: string) => l.trim());
        const items = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const separatorIndex = line.indexOf(' ');

            if (separatorIndex === -1) continue;

            const term = line.substring(0, separatorIndex).trim();
            const definition = line.substring(separatorIndex + 1).trim();

            if (term && definition) {
                items.push({
                    leerset_id: leersetId,
                    term,
                    definition,
                    order_index: i,
                });
            }
        }

        if (items.length === 0) {
            return res.status(400).json({ error: 'No valid items found' });
        }

        // Insert items
        const { data, error } = await supabase
            .from('leersetitems')
            .insert(items)
            .select();

        if (error) throw error;

        res.json({ success: true, count: items.length, items: data });
    } catch (error: any) {
        console.error('Import error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// SRS System
// ============================================

// Get due cards for user
app.get('/api/srs/due', async (req: Request, res: Response) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId required' });
        }

        const { data, error } = await supabase
            .from('srscards')
            .select(`
        *,
        leersetitem:leersetitems(*)
      `)
            .eq('user_id', userId)
            .lte('next_review_date', new Date().toISOString())
            .order('next_review_date', { ascending: true })
            .limit(20);

        if (error) throw error;

        res.json({ cards: data || [] });
    } catch (error: any) {
        console.error('Get due cards error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Submit SRS review
app.post('/api/srs/review', async (req: Request, res: Response) => {
    try {
        const { cardId, userId, quality, timeSpent } = req.body;

        if (!cardId || !userId || quality === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get current card state
        const { data: card, error: cardError } = await supabase
            .from('srscards')
            .select('*')
            .eq('id', cardId)
            .eq('user_id', userId)
            .single();

        if (cardError || !card) {
            return res.status(404).json({ error: 'Card not found' });
        }

        // Calculate new SRS values
        const { easeFactor, intervalDays, repetitions } = calculateSM2(
            quality,
            card.ease_factor,
            card.interval_days,
            card.repetitions
        );

        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

        // Update card
        const { error: updateError } = await supabase
            .from('srscards')
            .update({
                ease_factor: easeFactor,
                interval_days: intervalDays,
                repetitions,
                next_review_date: nextReviewDate.toISOString(),
                last_reviewed_at: new Date().toISOString(),
            })
            .eq('id', cardId);

        if (updateError) throw updateError;

        // Record review
        await supabase.from('srsreviews').insert({
            srscard_id: cardId,
            user_id: userId,
            quality,
            time_spent_seconds: timeSpent,
        });

        res.json({
            success: true,
            nextReview: nextReviewDate.toISOString(),
            intervalDays,
        });
    } catch (error: any) {
        console.error('Review submission error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// AI Features (via DUB5)
// ============================================

// Generate summary
app.post('/api/ai/summarize', async (req: Request, res: Response) => {
    try {
        const { text, format = 'paragraph', maxLength = 500 } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const input = `Please create a ${format}-style summary of the following text (max ${maxLength} characters):\n\n${text}`;

        const summary = await callDub5AI(input, 'summarize', { format, max_length: maxLength });

        res.json({ summary });
    } catch (error: any) {
        console.error('Summarize error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Generate flashcards from context
app.post('/api/ai/generate-flashcards', async (req: Request, res: Response) => {
    try {
        const { context, count = 10 } = req.body;

        if (!context) {
            return res.status(400).json({ error: 'Context is required' });
        }

        const input = `Generate ${count} flashcards (term and definition pairs) from this text. Format each as "TERM: definition" on separate lines:\n\n${context}`;

        const result = await callDub5AI(input, 'extract', { format: 'flashcards', count });

        // Parse result into structured flashcards
        const lines = result.split('\n').filter(l => l.trim());
        const flashcards = lines.map((line: string) => {
            const [term, ...defParts] = line.split(':');
            return {
                term: term.replace(/^TERM:\s*/, '').trim(),
                definition: defParts.join(':').trim(),
            };
        }).filter(f => f.term && f.definition);

        res.json({ flashcards });
    } catch (error: any) {
        console.error('Generate flashcards error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Generate study plan
app.post('/api/ai/planner/generate', async (req: Request, res: Response) => {
    try {
        const { subjects, availability, examDates, confidence } = req.body;

        if (!subjects || !availability || !examDates) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const input = `Create a detailed study plan:
Subjects: ${JSON.stringify(subjects)}
Available hours per week: ${availability}
Exam dates: ${JSON.stringify(examDates)}
Current confidence levels: ${JSON.stringify(confidence)}

Format as a weekly schedule with specific tasks and time allocations.`;

        const plan = await callDub5AI(input, 'chat', { context: 'study_planning' });

        res.json({ plan });
    } catch (error: any) {
        console.error('Generate plan error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
    console.log(`🚀 API server running on port ${PORT}`);
    console.log(`📡 DUB5 AI endpoint: ${DUB5_ENDPOINT}`);
});

export default app;
