#!/usr/bin/env node
/**
 * Script to find and list all Supabase table queries that need type casting
 */

const fs = require('fs');
const path = require('path');

// Tables known to be missing from type definitions
const MISSING_TABLES = [
    'subjects',
    'leersets',
    'admin_permission_settings',
    'announcement_pages',
    'announcements'
];

// Search for .from('tablename') patterns
const tablesToFix = {};

function searchDirectory(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
            searchDirectory(fullPath);
        } else if (file.isFile() && (file.name.endsWith('.tsx') || file.name.endsWith('.ts'))) {
            const content = fs.readFileSync(fullPath, 'utf8');

            for (const table of MISSING_TABLES) {
                const pattern = new RegExp(`from\\('${table}'\\)`, 'g');
                const matches = content.match(pattern);

                if (matches) {
                    if (!tablesToFix[table]) tablesToFix[table] = [];
                    tablesToFix[table].push({ file: fullPath, count: matches.length });
                }
            }
        }
    }
}

const srcDir = path.join(process.cwd(), 'apps', 'web', 'src');
searchDirectory(srcDir);

console.log('\n=== SUPABASE TABLE TYPE FIXES NEDEED ===\n');

for (const [table, files] of Object.entries(tablesToFix)) {
    console.log(`\n${table}:`);
    for (const { file, count } of files) {
        const relativePath = file.replace(srcDir, 'src');
        console.log(`  - ${relativePath} (${count} instances)`);
    }
}

console.log('\n');
