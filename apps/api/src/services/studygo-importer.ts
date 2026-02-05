import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { SupabaseClient } from '@supabase/supabase-js';

type Database = any;

export interface ImportOptions {
    dryRun: boolean;
    commit: boolean;
    assetDir: string;
}

export interface ImportReport {
    timestamp: string;
    success: boolean;
    counts: {
        subjects: number;
        books: number;
        chapters: number;
        sections: number;
        sets: number;
        flashcards: number;
        docs: number;
        questions: number;
        quizzes: number;
        assets: number;
    };
    coverage: {
        total_items_in_manifest: number;
        items_processed: number;
        unsupported_items: any[];
    };
    errors: string[];
    warnings: string[];
}

export class StudyGoImporter {
    private supabase: SupabaseClient<Database>;
    private exportPath: string;
    private options: ImportOptions;
    private manifest: any;
    private report: ImportReport;
    private logStream: fs.WriteStream;
    private processedIds: Set<string> = new Set();
    private manifestItemCount: number = 0;

    constructor(supabase: SupabaseClient<Database>, exportPath: string, options: ImportOptions) {
        this.supabase = supabase;
        this.exportPath = exportPath;
        this.options = options;
        this.report = {
            timestamp: new Date().toISOString(),
            success: false,
            counts: {
                subjects: 0, books: 0, chapters: 0, sections: 0,
                sets: 0, flashcards: 0, docs: 0,
                questions: 0, quizzes: 0, assets: 0
            },
            coverage: {
                total_items_in_manifest: 0,
                items_processed: 0,
                unsupported_items: []
            },
            errors: [],
            warnings: []
        };
        const logFile = path.join(process.cwd(), 'import_log.jsonl');
        this.logStream = fs.createWriteStream(logFile, { flags: 'a' });
    }

    private log(node: string, status: 'started' | 'completed' | 'error' | 'warn' | 'info', message: string, meta?: any) {
        const entry = JSON.stringify({
            timestamp: new Date().toISOString(),
            node,
            status,
            message,
            ...meta
        });
        this.logStream.write(entry + '\n');

        if (status === 'error') {
            const err = `[${node}] ${message}`;
            if (!this.report.errors.includes(err)) this.report.errors.push(err);
        }
        if (status === 'warn') {
            const warn = `[${node}] ${message}`;
            if (!this.report.warnings.includes(warn)) this.report.warnings.push(warn);
        }
    }

    private async validatePath(node: string, relativePath: string): Promise<boolean> {
        if (!relativePath) return true;
        const fullPath = path.resolve(this.exportPath, relativePath);
        if (!await fs.pathExists(fullPath)) {
            this.log(node, 'error', `File missing: ${fullPath}`, { relativePath });
            return false;
        }
        return true;
    }

    private markProcessed(id: string) {
        if (this.processedIds.has(id)) return;
        this.processedIds.add(id);
        this.report.coverage.items_processed++;
    }

    async run(): Promise<ImportReport> {
        try {
            this.log('root', 'info', 'Starting StudyGo import', { path: this.exportPath, dryRun: this.options.dryRun });

            const manifestPath = path.join(this.exportPath, 'export_manifest.json');
            if (!await fs.pathExists(manifestPath)) {
                throw new Error(`Manifest not found at ${manifestPath}`);
            }
            this.manifest = await fs.readJson(manifestPath);

            // Calculate manifest coverage (recursive count of items)
            this.manifestItemCount = 0;
            this.countManifestItems(this.manifest);
            this.report.coverage.total_items_in_manifest = this.manifestItemCount;

            // Process Subjects
            if (this.manifest.subjects) {
                for (const subjectData of this.manifest.subjects) {
                    await this.processSubject(subjectData);
                }
            }

            // Final coverage check
            if (this.report.coverage.items_processed < this.report.coverage.total_items_in_manifest) {
                this.log('root', 'warn', `Coverage gap: processed ${this.report.coverage.items_processed}/${this.report.coverage.total_items_in_manifest} items.`);
            }

            this.report.success = this.report.errors.length === 0;
            this.log('root', 'info', `Import process finished. Processed ${this.report.coverage.items_processed}/${this.report.coverage.total_items_in_manifest} items.`);
        } catch (error: any) {
            this.log('root', 'error', `Fatal error: ${error.message}`, { stack: error.stack });
            this.report.success = false;
        } finally {
            this.logStream.end();
            return this.report;
        }
    }

    private countManifestItems(node: any, key?: string) {
        if (!node) return;
        if (Array.isArray(node)) {
            // Count 'terms' array as a set
            if (key === 'terms') {
                this.manifestItemCount++;
            }
            node.forEach(i => this.countManifestItems(i));
        } else if (typeof node === 'object') {
            const hasId = node.subjectId || node.bookId || node.chapterIdOrIdx ||
                node.sectionIdOrIdx || node.id || node.theoryHash;
            const isSummary = key === 'summary';

            if (hasId || isSummary) {
                this.manifestItemCount++;
            }

            Object.entries(node).forEach(([k, v]) => {
                if (typeof v === 'object' && v !== null) {
                    this.countManifestItems(v, k);
                }
            });
        }
    }

