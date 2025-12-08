'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

import { ArrowLeft, Play, FileText, AlertCircle, CheckCircle2, HelpCircle, Copy, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ExecutionResult {
    success: boolean;
    type: string;
    name: string;
    message: string;
    id?: string;
}

// Extremely robust content extraction
function extractContent(text: string, startMarker: string, endMarkers: string[]): string {
    const lowerText = text.toLowerCase();
    const startIdx = lowerText.indexOf(startMarker.toLowerCase());
    if (startIdx === -1) return '';

    // Find where content starts (after the marker line)
    let contentStart = text.indexOf('\n', startIdx);
    if (contentStart === -1) contentStart = startIdx + startMarker.length;
    else contentStart += 1;

    // Find the nearest end marker
    let endIdx = text.length;
    for (const marker of endMarkers) {
        const idx = lowerText.indexOf(marker.toLowerCase(), contentStart);
        if (idx !== -1 && idx < endIdx) {
            endIdx = idx;
        }
    }

    return text.slice(contentStart, endIdx).trim();
}

// Parse begrippen/terms into array - handles MANY formats
function parseTerms(content: string): { term: string; definition: string }[] {
    const terms: { term: string; definition: string }[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('*')) continue;

        // Try multiple separators: =, :, -, –, —, →, =>
        const separators = [' = ', ' : ', ': ', ' - ', ' – ', ' — ', ' → ', ' => ', '='];

        for (const sep of separators) {
            const idx = trimmed.indexOf(sep);
            if (idx > 0 && idx < trimmed.length - sep.length) {
                let term = trimmed.slice(0, idx).trim();
                let definition = trimmed.slice(idx + sep.length).trim();

                // Clean up common prefixes/bullets
                term = term.replace(/^[-*•·]\s*/, '').replace(/^\d+\.\s*/, '');

                // Remove surrounding quotes
                term = term.replace(/^["'`]|["'`]$/g, '');
                definition = definition.replace(/^["'`]|["'`]$/g, '');

                if (term && definition && term.length > 0 && definition.length > 0) {
                    terms.push({ term, definition });
                    break; // Found valid separator, move to next line
                }
            }
        }
    }

    return terms;
}

// Extract all section headers and their content
function extractSections(text: string): { title: string; content: string; level: number }[] {
    const sections: { title: string; content: string; level: number }[] = [];
    const lines = text.split('\n');

    let currentSection: { title: string; content: string[]; level: number } | null = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Check for markdown headers
        const headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
        if (headerMatch) {
            // Save previous section
            if (currentSection) {
                sections.push({
                    title: currentSection.title,
                    content: currentSection.content.join('\n').trim(),
                    level: currentSection.level
                });
            }

            currentSection = {
                title: headerMatch[2].trim(),
                content: [],
                level: headerMatch[1].length
            };
        } else if (currentSection) {
            currentSection.content.push(line);
        }
    }

    // Save last section
    if (currentSection) {
        sections.push({
            title: currentSection.title,
            content: currentSection.content.join('\n').trim(),
            level: currentSection.level
        });
    }

    return sections;
}

export default function AdminBulkCreatorPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [code, setCode] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [results, setResults] = useState<ExecutionResult[]>([]);
    const [showDocs, setShowDocs] = useState(false);
    const [mode, setMode] = useState<'simple' | 'ai'>('simple');

    if (loading || !profile?.is_admin) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // SIMPLE MODE: Direct command format
    const executeSimpleMode = async () => {
        if (!user || !code.trim()) return;

        setIsExecuting(true);
        setResults([]);
        const executionResults: ExecutionResult[] = [];
        const createdIds: { [key: string]: string } = {};

        try {
            const lines = code.split('\n');
            let currentCommand: any = null;
            let currentItems: { term: string; definition: string }[] = [];
            let currentElements: { type: string; content: string }[] = [];
            let inItems = false;
            let inElements = false;

            const processCommand = async (cmd: any) => {
                if (!cmd) return;

                try {
                    switch (cmd.type) {
                        case 'subject':
                        case 'folder': {
                            const { data, error } = await (supabase.from('subjects') as any)
                                .insert([{
                                    user_id: user.id,
                                    title: cmd.name,
                                    color: cmd.color || 'blue',
                                    is_public: true
                                }])
                                .select()
                                .single();

                            if (error) throw error;
                            createdIds[cmd.name] = data.id;
                            executionResults.push({
                                success: true,
                                type: cmd.type === 'folder' ? 'Folder' : 'Subject',
                                name: cmd.name,
                                message: 'Created successfully',
                                id: data.id
                            });
                            break;
                        }

                        case 'unit': {
                            const parentId = createdIds[cmd.parent] || cmd.parent;
                            if (!parentId) throw new Error(`Parent "${cmd.parent}" not found`);

                            const { data, error } = await (supabase.from('units') as any)
                                .insert([{ subject_id: parentId, title: cmd.name }])
                                .select()
                                .single();

                            if (error) throw error;
                            createdIds[cmd.name] = data.id;
                            executionResults.push({
                                success: true,
                                type: 'Unit',
                                name: cmd.name,
                                message: 'Created successfully',
                                id: data.id
                            });
                            break;
                        }

                        case 'paragraph': {
                            const parentId = createdIds[cmd.parent] || cmd.parent;
                            if (!parentId) throw new Error(`Parent "${cmd.parent}" not found`);

                            const { data, error } = await (supabase.from('paragraphs') as any)
                                .insert([{ unit_id: parentId, title: cmd.name, content: '' }])
                                .select()
                                .single();

                            if (error) throw error;
                            createdIds[cmd.name] = data.id;
                            executionResults.push({
                                success: true,
                                type: 'Paragraph',
                                name: cmd.name,
                                message: 'Created successfully',
                                id: data.id
                            });
                            break;
                        }

                        case 'learning_set': {
                            const parentId = createdIds[cmd.parent] || cmd.parent;
                            if (!parentId) throw new Error(`Parent "${cmd.parent}" not found`);

                            const { data: setData, error: setError } = await (supabase.from('learning_sets') as any)
                                .insert([{
                                    paragraph_id: parentId,
                                    user_id: user.id,
                                    created_by: user.id,
                                    title: cmd.name
                                }])
                                .select()
                                .single();

                            if (setError) throw setError;

                            if (cmd.items && cmd.items.length > 0) {
                                const items = cmd.items.map((item: any, index: number) => ({
                                    learning_set_id: setData.id,
                                    front_text: item.term,
                                    back_text: item.definition,
                                    order_index: index
                                }));
                                await (supabase.from('flashcards') as any).insert(items);
                            }

                            createdIds[cmd.name] = setData.id;
                            executionResults.push({
                                success: true,
                                type: 'Learning Set',
                                name: cmd.name,
                                message: `Created with ${cmd.items?.length || 0} items`,
                                id: setData.id
                            });
                            break;
                        }

                        case 'document': {
                            const parentId = createdIds[cmd.parent] || cmd.parent;
                            if (!parentId) throw new Error(`Parent "${cmd.parent}" not found`);

                            const elements = (cmd.elements || []).map((el: any, i: number) => ({
                                id: `elem-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
                                type: el.type,
                                content: el.content,
                                order: i
                            }));

                            const { data, error } = await (supabase.from('documents') as any)
                                .insert([{
                                    paragraph_id: parentId,
                                    user_id: user.id,
                                    title: cmd.name,
                                    elements: elements
                                }])
                                .select()
                                .single();

                            if (error) throw error;
                            createdIds[cmd.name] = data.id;
                            executionResults.push({
                                success: true,
                                type: 'Document',
                                name: cmd.name,
                                message: `Created with ${elements.length} elements`,
                                id: data.id
                            });
                            break;
                        }
                    }
                } catch (error: any) {
                    executionResults.push({
                        success: false,
                        type: cmd.type || 'Unknown',
                        name: cmd.name || 'Unknown',
                        message: error.message || 'Unknown error'
                    });
                }
            };

            for (const line of lines) {
                const trimmed = line.trim();

                // Skip empty lines and comments
                if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

                // New command
                if (trimmed.startsWith('@')) {
                    // Process previous command
                    if (currentCommand) {
                        if (currentItems.length > 0) currentCommand.items = currentItems;
                        if (currentElements.length > 0) currentCommand.elements = currentElements;
                        await processCommand(currentCommand);
                    }

                    // Reset
                    currentItems = [];
                    currentElements = [];
                    inItems = false;
                    inElements = false;

                    // Parse new command - very flexible regex
                    const cmdMatch = trimmed.match(/@(\w+)\s+["']?([^"'\n]+?)["']?\s*(?:parent\s*=\s*["']?([^"'\n]+?)["']?)?\s*(?:color\s*=\s*["']?(\w+)["']?)?$/i);
                    if (cmdMatch) {
                        currentCommand = {
                            type: cmdMatch[1].toLowerCase(),
                            name: cmdMatch[2].trim(),
                            parent: cmdMatch[3]?.trim(),
                            color: cmdMatch[4]?.trim()
                        };
                    }
                } else if (currentCommand) {
                    // Check for section markers
                    if (/^items?:?\s*$/i.test(trimmed)) {
                        inItems = true;
                        inElements = false;
                    } else if (/^elements?:?\s*$/i.test(trimmed)) {
                        inElements = true;
                        inItems = false;
                    } else if (inItems) {
                        // Parse item
                        const parsed = parseTerms(trimmed);
                        if (parsed.length > 0) {
                            currentItems.push(...parsed);
                        }
                    } else if (inElements) {
                        // Parse element
                        const elemMatch = trimmed.match(/^[-*]?\s*(\w+)\s*:\s*["']?(.+?)["']?\s*$/);
                        if (elemMatch) {
                            currentElements.push({ type: elemMatch[1], content: elemMatch[2] });
                        }
                    }
                }
            }

            // Process last command
            if (currentCommand) {
                if (currentItems.length > 0) currentCommand.items = currentItems;
                if (currentElements.length > 0) currentCommand.elements = currentElements;
                await processCommand(currentCommand);
            }

            if (executionResults.length === 0) {
                executionResults.push({
                    success: false,
                    type: 'Parser',
                    name: 'No Commands',
                    message: 'No valid commands found. Start commands with @ (e.g., @subject "Name")'
                });
            }
        } catch (error: any) {
            executionResults.push({
                success: false,
                type: 'Error',
                name: 'Execution',
                message: error.message || 'Unknown error'
            });
        }

        setResults(executionResults);
        setIsExecuting(false);
    };

    // AI MODE: Parse AI study output and create learning sets
    const executeAIMode = async () => {
        if (!user || !code.trim()) return;

        setIsExecuting(true);
        setResults([]);
        const executionResults: ExecutionResult[] = [];
        const createdIds: { [key: string]: string } = {};

        try {
            // Extract the first line as subject name or use a default
            const lines = code.split('\n').filter(l => l.trim());
            let subjectName = 'Study Material';

            // Look for title in first few lines
            for (let i = 0; i < Math.min(5, lines.length); i++) {
                const line = lines[i].trim();
                if (line.startsWith('# ') || line.startsWith('## ')) {
                    subjectName = line.replace(/^#+\s*/, '').trim();
                    break;
                }
                if (line.length > 5 && line.length < 100 && !line.includes('=')) {
                    subjectName = line;
                    break;
                }
            }

            // Create subject
            const { data: subjectData, error: subjectError } = await (supabase.from('subjects') as any)
                .insert([{
                    user_id: user.id,
                    title: subjectName,
                    color: 'blue',
                    is_public: true
                }])
                .select()
                .single();

            if (subjectError) throw subjectError;
            createdIds['subject'] = subjectData.id;
            executionResults.push({
                success: true,
                type: 'Subject',
                name: subjectName,
                message: 'Created successfully',
                id: subjectData.id
            });

            // Create unit
            const { data: unitData, error: unitError } = await (supabase.from('units') as any)
                .insert([{ subject_id: subjectData.id, title: 'Content' }])
                .select()
                .single();

            if (unitError) throw unitError;
            createdIds['unit'] = unitData.id;
            executionResults.push({
                success: true,
                type: 'Unit',
                name: 'Content',
                message: 'Created successfully',
                id: unitData.id
            });

            // Create paragraph
            const { data: paraData, error: paraError } = await (supabase.from('paragraphs') as any)
                .insert([{ unit_id: unitData.id, title: 'Study Material', content: '' }])
                .select()
                .single();

            if (paraError) throw paraError;
            createdIds['paragraph'] = paraData.id;
            executionResults.push({
                success: true,
                type: 'Paragraph',
                name: 'Study Material',
                message: 'Created successfully',
                id: paraData.id
            });

            // Look for begrippen/terms section
            const termsSectionMarkers = [
                'begrippenlijst', 'begrippen', 'woordenlijst', 'termen', 'definities',
                'vocabulary', 'terms', 'definitions', 'glossary', 'key terms'
            ];
            const endMarkers = ['###', '## ', '# ', '---', '___', 'active recall', 'vragen', 'questions'];

            let termsContent = '';
            for (const marker of termsSectionMarkers) {
                termsContent = extractContent(code, marker, endMarkers);
                if (termsContent) break;
            }

            // If no specific section found, try to parse the entire content
            if (!termsContent) {
                termsContent = code;
            }

            const terms = parseTerms(termsContent);

            if (terms.length > 0) {
                // Create learning set
                const { data: setData, error: setError } = await (supabase.from('learning_sets') as any)
                    .insert([{
                        paragraph_id: paraData.id,
                        user_id: user.id,
                        created_by: user.id,
                        title: 'Begrippen'
                    }])
                    .select()
                    .single();

                if (setError) throw setError;

                // Insert terms in batches
                const batchSize = 50;
                for (let i = 0; i < terms.length; i += batchSize) {
                    const batch = terms.slice(i, i + batchSize).map((t, idx) => ({
                        learning_set_id: setData.id,
                        front_text: t.term,
                        back_text: t.definition,
                        order_index: i + idx
                    }));
                    await (supabase.from('flashcards') as any).insert(batch);
                }

                executionResults.push({
                    success: true,
                    type: 'Learning Set',
                    name: 'Begrippen',
                    message: `Created with ${terms.length} terms`,
                    id: setData.id
                });
            } else {
                executionResults.push({
                    success: false,
                    type: 'Learning Set',
                    name: 'Begrippen',
                    message: 'No terms found. Make sure terms use format: term = definition'
                });
            }

        } catch (error: any) {
            executionResults.push({
                success: false,
                type: 'Error',
                name: 'Execution',
                message: error.message || 'Unknown error'
            });
        }

        setResults(executionResults);
        setIsExecuting(false);
    };

    const executeCommands = async () => {
        if (mode === 'simple') {
            await executeSimpleMode();
        } else {
            await executeAIMode();
        }
    };

    const simpleExample = `# Create structure
@subject "Wiskunde" color="blue"
@unit "Algebra" parent="Wiskunde"
@paragraph "Hoofdstuk 1" parent="Algebra"

# Create learning set with terms
@learning_set "Belangrijke Begrippen" parent="Hoofdstuk 1"
items:
  variabele = een letter die een onbekende waarde voorstelt
  coëfficiënt = het getal voor een variabele
  constante = een vast getal dat niet verandert`;

    const aiExample = `# Wiskunde Hoofdstuk 3

## BEGRIPPENLIJST

variabele = een letter die een onbekende waarde voorstelt
coëfficiënt = het getal voor een variabele  
constante = een vast getal dat niet verandert
vergelijking = een wiskundige uitdrukking met een = teken
functie = een relatie tussen input en output
domein = alle mogelijke input waarden
bereik = alle mogelijke output waarden

## SAMENVATTING

Dit is de samenvatting tekst...`;

    return (
        <div className="h-full overflow-y-auto p-8 relative">


            <div className="flex-1 relative">
                <div className="max-w-6xl mx-auto">
                    <header className="mb-8">
                        <button
                            onClick={() => router.push('/admin')}
                            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Admin</span>
                        </button>
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-serif font-bold text-white mb-2">Bulk Creator</h1>
                                <p className="text-slate-400">Create subjects, units, and learning sets in bulk</p>
                            </div>
                            <button
                                onClick={() => setShowDocs(!showDocs)}
                                className="glass-button px-4 py-2 rounded-xl flex items-center gap-2"
                            >
                                <HelpCircle className="w-4 h-4" />
                                <span>{showDocs ? 'Hide' : 'Show'} Docs</span>
                            </button>
                        </div>
                    </header>

                    {/* Mode Selector */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setMode('simple')}
                            className={`px-4 py-2 rounded-xl font-medium transition-all ${mode === 'simple'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                        >
                            Simple Mode
                        </button>
                        <button
                            onClick={() => setMode('ai')}
                            className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${mode === 'ai'
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                        >
                            <BookOpen className="w-4 h-4" />
                            AI Study Mode
                        </button>
                    </div>

                    {showDocs && (
                        <div className="glass-card p-6 mb-8 max-h-[400px] overflow-y-auto">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-400" />
                                {mode === 'simple' ? 'Simple Mode Documentation' : 'AI Study Mode Documentation'}
                            </h3>

                            {mode === 'simple' ? (
                                <div className="space-y-4 text-sm">
                                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                        <p className="text-green-400 font-medium">✓ Bulletproof Parser</p>
                                        <p className="text-slate-400 mt-1">Handles quotes, special characters, multiple formats. Almost impossible to cause errors.</p>
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium mb-2">Commands</h4>
                                        <code className="block bg-slate-800 p-3 rounded-lg text-green-400 whitespace-pre">{`@subject "Name" color="blue"
@unit "Name" parent="Subject Name"
@paragraph "Name" parent="Unit Name"
@learning_set "Name" parent="Paragraph Name"
items:
  term = definitie
  term2 = definitie2`}</code>
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium mb-2">Term Formats (all work)</h4>
                                        <code className="block bg-slate-800 p-3 rounded-lg text-slate-300 whitespace-pre">{`term = definition
term : definition  
term - definition
term → definition
"term" = "definition"`}</code>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 text-sm">
                                    <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                        <p className="text-purple-400 font-medium">🤖 AI Output Compatible</p>
                                        <p className="text-slate-400 mt-1">Paste AI-generated study material directly. Automatically extracts begrippen/terms.</p>
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium mb-2">What it does</h4>
                                        <ul className="text-slate-400 space-y-1">
                                            <li>• Creates a subject from the title</li>
                                            <li>• Finds and extracts the "BEGRIPPENLIJST" section</li>
                                            <li>• Creates a learning set with all terms</li>
                                            <li>• Recognizes many separators: = : - → =&gt;</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium mb-2">Required Format</h4>
                                        <code className="block bg-slate-800 p-3 rounded-lg text-slate-300 whitespace-pre">{`## BEGRIPPENLIJST

term = definitie
term2 = definitie2
term3 = definitie3`}</code>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Code Input */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-white">
                                    {mode === 'simple' ? 'Command Input' : 'Paste AI Output'}
                                </h3>
                                <button
                                    onClick={() => setCode(mode === 'simple' ? simpleExample : aiExample)}
                                    className="text-xs text-blue-400 hover:text-blue-300"
                                >
                                    Load Example
                                </button>
                            </div>
                            <textarea
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder={mode === 'simple'
                                    ? '@subject "Name" color="blue"\n@unit "Name" parent="Name"\n...'
                                    : 'Paste AI study output here...\n\n## BEGRIPPENLIJST\n\nterm = definitie\n...'
                                }
                                className="w-full h-[500px] bg-slate-800/50 border border-white/10 rounded-xl p-4 text-white font-mono text-sm resize-none focus:outline-none focus:border-blue-500"
                                spellCheck={false}
                            />
                            <button
                                onClick={executeCommands}
                                disabled={isExecuting || !code.trim()}
                                className={`w-full mt-4 ${mode === 'simple' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-purple-600 hover:bg-purple-500'} text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
                            >
                                <Play className="w-4 h-4" />
                                {isExecuting ? 'Processing...' : (mode === 'simple' ? 'Execute Commands' : 'Create from AI Output')}
                            </button>
                        </div>

                        {/* Results */}
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-medium text-white mb-4">Results</h3>
                            <div className="h-[500px] overflow-y-auto space-y-2">
                                {results.length === 0 ? (
                                    <div className="text-center py-20 text-slate-500">
                                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>Results will appear here</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-4 p-3 rounded-lg bg-slate-800/50 border border-white/5">
                                            <p className="text-sm text-slate-300">
                                                {results.filter(r => r.success).length} / {results.length} successful
                                            </p>
                                        </div>
                                        {results.map((result, i) => (
                                            <div
                                                key={i}
                                                className={`p-3 rounded-lg border ${result.success
                                                    ? 'bg-green-500/10 border-green-500/30'
                                                    : 'bg-red-500/10 border-red-500/30'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-2">
                                                    {result.success ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                                    ) : (
                                                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                                                                {result.type}
                                                            </span>
                                                            <span className="text-white font-medium truncate">
                                                                {result.name}
                                                            </span>
                                                        </div>
                                                        <p className={`text-sm mt-1 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                                                            {result.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
