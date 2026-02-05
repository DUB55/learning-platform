import { Command } from 'commander';
import { createClient } from '@supabase/supabase-js';
import { StudyGoImporter } from '../services/studygo-importer';
import path from 'path';
import fs from 'fs-extra';
import 'dotenv/config';

const program = new Command();

program
    .name('import-studygo')
    .description('Import StudyGo export material (Export Contract v1) into the learning platform.')
    .requiredOption('-p, --path <path>', 'Path to the export directory')
    .option('-d, --dry-run', 'Run the import without writing to the database')
    .option('-c, --commit', 'Commit changes to the database and assets')
    .option('-a, --assets <path>', 'Path where assets should be stored', './public/assets/studygo')
    .action(async (options) => {
        try {
            if (!options.dryRun && !options.commit) {
                console.error('Error: You must specify either --dry-run or --commit');
                process.exit(1);
            }

            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

            if (!supabaseUrl || !supabaseKey) {
                console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.');
                process.exit(1);
            }

            const supabase = createClient(supabaseUrl, supabaseKey);
            const exportPath = path.resolve(options.path);
            const assetDir = path.resolve(options.assets);

            console.log(`🚀 Starting import from: ${exportPath}`);
            if (options.dryRun) console.log('⚠️ Running in DRY-RUN mode. No changes will be made.');

            const importer = new StudyGoImporter(supabase, exportPath, {
                dryRun: !!options.dryRun,
                commit: !!options.commit,
                assetDir
            });

            const report = await importer.run();

            // Save report
            const reportPath = path.join(process.cwd(), 'import_report.json');
            await fs.writeJson(reportPath, report, { spaces: 2 });

            console.log('\n--- Import Report ---');
            console.log(`Success: ${report.success ? '✅' : '❌'}`);
            console.log(`\nCoverage:`);
            console.log(`- Manifest Items: ${report.coverage.total_items_in_manifest}`);
            console.log(`- Items Processed: ${report.coverage.items_processed}`);
            console.log(`- Coverage %: ${((report.coverage.items_processed / report.coverage.total_items_in_manifest) * 100).toFixed(1)}%`);

            console.log(`\nTotals:`);
            console.log(`- Subjects: ${report.counts.subjects}`);
            console.log(`- Books: ${report.counts.books}`);
            console.log(`- Chapters: ${report.counts.chapters}`);
            console.log(`- Sections: ${report.counts.sections}`);
            console.log(`- Documents: ${report.counts.docs}`);
            console.log(`- Leersets: ${report.counts.sets}`);
            console.log(`- Flashcards: ${report.counts.flashcards}`);
            console.log(`- Questions: ${report.counts.questions}`);
            console.log(`- Quizzes: ${report.counts.quizzes}`);
            console.log(`- Assets: ${report.counts.assets}`);

            if (report.warnings.length > 0) {
                console.log(`\nWarnings (${report.warnings.length}):`);
                report.warnings.slice(0, 10).forEach(w => console.warn(`- ${w}`));
                if (report.warnings.length > 10) console.warn('...');
            }

            if (report.errors.length > 0) {
                console.log(`\nErrors (${report.errors.length}):`);
                report.errors.slice(0, 10).forEach(e => console.error(`- ${e}`));
                if (report.errors.length > 10) console.error('...');
                process.exit(1);
            }

            console.log(`\nFull report saved to: ${reportPath}`);
            console.log('Log file: import_log.jsonl');

        } catch (error: any) {
            console.error(`\nFatal error: ${error.message}`);
            process.exit(1);
        }
    });

program.parse();
