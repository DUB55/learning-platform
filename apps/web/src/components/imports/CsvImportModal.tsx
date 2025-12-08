import { useState, useRef } from 'react';
import { Upload, FileText, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface CsvImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: { term: string; definition: string }[]) => void;
}

export default function CsvImportModal({ isOpen, onClose, onSuccess }: CsvImportModalProps) {
    const [activeTab, setActiveTab] = useState<'paste' | 'file'>('paste');
    const [pasteContent, setPasteContent] = useState('');
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    if (!isOpen) return null;

    const parseCsv = (text: string) => {
        const lines = text.split('\n');
        const data: { term: string; definition: string }[] = [];

        for (const line of lines) {
            if (!line.trim()) continue;

            // Try splitting by tab first (common for copy-paste from Excel), then comma
            let parts = line.split('\t');
            if (parts.length < 2) {
                parts = line.split(',');
            }

            if (parts.length >= 2) {
                const term = parts[0].trim();
                // Join the rest in case definition has commas
                const definition = parts.slice(1).join(',').trim();
                if (term && definition) {
                    data.push({ term, definition });
                }
            }
        }
        return data;
    };

    const handleImport = () => {
        const data = parseCsv(pasteContent);
        if (data.length === 0) {
            toast.error('No valid data found. Format: Term, Definition');
            return;
        }
        onSuccess(data);
        onClose();
        setPasteContent('');
        setFileName('');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            setPasteContent(text);
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-400" />
                            Import from CSV
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Import terms and definitions from Excel or CSV</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex gap-4 mb-6 border-b border-white/10">
                        <button
                            onClick={() => setActiveTab('paste')}
                            className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === 'paste' ? 'text-purple-400' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Paste Text
                            {activeTab === 'paste' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-purple-400" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('file')}
                            className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === 'file' ? 'text-purple-400' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Upload File
                            {activeTab === 'file' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-purple-400" />}
                        </button>
                    </div>

                    {activeTab === 'paste' ? (
                        <div className="space-y-4">
                            <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5 text-sm text-slate-400">
                                <p className="font-medium text-white mb-2">Format Instructions:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>Copy and paste from Excel, Google Sheets, or a CSV file.</li>
                                    <li>Format: <strong>Column A (Term)</strong>, <strong>Column B (Definition)</strong></li>
                                    <li>Supported separators: Tab or Comma</li>
                                </ul>
                            </div>
                            <textarea
                                value={pasteContent}
                                onChange={(e) => setPasteContent(e.target.value)}
                                placeholder="Paste your data here..."
                                className="w-full h-48 bg-slate-800/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500/50 resize-none font-mono text-sm"
                            />
                        </div>
                    ) : (
                        <div className="h-48 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center bg-slate-800/30 hover:bg-slate-800/50 transition-colors relative">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".csv,.txt"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <Upload className="w-8 h-8 text-slate-400 mb-2" />
                            <p className="text-white font-medium mb-1">
                                {fileName || 'Click or drag file to upload'}
                            </p>
                            <p className="text-slate-500 text-sm">Supported files: .csv, .txt</p>
                        </div>
                    )}

                    {/* Preview (if content exists) */}
                    {pasteContent && (
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-slate-400 mb-2">Preview ({parseCsv(pasteContent).length} pairs)</h3>
                            <div className="bg-slate-950 rounded-lg p-2 max-h-32 overflow-y-auto border border-white/5 space-y-1">
                                {parseCsv(pasteContent).slice(0, 5).map((item, i) => (
                                    <div key={i} className="flex gap-2 text-xs">
                                        <span className="text-purple-400 font-medium truncate w-1/3">{item.term}</span>
                                        <span className="text-slate-400 truncate flex-1">{item.definition}</span>
                                    </div>
                                ))}
                                {parseCsv(pasteContent).length > 5 && (
                                    <p className="text-xs text-slate-500 italic pl-2">...and {parseCsv(pasteContent).length - 5} more</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={!pasteContent.trim()}
                        className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Check size={18} /> Import Terms
                    </button>
                </div>
            </div>
        </div>
    );
}