    private async processSubject(data: any) {
        const sourceId = `studygo:subject:${data.subjectId}`;
        this.log(sourceId, 'started', `Subject: ${data.title}`);

        let id: string = 'dry-run';
        if (!this.options.dryRun) {
            const { data: record, error } = await this.supabase
                .from('subjects')
                .upsert({
                    title: data.title,
                    source_id: sourceId,
                    user_id: '00000000-0000-0000-0000-000000000000'
                }, { onConflict: 'source_id' })
                .select()
                .single();

            if (error) {
                this.log(sourceId, 'error', error.message);
                return;
            }
            id = record.id;
        }

        this.report.counts.subjects++;
        this.markProcessed(sourceId);

        if (data.books) {
            for (const book of data.books) {
                await this.processBook(id, book);
            }
        }

        this.log(sourceId, 'completed', 'Success');
    }

    private async processBook(subjectId: string, data: any) {
        const sourceId = `studygo:book:${data.bookId}`;
        this.log(sourceId, 'started', `Book: ${data.title}`);

        let id: string = 'dry-run';
        if (!this.options.dryRun) {
            const { data: record, error } = await this.supabase
                .from('books')
                .upsert({
                    subject_id: subjectId,
                    title: data.title,
                    author: data.author,
                    publisher: data.publisher,
                    source_id: sourceId
                }, { onConflict: 'source_id' })
                .select()
                .single();

            if (error) {
                this.log(sourceId, 'error', error.message);
                return;
            }
            id = record.id;
        }

        this.report.counts.books++;
        this.markProcessed(sourceId);

        if (data.chapters) {
            for (const chapter of data.chapters) {
                await this.processChapter(subjectId, id, chapter);
            }
        }
        this.log(sourceId, 'completed', 'Success');
    }

    private async processChapter(subjectId: string, bookId: string, data: any) {
        const chapterKey = data.path || data.chapterIdOrIdx;
        const sourceId = `studygo:chapter:${chapterKey}`;
        this.log(sourceId, 'started', `Chapter: ${data.title}`);

        let id: string = 'dry-run';
        if (!this.options.dryRun) {
            const { data: record, error } = await this.supabase
                .from('chapters')
                .upsert({
                    subject_id: subjectId,
                    book_id: bookId,
                    title: data.title,
                    source_id: sourceId
                }, { onConflict: 'source_id' })
                .select()
                .single();

            if (error) {
                this.log(sourceId, 'error', error.message);
                return;
            }
            id = record.id;
        }

        this.report.counts.chapters++;
        this.markProcessed(sourceId);

        if (data.sections) {
            for (const section of data.sections) {
                await this.processSection(id, section);
            }
        }
        this.log(sourceId, 'completed', 'Success');
    }

    private async processSection(chapterId: string, data: any) {
        const sectionKey = data.path || data.sectionIdOrIdx;
        const sourceId = `studygo:section:${sectionKey}`;
        this.log(sourceId, 'started', `Section: ${data.title}`);

        let id: string = 'dry-run';
        if (!this.options.dryRun) {
            const { data: record, error } = await this.supabase
                .from('paragraphs')
                .upsert({
                    chapter_id: chapterId,
                    title: data.title,
                    source_id: sourceId
                }, { onConflict: 'source_id' })
                .select()
                .single();

            if (error) {
                this.log(sourceId, 'error', error.message);
                return;
            }
            id = record.id;
        }

        this.report.counts.sections++;
        this.markProcessed(sourceId);

        if (data.content) {
            const c = data.content;
            if (c.terms) await this.processTerms(id, c.terms);
            if (c.summary) await this.processDocument(id, 'Summary', c.summary);
            if (c.theory) {
                for (const t of c.theory) await this.processDocument(id, t.title || 'Theory', t);
            }
            if (c.questions) await this.processQuestions(id, c.questions);
            if (c.exams) {
                for (const e of c.exams) await this.processExam(id, e);
            }
        }
        this.log(sourceId, 'completed', 'Success');
    }

