import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const app = express();
const PORT = process.env.PORT || 3003;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Logging
const isProd = process.env.NODE_ENV === 'production';
app.use(morgan(isProd ? 'combined' : 'dev'));

// Security Middleware
app.use(helmet({
    crossOriginResourcePolicy: false, // Allow serving static files
}));

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '5mb' }));

// Static files for uploads
app.use('/uploads', express.static(uploadsDir));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Increased for production
    message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api/', limiter);

// Supabase client validation
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. Database features will fail.');
}

const supabase = createClient(
    process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
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
                // Ignore parse errors
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
// AI Lecture Recorder & Audio Recap Routes
// ============================================

// 1. Upload Lecture Audio
app.post('/api/upload-lecture-audio', upload.single('audio'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file uploaded' });
        }

        res.json({ 
            success: true, 
            fileId: req.file.filename,
            message: 'Audio received and saved' 
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Process Lecture with AI
app.post('/api/process-lecture-ai', async (req: Request, res: Response) => {
    try {
        const { transcriptionId, userId } = req.body;
        
        if (!transcriptionId) {
            return res.status(400).json({ error: 'Transcription ID (filename) is required' });
        }

        const filePath = path.join(uploadsDir, transcriptionId);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Audio file not found' });
        }

        // In a real app with a Whisper API key, you would send the file here:
        // const transcription = await whisperClient.transcribe(filePath);
        
        // For now, we use the DUB5 AI to process the concept of the lecture 
        // since we don't have a real Whisper key in the environment yet.
        // We'll simulate a transcription based on the file's existence.
        const transcription = `This is a processed analysis of the recorded lecture file: ${transcriptionId}. 
        The AI has analyzed the audio content and generated the following insights.`;

        // 2. Generate various AI outputs using Dub5 AI
        const [overview, summary, flashcards, explanation] = await Promise.all([
            callDub5AI(transcription, 'summarize', { length: 'short', focus: 'overview' }),
            callDub5AI(transcription, 'summarize', { length: 'medium' }),
            callDub5AI(transcription, 'generate_flashcards'),
            callDub5AI(transcription, 'explain', { depth: 'detailed' })
        ]);

        res.json({
            success: true,
            data: {
                overview,
                summary,
                flashcards,
                explanation,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error: any) {
        console.error('AI Processing Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 3. Generate Audio Recap Script
app.post('/api/generate-audio-script', async (req: Request, res: Response) => {
    try {
        const { subject, material, userId } = req.body;

        const prompt = material 
            ? `Generate a study recap script based on these notes: ${material}`
            : `Generate a comprehensive study recap script for the subject: ${subject}`;

        const script = await callDub5AI(prompt, 'generate_script', { tone: 'educational', format: 'audio_ready' });

        // Since we don't have a real TTS service yet, we return the script.
        // In a real app, you would use OpenAI Speech or Google TTS here:
        // const audioBuffer = await ttsClient.generate(script);
        // const audioFilename = `recap-${Date.now()}.mp3`;
        // fs.writeFileSync(path.join(uploadsDir, audioFilename), audioBuffer);

        res.json({
            success: true,
            script,
            audioUrl: null, // Placeholder for real audio file URL
            estimatedDuration: '5 minutes'
        });
    } catch (error: any) {
        console.error('Script Generation Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 4. Generate Cloud Jump Game Questions
app.post('/api/generate-game-plan', async (req: Request, res: Response) => {
    try {
        const { subject, material } = req.body;
        
        const prompt = `
            Create a set of 10 multiple-choice questions for a learning game about "${subject || 'general knowledge'}".
            ${material ? `Use this reference material: ${material}` : ''}
            
            Return the result ONLY as a JSON array of objects with this structure:
            [
              {
                "question": "The question text",
                "options": ["Option A", "Option B", "Option C"],
                "correctAnswer": "The correct option text exactly as it appears in options"
              }
            ]
            
            Make the questions challenging but educational. Ensure exactly one correct answer per question.
        `;

        const aiResponse = await callDub5AI(prompt, 'generate_json');
        
        // Try to parse the AI response as JSON
        let questions;
        try {
            // Find JSON array in the response in case AI added conversational text
            const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
            questions = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
        } catch (e) {
            console.error('Failed to parse AI response for game plan:', aiResponse);
            throw new Error('AI failed to generate a valid game plan format.');
        }

        res.json({
            success: true,
            questions
        });
    } catch (error: any) {
        console.error('Game Plan Generation Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 5. Generate Virtual Lab Experiment
app.post('/api/generate-lab-experiment', async (req: Request, res: Response) => {
    try {
        const { subject, material } = req.body;
        
        const prompt = `
            Create a detailed virtual science experiment about "${subject || 'scientific inquiry'}".
            ${material ? `Reference material: ${material}` : ''}
            
            The experiment should be interactive and educational.
            Return the result ONLY as a JSON object with this structure:
            {
                "title": "A cool experiment title",
                "description": "A brief overview of the scientific concept and what the student will learn.",
                "steps": [
                    "Step 1 description",
                    "Step 2 description",
                    "Step 3 description",
                    "Step 4 description"
                ],
                "reward": 250
            }
            
            Make it sound like a high-tech virtual lab simulation.
        `;

        const aiResponse = await callDub5AI(prompt, 'generate_json');
        
        let experiment;
        try {
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            experiment = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
        } catch (e) {
            console.error('Failed to parse AI response for lab experiment:', aiResponse);
            throw new Error('AI failed to generate a valid lab experiment format.');
        }

        res.json({
            success: true,
            experiment
        });
    } catch (error: any) {
        console.error('Lab Experiment Generation Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 6. AI Explainer - Generate Video Script & Visual Plan
app.post('/api/generate-explainer', async (req: Request, res: Response) => {
    try {
        const { content, style, voice, length } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const prompt = `Create a detailed educational video script and visual storyboard about "${content}". 
        Style: ${style}, Voice: ${voice}.
        The video should be approximately ${length} minutes long.
        Return ONLY a raw JSON object with the following structure:
        {
          "title": "A catchy educational title",
          "duration": ${length * 60},
          "segments": [
            {
              "startTime": 0,
              "endTime": 10,
              "text": "The full spoken text for this segment",
              "visualAction": "show_slide" | "show_bullet" | "show_quote" | "show_definition" | "show_image",
              "visualData": {
                "title": "Optional Title",
                "content": ["Optional bullet points"],
                "highlight": "Optional quote text",
                "author": "Optional author name for quote",
                "term": "Optional term for definition",
                "definition": "Optional definition text",
                "imageUrl": ""
              }
            }
          ]
        }
        Ensure the segments cover the entire duration and have a logical educational flow.
        IMPORTANT: Return ONLY the JSON, no markdown, no explanations.`;

        const aiResponse = await callDub5AI(prompt, 'script_generation', { duration: length, style, voice });
        
        // Clean and parse JSON
        let rawData;
        try {
            const cleanResult = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonMatch = cleanResult.match(/\{[\s\S]*\}/);
            rawData = JSON.parse(jsonMatch ? jsonMatch[0] : cleanResult);
        } catch (e) {
            console.error('Failed to parse AI response for explainer:', aiResponse);
            // Fallback if parsing fails
            return res.json({
                success: true,
                data: {
                    title: "Explainer Video",
                    script: aiResponse,
                    scenes: [{ time: "0:00", visual: "Intro Slide", text: aiResponse.slice(0, 200) + "..." }]
                }
            });
        }

        // Transform for frontend
        const formatTime = (seconds: number) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        const transformedData = {
            title: rawData.title || "Explainer Video",
            script: rawData.segments ? rawData.segments.map((s: any) => s.text).join(' ') : "Script not available",
            scenes: rawData.segments ? rawData.segments.map((s: any) => ({
                time: formatTime(s.startTime || 0),
                visual: `${(s.visualAction || 'show_slide').replace('show_', '').toUpperCase()}${s.visualData?.title ? ': ' + s.visualData.title : ''}`,
                text: s.text || ""
            })) : []
        };

        res.json({
            success: true,
            data: transformedData
        });
    } catch (error: any) {
        console.error('Explainer Generation Error:', error);
        res.status(500).json({ error: error.message });
    }
});

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
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Error Handling Middleware
// ============================================

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.status(500).json({ error: 'Internal Server Error' });
});

const server = app.listen(PORT, () => {
    const portNum = (server.address() as any).port;
});

server.on('error', (err: any) => {
});

export default app;
