'use server';

import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';
import ErrorLogger from '@/lib/ErrorLogger';

interface ImportResult {
    success: boolean;
    message: string;
    stats?: {
        subjects: number;
        units: number;
        paragraphs: number;
        documents: number;
        tests: number;
        questions: number;
    };
}

/**
 * Robust import logic for StudyGo exported data.
 * Uses explicit paths from export_manifest.json for maximum reliability.
 */
export async function importStudyGoData(exportDirPath: string, userId: string): Promise<ImportResult> {
    const stats = {
        subjects: 0,
        units: 0,
        paragraphs: 0,
        documents: 0,
        tests: 0,
        questions: 0
    };

    try {
        const manifestPath = path.join(exportDirPath, 'export_manifest.json');
        if (!fs.existsSync(manifestPath)) {
            throw new Error(`Manifest not found at ${manifestPath}`);
        }

        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const subjects = manifest.subjects || [];

        for (const sub of subjects) {
            // 1. Subject
            const { data: subject, error: subError } = await supabase.from('subjects')
                .upsert({
                    title: sub.name,
                    user_id: userId,
                    color: 'blue'
                }, { onConflict: 'title,user_id' })
                .select()
                .single();

            if (subError) {
                ErrorLogger.error(`Error upserting subject ${sub.name}:`, subError);
                continue;
            }
            stats.subjects++;

            // 2. Books -> Units
            const books = sub.books || [];
            for (let i = 0; i < books.length; i++) {
                const book = books[i];
                const { data: unit, error: unitError } = await supabase.from('units')
                    .upsert({
                        subject_id: subject.id,
                        title: book.title,
                        order_index: i
                    }, { onConflict: 'subject_id,title' })
                    .select()
                    .single();

                if (unitError) {
                    ErrorLogger.error(`Error upserting unit ${book.title}:`, unitError);
                    continue;
                }
                stats.units++;

                // 3. Chapters -> Paragraphs
                const chapters = book.chapters || [];
                for (let j = 0; j < chapters.length; j++) {
                    const chap = chapters[j];
                    const { data: para, error: paraError } = await supabase.from('paragraphs')
                        .upsert({
                            unit_id: unit.id,
                            title: chap.title,
                            order_index: j
                        }, { onConflict: 'unit_id,title' })
                        .select()
                        .single();

                    if (paraError) {
                        ErrorLogger.error(`Error upserting paragraph ${chap.title}:`, paraError);
                        continue;
                    }
                    stats.paragraphs++;

                    // 4. Sections -> Documents & Practice Tests
                    await importSections(exportDirPath, userId, subject.id, para.id, chap.sections || [], stats);
                }
            }

            // 2b. Direct Chapters -> Units (Fallback for Book-less hierarchy)
            // Some StudyGo exports might have chapters directly under subject
            const directChapters = sub.chapters || [];
            if (directChapters.length > 0) {
                // We map these direct chapters to Units to preserve hierarchy depth
                // Then we create a single "Content" paragraph or map sections directly?
                // App requires Unit -> Paragraph -> Document.
                // So: Direct Chapter -> Unit.
                // We need a Paragraph. We'll create a default one or use the Chapter title again.
                
                for (let i = 0; i < directChapters.length; i++) {
                    const chap = directChapters[i];
                    const { data: unit, error: unitError } = await supabase.from('units')
                        .upsert({
                            subject_id: subject.id,
                            title: chap.title,
                            order_index: books.length + i // Append after books
                        }, { onConflict: 'subject_id,title' })
                        .select()
                        .single();

                    if (unitError) {
                        ErrorLogger.error(`Error upserting direct unit ${chap.title}:`, unitError);
                        continue;
                    }
                    stats.units++;

                    // Create a default paragraph to hold the sections
                    const { data: para, error: paraError } = await supabase.from('paragraphs')
                        .upsert({
                            unit_id: unit.id,
                            title: 'Sections', // Generic title for the container
                            order_index: 0
                        }, { onConflict: 'unit_id,title' })
                        .select()
                        .single();

                    if (paraError) {
                        ErrorLogger.error(`Error upserting paragraph for direct unit ${chap.title}:`, paraError);
                        continue;
                    }
                    stats.paragraphs++;

                    // Import sections
                    await importSections(exportDirPath, userId, subject.id, para.id, chap.sections || [], stats);
                }
            }
        }

        return {
            success: true,
            message: `Import completed: ${stats.subjects} subjects, ${stats.units} units, ${stats.paragraphs} paragraphs, ${stats.documents} documents, ${stats.tests} tests, ${stats.questions} questions.`,
            stats
        };

    } catch (e: any) {
        ErrorLogger.error('Import Failed:', e);
        return { success: false, message: e.message };
    }
}

async function importSections(
    exportDirPath: string, 
    userId: string, 
    subjectId: string, 
    paragraphId: string, 
    sections: any[], 
    stats: any
) {
    for (let k = 0; k < sections.length; k++) {
        const sec = sections[k];

        // Resolve content
        const content: any = {
            import_metadata: {
                source: 'StudyGo',
                path: sec.path,
                imported_at: new Date().toISOString()
            }
        };

        let terms: any[] = [];
        // Try to load terms if they exist
        if (sec.content?.terms?.json) {
            const termsPath = path.join(exportDirPath, sec.content.terms.json);
            if (fs.existsSync(termsPath)) {
                terms = JSON.parse(fs.readFileSync(termsPath, 'utf8'));
                content.terms = terms;
            }
        }

        // Try to load summary if it exists
        if (sec.content?.summary?.html) {
            const summaryPath = path.join(exportDirPath, sec.content.summary.html);
            if (fs.existsSync(summaryPath)) {
                content.summary_html = fs.readFileSync(summaryPath, 'utf8');
            }
        }

        // Document creation
        const { error: docError } = await supabase.from('documents')
            .upsert({
                paragraph_id: paragraphId,
                title: sec.title,
                content: content,
                document_type: content.summary_html ? 'html' : 'rich_text',
                order_index: k
            }, { onConflict: 'paragraph_id,title' });

        if (!docError) stats.documents++;

        // Practice Test creation if terms exist
        if (terms.length > 0) {
            const { data: test, error: testError } = await supabase.from('practice_tests')
                .upsert({
                    user_id: userId,
                    subject_id: subjectId,
                    title: `${sec.title} Practice`,
                    description: `Imported from StudyGo: ${sec.title}`
                }, { onConflict: 'user_id,subject_id,title' })
                .select()
                .single();

            if (!testError && test) {
                stats.tests++;
                // Questions
                const questions = terms.map((t, idx) => ({
                    test_id: test.id,
                    question_text: t.term,
                    question_type: 'short_answer',
                    correct_answer: t.definition,
                    order_index: idx
                }));

                // Batch insert questions (upsert is harder for rows without unique names)
                // For simplicity, we delete existing if it exists or just insert
                // But idempotency is better: we just insert and ignore conflicts or delete first.
                await supabase.from('practice_test_questions').delete().eq('test_id', test.id);
                const { error: qsError } = await supabase.from('practice_test_questions').insert(questions);
                if (!qsError) stats.questions += questions.length;
            }
        }
    }
}