    private async processTerms(sectionId: string, terms: any[]) {
        const sourceId = `studygo:leerset:terms_${sectionId}`;
        this.log(sourceId, 'started', `Terms: ${terms.length} items`);

        if (!this.options.dryRun) {
            const { data: leerset, error } = await this.supabase
                .from('leersets')
                .upsert({
                    title: 'Vocabulary',
                    source_id: sourceId,
                    paragraph_id: sectionId
                }, { onConflict: 'source_id' })
                .select()
                .single();

            if (error) {
                this.log(sourceId, 'error', error.message);
                return;
            }

            const items = terms.map((t, idx) => ({
                leerset_id: leerset.id,
                term: t.term || t.question,
                definition: t.definition || t.answer,
                source_id: `studygo:flashcard:${t.id || `${leerset.id}_${idx}`}`
            }));

            const { error: itemError } = await this.supabase.from('leerset_items').upsert(items, { onConflict: 'source_id' });
            if (itemError) {
                this.log(sourceId, 'error', `Items: ${itemError.message}`);
                return;
            }
        }

        this.report.counts.sets++;
        this.report.counts.flashcards += terms.length;
        this.markProcessed(sourceId);
        this.log(sourceId, 'completed', 'Success');
    }

    private async processDocument(sectionId: string, title: string, data: any) {
        const docKey = data.id || data.theoryHash || data.sourcePath;
        const sourceId = `studygo:doc:${docKey}`;
        this.log(sourceId, 'started', `Document: ${title}`);

        if (!await this.validatePath(sourceId, data.sourcePath)) return;

        const content = await this.handleAssets(sourceId, data.html || data.markdown || '', data.sourcePath);

        if (!this.options.dryRun) {
            const { error } = await this.supabase
                .from('documents')
                .upsert({
                    paragraph_id: sectionId,
                    title: title,
                    html_content: content,
                    document_type: data.html ? 'html' : 'markdown',
                    source_id: sourceId,
                    source_path: data.sourcePath,
                    user_id: '00000000-0000-0000-0000-000000000000'
                }, { onConflict: 'source_id' });

            if (error) {
                this.log(sourceId, 'error', error.message);
                return;
            }
        }

        this.report.counts.docs++;
        this.markProcessed(sourceId);
        this.log(sourceId, 'completed', 'Success');
    }

    private async processQuestions(sectionId: string, questions: any[]) {
        for (const q of questions) {
            const sourceId = `studygo:question:${q.id || q.questionPath}`;
            this.log(sourceId, 'started', 'Practice Question');

            if (!this.options.dryRun) {
                const { error } = await this.supabase
                    .from('practice_questions')
                    .upsert({
                        paragraph_id: sectionId,
                        question_text: q.prompt || q.question,
                        question_type: q.type || 'mcq',
                        options: q.options,
                        correct_answer: q.correctAnswer,
                        source_id: sourceId,
                        created_by: '00000000-0000-0000-0000-000000000000'
                    }, { onConflict: 'source_id' });

                if (error) {
                    this.log(sourceId, 'error', error.message);
                    continue;
                }
            }
            this.report.counts.questions++;
            this.markProcessed(sourceId);
            this.log(sourceId, 'completed', 'Success');
        }
    }

    private async processExam(sectionId: string, data: any) {
        const sourceId = `studygo:quiz:${data.id || data.examIdOrKey || data.path}`;
        this.log(sourceId, 'started', `Exam: ${data.title}`);

        if (!this.options.dryRun) {
            const { error } = await this.supabase
                .from('quizzes')
                .upsert({
                    paragraph_id: sectionId,
                    title: data.title,
                    questions: data.questions,
                    quiz_type: 'exam',
                    source_id: sourceId
                }, { onConflict: 'source_id' });

            if (error) {
                this.log(sourceId, 'error', error.message);
                return;
            }
        }

        this.report.counts.quizzes++;
        this.markProcessed(sourceId);
        this.log(sourceId, 'completed', 'Success');
    }

    private async handleAssets(nodeId: string, content: string, sourcePath: string): Promise<string> {
        if (!content) return content;

        const imgRegex = /<img[^>]+src="([^">]+)"/g;
        let match;
        let newContent = content;

        while ((match = imgRegex.exec(content)) !== null) {
            const src = match[1];
            if (src.startsWith('http')) {
                this.log(nodeId, 'info', `Skipping external asset: ${src}`);
                continue;
            }

            const fileName = path.basename(src);
            const sourceDir = path.dirname(path.join(this.exportPath, sourcePath));
            const absoluteSrc = path.resolve(sourceDir, src);
            const targetPath = path.join(this.options.assetDir, fileName);

            // PRERQUISITE: Copy from export folder first
            if (await fs.pathExists(absoluteSrc)) {
                if (!this.options.dryRun) {
                    await fs.ensureDir(this.options.assetDir);
                    await fs.copy(absoluteSrc, targetPath);
                }
                this.report.counts.assets++;
                newContent = newContent.replace(src, `/assets/studygo/${fileName}`);
                this.log(nodeId, 'info', `Asset copied: ${fileName}`);
            } else {
                this.log(nodeId, 'warn', `Asset missing from export: ${src}`);
            }
        }

        return newContent;
    }
}
