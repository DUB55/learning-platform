import { z } from 'zod';

export const learningSetSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    pairs: z.array(z.object({
        term: z.string().min(1, 'Term is required'),
        definition: z.string().min(1, 'Definition is required')
    })).min(1, 'At least one pair is required')
});

export const documentSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
    content: z.string().optional(),
    type: z.enum(['text', 'code', 'image', 'video', 'file', 'link', 'html', 'rich_text']),
    elements: z.array(z.any()).optional()
});

export const subjectSchema = z.object({
    title: z.string().min(1, 'Title is required').max(50, 'Title must be less than 50 characters'),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').or(z.enum(['blue', 'green', 'purple', 'orange', 'pink', 'red', 'yellow', 'cyan'])),
    is_public: z.boolean().optional()
});

export const unitSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
    order_index: z.number().int().min(0)
});

export const paragraphSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
    order_index: z.number().int().min(0)
});
