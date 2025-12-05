'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import {
    ArrowLeft, Edit2, Trash2, Play, Shuffle, Eye, EyeOff,
    ChevronsRight, Star, Settings, X, Check, ChevronLeft, ChevronRight,
    BookOpen, PenTool, ClipboardList, Gamepad2, Layers, GraduationCap
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import BlockBlastGame from '@/components/games/BlockBlastGame';
import FlappyBirdGame from '@/components/games/FlappyBirdGame';
import CrossyRoadGame from '@/components/games/CrossyRoadGame';
import StudyResultsPage from '@/components/StudyResultsPage';

interface LearningSetItem {
    id: string;
    term: string;
    definition: string;
    starred?: boolean;
}

interface LearningSet {
    id: string;
    title: string;
    description: string | null;
    user_id: string;
    created_at: string;
}

type StudyMode = 'flashcards' | 'multiple-choice' | 'writing' | 'learning' | 'test' | 'match' | 'play' | null;

// Settings for study modes
interface ModeSettings {
    answerWithTerm: boolean;
    answerWithDefinition: boolean;
    starredOnly: boolean;
    shuffleTerms: boolean;
}

export default function ViewLearningSetPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const setId = params.setId as string;

    const [learningSet, setLearningSet] = useState<LearningSet | null>(null);
    const [items, setItems] = useState<LearningSetItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [studyMode, setStudyMode] = useState<StudyMode>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Mode settings
    const [settings, setSettings] = useState<ModeSettings>({
        answerWithTerm: false,
        answerWithDefinition: true,
        starredOnly: false,
        shuffleTerms: false
    });

    // Multiple choice state
    const [mcOptions, setMcOptions] = useState<string[]>([]);
    const [mcSelected, setMcSelected] = useState<string | null>(null);
    const [mcResult, setMcResult] = useState<'correct' | 'wrong' | null>(null);

    // Writing/learning mode state
    const [userAnswer, setUserAnswer] = useState('');
    const [writeResult, setWriteResult] = useState<'correct' | 'wrong' | null>(null);

    // Test mode state
    const [testAnswers, setTestAnswers] = useState<{ [key: string]: string }>({});
    const [testSubmitted, setTestSubmitted] = useState(false);
    const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({});
    const [testFilter, setTestFilter] = useState<'all' | 'correct' | 'wrong'>('all');

    // Match mode state
    const [matchPairs, setMatchPairs] = useState<{ id: string; text: string; type: 'term' | 'definition'; matched: boolean; position: { x: number; y: number } }[]>([]);
    const [matchSelected, setMatchSelected] = useState<string | null>(null);
    const [matchWrong, setMatchWrong] = useState<string[]>([]);

    // Learning mode step state
    const [learningStep, setLearningStep] = useState<'review' | 'mc' | 'write'>('review');
    const [learningMCOptions, setLearningMCOptions] = useState<string[]>([]);
    const [learningMCResult, setLearningMCResult] = useState<'correct' | 'wrong' | null>(null);

    // Global UI Settings
    const [animationStyle, setAnimationStyle] = useState<'flip' | 'fade'>('flip');

    // Play mode game selection
    const [selectedGame, setSelectedGame] = useState<'menu' | 'blockblast' | 'flappybird' | 'crossyroad'>('menu');

    // Study results tracking
    const [showResults, setShowResults] = useState(false);
    const [studyResults, setStudyResults] = useState<{
        mode: string;
        totalItems: number;
        correctAnswers: number;
        timeSpent: number;
        date: Date;
    } | null>(null);
    const [sessionStartTime, setSessionStartTime] = useState<number>(0);
    const [sessionCorrectCount, setSessionCorrectCount] = useState(0);

    useEffect(() => {
        const style = localStorage.getItem('ui.flashcard_animation');
        if (style === 'fade') setAnimationStyle('fade');
    }, []);

    useEffect(() => {
        if (user && setId) {
            fetchData();
        }
    }, [user, setId]);

    const fetchData = async () => {
        setLoading(true);

        const { data: setData } = await supabase
            .from('learning_sets')
            .select('*')
            .eq('id', setId)
            .single();

        if (setData) setLearningSet(setData);

        // Query flashcards table (this is where items are stored)
        const { data: itemsData } = await supabase
            .from('flashcards')
            .select('*')
            .eq('learning_set_id', setId)
            .order('order_index');

        if (itemsData) {
            // Map flashcards fields to term/definition
            setItems(itemsData.map(item => ({
                id: item.id,
                term: item.front_text,
                definition: item.back_text,
                starred: false
            })));
        }

        setLoading(false);
    };

    const handleDelete = async () => {
        if (!confirm('Delete this learning set?')) return;

        await supabase
            .from('learning_sets')
            .delete()
            .eq('id', setId);

        router.back();
    };

    const getStudyItems = useCallback(() => {
        let studyItems = [...items];
        if (settings.starredOnly) {
            studyItems = studyItems.filter(i => i.starred);
        }
        if (settings.shuffleTerms) {
            studyItems = studyItems.sort(() => Math.random() - 0.5);
        }
        return studyItems;
    }, [items, settings]);

    const toggleStar = (id: string) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, starred: !item.starred } : item
        ));
    };

    // FLASHCARD MODE
    const startFlashcards = () => {
        setStudyMode('flashcards');
        setCurrentIndex(0);
        setShowAnswer(false);
        setIsFlipped(false);
        setSessionStartTime(Date.now());
        setSessionCorrectCount(0);
    };

    const flipCard = () => {
        setIsFlipped(!isFlipped);
    };

    // Handle keyboard for flashcards
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (studyMode === 'flashcards') {
                if (e.code === 'Space') {
                    e.preventDefault();
                    flipCard();
                } else if (e.code === 'ArrowRight' && currentIndex < items.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                    setIsFlipped(false);
                } else if (e.code === 'ArrowLeft' && currentIndex > 0) {
                    setCurrentIndex(currentIndex - 1);
                    setIsFlipped(false);
                }
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [studyMode, currentIndex, items.length, isFlipped]);

    // MULTIPLE CHOICE MODE
    const startMultipleChoice = () => {
        setStudyMode('multiple-choice');
        setCurrentIndex(0);
        setMcSelected(null);
        setMcResult(null);
        generateMCOptions(0);
        setSessionStartTime(Date.now());
        setSessionCorrectCount(0);
    };

    const generateMCOptions = (index: number) => {
        const studyItems = getStudyItems();
        if (studyItems.length === 0) return;

        const correctAnswer = settings.answerWithTerm
            ? studyItems[index].term
            : studyItems[index].definition;

        // Get wrong options from other items
        const wrongOptions = studyItems
            .filter((_, i) => i !== index)
            .map(item => settings.answerWithTerm ? item.term : item.definition)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        const allOptions = [correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);
        setMcOptions(allOptions);
        setMcSelected(null);
        setMcResult(null);
    };

    const handleMCSelect = (option: string) => {
        if (mcResult) return; // Already answered

        const studyItems = getStudyItems();
        const correctAnswer = settings.answerWithTerm
            ? studyItems[currentIndex].term
            : studyItems[currentIndex].definition;

        setMcSelected(option);
        setMcResult(option === correctAnswer ? 'correct' : 'wrong');
    };

    const nextMCQuestion = () => {
        const studyItems = getStudyItems();
        if (currentIndex < studyItems.length - 1) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            generateMCOptions(nextIdx);
        }
    };

    // WRITING/LEARNING MODE
    const startWritingMode = () => {
        setStudyMode('writing');
        setCurrentIndex(0);
        setUserAnswer('');
        setWriteResult(null);
        setSessionStartTime(Date.now());
        setSessionCorrectCount(0);
    };

    const startLearningMode = () => {
        setStudyMode('learning');
        setCurrentIndex(0);
        setLearningStep('review');
        setUserAnswer('');
        setWriteResult(null);
        setLearningMCResult(null);
        setSessionStartTime(Date.now());
        setSessionCorrectCount(0);
    };

    // Complete study session and show results
    const completeStudySession = (mode: string, correct: number, total: number) => {
        const timeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);
        setStudyResults({
            mode,
            totalItems: total,
            correctAnswers: correct,
            timeSpent,
            date: new Date()
        });
        setShowResults(true);
        setStudyMode(null);

        // Save to localStorage
        const history = JSON.parse(localStorage.getItem('study_history') || '[]');
        history.push({ mode, correct, total, timeSpent, date: new Date().toISOString(), setId });
        localStorage.setItem('study_history', JSON.stringify(history.slice(-50)));
    };

    const generateLearningMCOptions = (index: number) => {
        const studyItems = getStudyItems();
        if (studyItems.length === 0) return;
        const correctAnswer = settings.answerWithTerm
            ? studyItems[index].term
            : studyItems[index].definition;
        const wrongOptions = studyItems
            .filter((_, i) => i !== index)
            .map(item => settings.answerWithTerm ? item.term : item.definition)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        setLearningMCOptions([correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5));
    };

    const handleLearningMC = (option: string) => {
        const studyItems = getStudyItems();
        const correctAnswer = settings.answerWithTerm
            ? studyItems[currentIndex].term
            : studyItems[currentIndex].definition;
        setLearningMCResult(option === correctAnswer ? 'correct' : 'wrong');
    };

    const nextLearningStep = () => {
        const studyItems = getStudyItems();
        if (learningStep === 'review') {
            setLearningStep('mc');
            generateLearningMCOptions(currentIndex);
        } else if (learningStep === 'mc') {
            if (learningMCResult === 'correct') {
                // Skip to next card
                if (currentIndex < studyItems.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                    setLearningStep('review');
                    setLearningMCResult(null);
                } else {
                    setStudyMode(null); // Done
                }
            } else {
                // Wrong - go to write step
                setLearningStep('write');
                setUserAnswer('');
                setWriteResult(null);
            }
        } else if (learningStep === 'write') {
            // After write, move on
            if (currentIndex < studyItems.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setLearningStep('review');
                setWriteResult(null);
                setLearningMCResult(null);
            } else {
                setStudyMode(null);
            }
        }
    };

    const checkWriteAnswer = () => {
        const studyItems = getStudyItems();
        const correctAnswer = settings.answerWithTerm
            ? studyItems[currentIndex].term
            : studyItems[currentIndex].definition;

        const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
        setWriteResult(isCorrect ? 'correct' : 'wrong');
    };

    const nextWriteQuestion = () => {
        const studyItems = getStudyItems();
        if (currentIndex < studyItems.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setUserAnswer('');
            setWriteResult(null);
        }
    };

    // TEST MODE
    const startTestMode = () => {
        setStudyMode('test');
        setTestAnswers({});
        setTestSubmitted(false);
        setTestResults({});
        setTestFilter('all');
        setSessionStartTime(Date.now());
        setSessionCorrectCount(0);
    };

    const submitTest = () => {
        const studyItems = getStudyItems();
        const results: { [key: string]: boolean } = {};

        studyItems.forEach(item => {
            const userAns = (testAnswers[item.id] || '').toLowerCase().trim();
            const correctAns = settings.answerWithTerm
                ? item.term.toLowerCase().trim()
                : item.definition.toLowerCase().trim();
            results[item.id] = userAns === correctAns;
        });

        setTestResults(results);
        setTestSubmitted(true);
    };

    // MATCH MODE
    const startMatchMode = () => {
        setStudyMode('match');
        initializeMatchGame();
        setSessionStartTime(Date.now());
        setSessionCorrectCount(0);
    };

    const initializeMatchGame = () => {
        const studyItems = getStudyItems().slice(0, 6); // Limit to 6 pairs
        const pairs: typeof matchPairs = [];

        // Create term cards
        studyItems.forEach((item, i) => {
            pairs.push({
                id: `term-${item.id}`,
                text: item.term,
                type: 'term',
                matched: false,
                position: { x: 5 + Math.random() * 30, y: 10 + (i * 14) }
            });
        });

        // Create definition cards (on right side)
        studyItems.forEach((item, i) => {
            pairs.push({
                id: `def-${item.id}`,
                text: item.definition,
                type: 'definition',
                matched: false,
                position: { x: 55 + Math.random() * 30, y: 10 + (i * 14) }
            });
        });

        setMatchPairs(pairs.sort(() => Math.random() - 0.5));
        setMatchSelected(null);
        setMatchWrong([]);
    };

    const handleMatchClick = (id: string) => {
        const pair = matchPairs.find(p => p.id === id);
        if (!pair || pair.matched) return;

        if (!matchSelected) {
            setMatchSelected(id);
        } else {
            const selectedPair = matchPairs.find(p => p.id === matchSelected);
            if (!selectedPair) return;

            // Check if same type (can't match term with term)
            if (selectedPair.type === pair.type) {
                setMatchSelected(id);
                return;
            }

            // Get base IDs (remove term-/def- prefix)
            const selectedBaseId = matchSelected.replace('term-', '').replace('def-', '');
            const clickedBaseId = id.replace('term-', '').replace('def-', '');

            if (selectedBaseId === clickedBaseId) {
                // Correct match!
                setMatchPairs(matchPairs.map(p =>
                    (p.id === matchSelected || p.id === id) ? { ...p, matched: true } : p
                ));
                setMatchSelected(null);
            } else {
                // Wrong match
                setMatchWrong([matchSelected, id]);
                setTimeout(() => {
                    setMatchWrong([]);
                    setMatchSelected(null);
                }, 800);
            }
        }
    };

    // PLAY MODE - Block Blast
    const startPlayMode = () => {
        setStudyMode('play');
    };

    // Settings Modal
    const SettingsModal = () => (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Study Settings</h3>
                    <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                        <span className="text-white">Answer with term</span>
                        <input
                            type="checkbox"
                            checked={settings.answerWithTerm}
                            onChange={(e) => setSettings({ ...settings, answerWithTerm: e.target.checked })}
                            className="w-5 h-5 accent-blue-500"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                        <span className="text-white">Answer with definition</span>
                        <input
                            type="checkbox"
                            checked={settings.answerWithDefinition}
                            onChange={(e) => setSettings({ ...settings, answerWithDefinition: e.target.checked })}
                            className="w-5 h-5 accent-blue-500"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                        <span className="text-white">Starred terms only</span>
                        <input
                            type="checkbox"
                            checked={settings.starredOnly}
                            onChange={(e) => setSettings({ ...settings, starredOnly: e.target.checked })}
                            className="w-5 h-5 accent-blue-500"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                        <span className="text-white">Shuffle terms</span>
                        <input
                            type="checkbox"
                            checked={settings.shuffleTerms}
                            onChange={(e) => setSettings({ ...settings, shuffleTerms: e.target.checked })}
                            className="w-5 h-5 accent-blue-500"
                        />
                    </label>
                </div>

                <button
                    onClick={() => setShowSettings(false)}
                    className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium"
                >
                    Apply Settings
                </button>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!learningSet) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Learning Set Not Found</h2>
                    <button onClick={() => router.back()} className="glass-button px-6 py-3 rounded-xl">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const studyItems = getStudyItems();

    // STUDY RESULTS VIEW
    if (showResults && studyResults) {
        const modeMap: Record<string, 'flashcards' | 'multiple-choice' | 'writing' | 'learning' | 'test' | 'match' | 'play'> = {
            'flashcards': 'flashcards',
            'multiple-choice': 'multiple-choice',
            'writing': 'writing',
            'learning': 'learning',
            'test': 'test',
            'match': 'match',
            'play': 'play'
        };

        return (
            <StudyResultsPage
                results={{
                    mode: studyResults.mode as any,
                    totalItems: studyResults.totalItems,
                    correctAnswers: studyResults.correctAnswers,
                    timeSpent: studyResults.timeSpent,
                    date: studyResults.date
                }}
                onStudyAgain={() => {
                    setShowResults(false);
                    const mode = studyResults.mode;
                    if (mode === 'flashcards') startFlashcards();
                    else if (mode === 'multiple-choice') startMultipleChoice();
                    else if (mode === 'writing') startWritingMode();
                    else if (mode === 'learning') startLearningMode();
                    else if (mode === 'test') startTestMode();
                    else if (mode === 'match') startMatchMode();
                }}
                onSelectMode={(mode) => {
                    setShowResults(false);
                    if (mode === 'flashcards') startFlashcards();
                    else if (mode === 'multiple-choice') startMultipleChoice();
                    else if (mode === 'writing') startWritingMode();
                    else if (mode === 'learning') startLearningMode();
                    else if (mode === 'test') startTestMode();
                    else if (mode === 'match') startMatchMode();
                }}
                onExit={() => setShowResults(false)}
            />
        );
    }

    // FLASHCARD VIEW
    if (studyMode === 'flashcards' && studyItems.length > 0) {
        const currentItem = studyItems[currentIndex];

        return (
            <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto relative p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <button
                                onClick={() => setStudyMode(null)}
                                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Exit</span>
                            </button>
                            <div className="text-slate-400">
                                {currentIndex + 1} / {studyItems.length}
                            </div>
                            <button onClick={() => setShowSettings(true)} className="text-slate-400 hover:text-white">
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Flashcard with flip animation */}
                        <div
                            className="perspective-1000 cursor-pointer mb-8"
                            onClick={flipCard}
                        >
                            <div className={`relative transition-transform duration-500 transform-style-3d ${isFlipped && animationStyle === 'flip' ? 'rotate-y-180' : ''}`}
                                style={{ transformStyle: 'preserve-3d', transition: 'transform 0.6s' }}
                            >
                                <div
                                    className={`glass-card p-12 min-h-[350px] flex flex-col items-center justify-center ${isFlipped ? 'opacity-0' : 'opacity-100'}`}
                                    style={{ backfaceVisibility: 'hidden' }}
                                >
                                    <p className="text-slate-400 text-sm mb-4">Term</p>
                                    <h3 className="text-3xl font-bold text-white text-center">{currentItem.term}</h3>
                                    <p className="text-slate-500 text-sm mt-8">Click or press Space to flip</p>
                                </div>

                                {isFlipped && (
                                    <div
                                        className={`glass-card p-12 min-h-[350px] flex flex-col items-center justify-center absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 ${animationStyle === 'flip' ? 'rotate-y-180' : ''}`}
                                    >
                                        <p className="text-blue-400 text-sm mb-4">Definition</p>
                                        <h3 className="text-2xl font-medium text-white text-center">{currentItem.definition}</h3>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setIsFlipped(false); }}
                                disabled={currentIndex === 0}
                                className="glass-button px-6 py-3 rounded-xl disabled:opacity-30 flex items-center gap-2"
                            >
                                <ChevronLeft className="w-4 h-4" /> Previous
                            </button>

                            <button onClick={() => toggleStar(currentItem.id)} className="p-3">
                                <Star className={`w-6 h-6 ${currentItem.starred ? 'fill-yellow-500 text-yellow-500' : 'text-slate-500'}`} />
                            </button>

                            <button
                                onClick={() => { setCurrentIndex(Math.min(studyItems.length - 1, currentIndex + 1)); setIsFlipped(false); }}
                                disabled={currentIndex === studyItems.length - 1}
                                className="glass-button px-6 py-3 rounded-xl disabled:opacity-30 flex items-center gap-2"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </main>
                {showSettings && <SettingsModal />}
            </div>
        );
    }

    // MULTIPLE CHOICE VIEW
    if (studyMode === 'multiple-choice' && studyItems.length > 0) {
        const currentItem = studyItems[currentIndex];
        const question = settings.answerWithTerm ? currentItem.definition : currentItem.term;

        return (
            <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto relative p-8">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <button onClick={() => setStudyMode(null)} className="flex items-center gap-2 text-slate-400 hover:text-white">
                                <ArrowLeft className="w-4 h-4" /> Exit
                            </button>
                            <span className="text-slate-400">{currentIndex + 1} / {studyItems.length}</span>
                            <button onClick={() => setShowSettings(true)} className="text-slate-400 hover:text-white">
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="glass-card p-8 mb-6">
                            <p className="text-slate-400 text-sm mb-2">{settings.answerWithTerm ? 'Definition' : 'Term'}</p>
                            <h2 className="text-2xl font-bold text-white">{question}</h2>
                        </div>

                        <div className="grid gap-3">
                            {mcOptions.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleMCSelect(option)}
                                    disabled={mcResult !== null}
                                    className={`p-4 rounded-xl text-left transition-all ${mcSelected === option
                                        ? mcResult === 'correct'
                                            ? 'bg-green-500/20 border-2 border-green-500 text-green-400'
                                            : 'bg-red-500/20 border-2 border-red-500 text-red-400'
                                        : mcResult && option === (settings.answerWithTerm ? currentItem.term : currentItem.definition)
                                            ? 'bg-green-500/20 border-2 border-green-500 text-green-400'
                                            : 'glass-card hover:bg-white/5'
                                        }`}
                                >
                                    <span className="text-blue-400 mr-3">{String.fromCharCode(65 + idx)}.</span>
                                    <span className="text-white">{option}</span>
                                </button>
                            ))}
                        </div>

                        {mcResult && (
                            <button
                                onClick={nextMCQuestion}
                                disabled={currentIndex === studyItems.length - 1}
                                className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium disabled:opacity-50"
                            >
                                {currentIndex === studyItems.length - 1 ? 'Finished!' : 'Next Question'}
                            </button>
                        )}
                    </div>
                </main>
                {showSettings && <SettingsModal />}
            </div>
        );
    }

    // WRITING MODE VIEW
    if (studyMode === 'writing' && studyItems.length > 0) {
        const currentItem = studyItems[currentIndex];
        const question = settings.answerWithTerm ? currentItem.definition : currentItem.term;
        const correctAnswer = settings.answerWithTerm ? currentItem.term : currentItem.definition;

        return (
            <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto relative p-8">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <button onClick={() => setStudyMode(null)} className="flex items-center gap-2 text-slate-400 hover:text-white">
                                <ArrowLeft className="w-4 h-4" /> Exit
                            </button>
                            <span className="text-slate-400">{currentIndex + 1} / {studyItems.length}</span>
                            <button onClick={() => setShowSettings(true)} className="text-slate-400 hover:text-white">
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="glass-card p-8 mb-6">
                            <p className="text-slate-400 text-sm mb-2">{settings.answerWithTerm ? 'Definition' : 'Term'}</p>
                            <h2 className="text-2xl font-bold text-white">{question}</h2>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        if (writeResult) nextWriteQuestion();
                                        else checkWriteAnswer();
                                    }
                                }}
                                placeholder={`Type the ${settings.answerWithTerm ? 'term' : 'definition'}...`}
                                disabled={writeResult !== null}
                                className={`w-full bg-slate-800/50 border-2 rounded-xl px-4 py-4 text-white text-lg focus:outline-none ${writeResult === 'correct' ? 'border-green-500 bg-green-500/10' :
                                    writeResult === 'wrong' ? 'border-red-500 bg-red-500/10' :
                                        'border-white/10 focus:border-blue-500'
                                    }`}
                                autoFocus
                            />

                            {writeResult === 'wrong' && (
                                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                                    <p className="text-red-400 text-sm mb-1">Correct answer:</p>
                                    <p className="text-white font-medium">{correctAnswer}</p>
                                </div>
                            )}

                            {writeResult ? (
                                <button
                                    onClick={nextWriteQuestion}
                                    disabled={currentIndex === studyItems.length - 1}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium disabled:opacity-50"
                                >
                                    {currentIndex === studyItems.length - 1 ? 'Finished!' : 'Continue (Enter)'}
                                </button>
                            ) : (
                                <button
                                    onClick={checkWriteAnswer}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium"
                                >
                                    Check Answer (Enter)
                                </button>
                            )}
                        </div>
                    </div>
                </main>
                {showSettings && <SettingsModal />}
            </div>
        );
    }

    // LEARNING MODE VIEW (3-step: Review -> MC -> Write if wrong)
    if (studyMode === 'learning' && studyItems.length > 0) {
        const currentItem = studyItems[currentIndex];
        const question = settings.answerWithTerm ? currentItem.definition : currentItem.term;
        const correctAnswer = settings.answerWithTerm ? currentItem.term : currentItem.definition;

        return (
            <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto relative p-8">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <button onClick={() => setStudyMode(null)} className="flex items-center gap-2 text-slate-400 hover:text-white">
                                <ArrowLeft className="w-4 h-4" /> Exit
                            </button>
                            <div className="flex items-center gap-4">
                                <span className="text-slate-400">{currentIndex + 1} / {studyItems.length}</span>
                                <div className="flex gap-1">
                                    {['review', 'mc', 'write'].map((step, i) => (
                                        <div
                                            key={step}
                                            className={`w-2 h-2 rounded-full ${learningStep === step ? 'bg-blue-500' :
                                                i < ['review', 'mc', 'write'].indexOf(learningStep) ? 'bg-green-500' : 'bg-slate-600'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => setShowSettings(true)} className="text-slate-400 hover:text-white">
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Step 1: Review */}
                        {learningStep === 'review' && (
                            <div className="space-y-6">
                                <div className="glass-card p-8 text-center">
                                    <p className="text-slate-400 text-sm mb-2">Term</p>
                                    <h2 className="text-3xl font-bold text-white mb-6">{currentItem.term}</h2>
                                    <div className="h-px bg-white/10 mb-6" />
                                    <p className="text-slate-400 text-sm mb-2">Definition</p>
                                    <p className="text-xl text-slate-200">{currentItem.definition}</p>
                                </div>
                                <button
                                    onClick={nextLearningStep}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-medium text-lg"
                                >
                                    Got it! Quiz me →
                                </button>
                            </div>
                        )}

                        {/* Step 2: Multiple Choice */}
                        {learningStep === 'mc' && (
                            <div className="space-y-6">
                                <div className="glass-card p-8">
                                    <p className="text-slate-400 text-sm mb-2">{settings.answerWithTerm ? 'Definition' : 'Term'}</p>
                                    <h2 className="text-2xl font-bold text-white">{question}</h2>
                                </div>

                                <div className="grid gap-3">
                                    {learningMCOptions.map((option, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => !learningMCResult && handleLearningMC(option)}
                                            disabled={learningMCResult !== null}
                                            className={`p-4 rounded-xl text-left transition-all ${learningMCResult && option === correctAnswer
                                                ? 'bg-green-500/20 border-2 border-green-500 text-green-400'
                                                : learningMCResult === 'wrong' && option !== correctAnswer && learningMCOptions.indexOf(option) === learningMCOptions.findIndex(o => o !== correctAnswer)
                                                    ? 'bg-red-500/20 border-2 border-red-500 text-red-400'
                                                    : 'glass-card hover:bg-white/5'
                                                }`}
                                        >
                                            <span className="text-blue-400 mr-3">{String.fromCharCode(65 + idx)}.</span>
                                            <span className="text-white">{option}</span>
                                        </button>
                                    ))}
                                </div>

                                {learningMCResult && (
                                    <button
                                        onClick={nextLearningStep}
                                        className={`w-full py-4 rounded-xl font-medium text-lg ${learningMCResult === 'correct'
                                            ? 'bg-green-600 hover:bg-green-500 text-white'
                                            : 'bg-orange-600 hover:bg-orange-500 text-white'
                                            }`}
                                    >
                                        {learningMCResult === 'correct' ? 'Continue →' : 'Practice Typing →'}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Step 3: Write (only if MC was wrong) */}
                        {learningStep === 'write' && (
                            <div className="space-y-6">
                                <div className="glass-card p-8">
                                    <p className="text-slate-400 text-sm mb-2">{settings.answerWithTerm ? 'Definition' : 'Term'}</p>
                                    <h2 className="text-2xl font-bold text-white">{question}</h2>
                                </div>

                                <p className="text-orange-400 text-center">Type the correct answer to reinforce your memory:</p>

                                <input
                                    type="text"
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            if (writeResult) nextLearningStep();
                                            else checkWriteAnswer();
                                        }
                                    }}
                                    placeholder={`Type the ${settings.answerWithTerm ? 'term' : 'definition'}...`}
                                    disabled={writeResult !== null}
                                    className={`w-full bg-slate-800/50 border-2 rounded-xl px-4 py-4 text-white text-lg focus:outline-none ${writeResult === 'correct' ? 'border-green-500 bg-green-500/10' :
                                        writeResult === 'wrong' ? 'border-red-500 bg-red-500/10' :
                                            'border-white/10 focus:border-blue-500'
                                        }`}
                                    autoFocus
                                />

                                {writeResult === 'wrong' && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                                        <p className="text-red-400 text-sm mb-1">Correct answer:</p>
                                        <p className="text-white font-medium">{correctAnswer}</p>
                                    </div>
                                )}

                                {writeResult ? (
                                    <button
                                        onClick={nextLearningStep}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-medium text-lg"
                                    >
                                        {currentIndex === studyItems.length - 1 ? 'Finish!' : 'Next Card →'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={checkWriteAnswer}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-medium"
                                    >
                                        Check Answer
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </main>
                {showSettings && <SettingsModal />}
            </div>
        );
    }

    // TEST MODE VIEW
    if (studyMode === 'test') {
        if (testSubmitted) {
            const totalCorrect = Object.values(testResults).filter(Boolean).length;
            const filteredItems = studyItems.filter(item => {
                if (testFilter === 'all') return true;
                if (testFilter === 'correct') return testResults[item.id];
                return !testResults[item.id];
            });

            return (
                <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
                    <Sidebar />
                    <main className="flex-1 overflow-y-auto relative p-8">
                        <div className="max-w-3xl mx-auto">
                            <button onClick={() => setStudyMode(null)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6">
                                <ArrowLeft className="w-4 h-4" /> Exit
                            </button>

                            <div className="glass-card p-6 mb-6 text-center">
                                <h2 className="text-3xl font-bold text-white mb-2">
                                    {totalCorrect} / {studyItems.length}
                                </h2>
                                <p className="text-slate-400">
                                    {Math.round((totalCorrect / studyItems.length) * 100)}% correct
                                </p>
                            </div>

                            <div className="flex gap-2 mb-6">
                                {(['all', 'correct', 'wrong'] as const).map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setTestFilter(filter)}
                                        className={`px-4 py-2 rounded-xl transition-colors ${testFilter === filter ? 'bg-blue-600 text-white' : 'glass-button'
                                            }`}
                                    >
                                        {filter === 'all' ? 'All' : filter === 'correct' ? '✓ Correct' : '✗ Wrong'}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-3">
                                {filteredItems.map(item => (
                                    <div key={item.id} className={`p-4 rounded-xl border-2 ${testResults[item.id] ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
                                        }`}>
                                        <p className="text-slate-400 text-sm">{settings.answerWithTerm ? item.definition : item.term}</p>
                                        <p className="text-white font-medium mt-1">Your answer: {testAnswers[item.id] || '(empty)'}</p>
                                        {!testResults[item.id] && (
                                            <p className="text-green-400 text-sm mt-1">
                                                Correct: {settings.answerWithTerm ? item.term : item.definition}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </main>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto relative p-8">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <button onClick={() => setStudyMode(null)} className="flex items-center gap-2 text-slate-400 hover:text-white">
                                <ArrowLeft className="w-4 h-4" /> Exit
                            </button>
                            <button onClick={() => setShowSettings(true)} className="text-slate-400 hover:text-white">
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-6">Test Mode</h2>

                        <div className="space-y-6">
                            {studyItems.map((item, idx) => (
                                <div key={item.id} className="glass-card p-4">
                                    <p className="text-slate-400 text-sm mb-2">
                                        {idx + 1}. {settings.answerWithTerm ? item.definition : item.term}
                                    </p>
                                    <input
                                        type="text"
                                        value={testAnswers[item.id] || ''}
                                        onChange={(e) => setTestAnswers({ ...testAnswers, [item.id]: e.target.value })}
                                        placeholder="Type your answer..."
                                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={submitTest}
                            className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-medium text-lg"
                        >
                            Submit Test
                        </button>
                    </div>
                </main>
                {showSettings && <SettingsModal />}
            </div>
        );
    }

    // MATCH MODE VIEW
    if (studyMode === 'match') {
        const unmatched = matchPairs.filter(p => !p.matched);
        const isComplete = unmatched.length === 0;

        return (
            <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto relative p-8">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <button onClick={() => setStudyMode(null)} className="flex items-center gap-2 text-slate-400 hover:text-white">
                                <ArrowLeft className="w-4 h-4" /> Exit
                            </button>
                            <span className="text-slate-400">
                                {matchPairs.filter(p => p.matched).length / 2} / {matchPairs.length / 2} matched
                            </span>
                        </div>

                        {isComplete ? (
                            <div className="text-center py-20">
                                <h2 className="text-3xl font-bold text-white mb-4">🎉 Complete!</h2>
                                <button onClick={initializeMatchGame} className="glass-button px-6 py-3 rounded-xl">
                                    Play Again
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h3 className="text-slate-400 text-sm font-medium mb-2">Terms</h3>
                                    {matchPairs.filter(p => p.type === 'term' && !p.matched).map(pair => (
                                        <button
                                            key={pair.id}
                                            onClick={() => handleMatchClick(pair.id)}
                                            className={`w-full p-4 rounded-xl text-left transition-all ${matchWrong.includes(pair.id)
                                                ? 'bg-red-500/20 border-2 border-red-500'
                                                : matchSelected === pair.id
                                                    ? 'bg-blue-500/20 border-2 border-blue-500'
                                                    : 'glass-card hover:bg-white/5'
                                                }`}
                                        >
                                            <span className="text-white">{pair.text}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-slate-400 text-sm font-medium mb-2">Definitions</h3>
                                    {matchPairs.filter(p => p.type === 'definition' && !p.matched).map(pair => (
                                        <button
                                            key={pair.id}
                                            onClick={() => handleMatchClick(pair.id)}
                                            className={`w-full p-4 rounded-xl text-left transition-all ${matchWrong.includes(pair.id)
                                                ? 'bg-red-500/20 border-2 border-red-500'
                                                : matchSelected === pair.id
                                                    ? 'bg-blue-500/20 border-2 border-blue-500'
                                                    : 'glass-card hover:bg-white/5'
                                                }`}
                                        >
                                            <span className="text-white text-sm">{pair.text}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        );
    }


    // PLAY MODE - Game Selection & Games
    if (studyMode === 'play') {
        // Format terms for games
        const gameTerms = items.map(item => ({ id: item.id, term: item.term, definition: item.definition }));

        if (selectedGame === 'blockblast') {
            return <BlockBlastGame onExit={() => { setSelectedGame('menu'); setStudyMode(null); }} terms={gameTerms} />;
        }
        if (selectedGame === 'flappybird') {
            return <FlappyBirdGame onExit={() => { setSelectedGame('menu'); setStudyMode(null); }} terms={gameTerms} />;
        }
        if (selectedGame === 'crossyroad') {
            return <CrossyRoadGame onExit={() => { setSelectedGame('menu'); setStudyMode(null); }} terms={gameTerms} />;
        }

        // Game selection menu
        return (
            <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto relative p-8">
                    <div className="max-w-2xl mx-auto">
                        <button onClick={() => setStudyMode(null)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-8">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>

                        <h1 className="text-3xl font-bold text-white mb-2">Play Mode</h1>
                        <p className="text-slate-400 mb-8">Choose a game to play while learning your terms!</p>

                        <div className="grid gap-4">
                            {/* Block Blast */}
                            <button
                                onClick={() => setSelectedGame('blockblast')}
                                className="glass-card p-6 text-left hover:bg-white/5 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl">
                                        🧱
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">Block Blast</h3>
                                        <p className="text-slate-400 text-sm">Drag tetris-like shapes to fill rows. Answer quiz questions for bonuses!</p>
                                    </div>
                                </div>
                            </button>

                            {/* Flappy Bird */}
                            <button
                                onClick={() => setSelectedGame('flappybird')}
                                className="glass-card p-6 text-left hover:bg-white/5 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-3xl">
                                        🐦
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-yellow-400 transition-colors">Flappy Bird</h3>
                                        <p className="text-slate-400 text-sm">Fly through pipes! Pass question pipes to earn bonus points.</p>
                                    </div>
                                </div>
                            </button>

                            {/* Crossy Road */}
                            <button
                                onClick={() => setSelectedGame('crossyroad')}
                                className="glass-card p-6 text-left hover:bg-white/5 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-3xl">
                                        🐔
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-green-400 transition-colors">Crossy Road</h3>
                                        <p className="text-slate-400 text-sm">Cross the road without getting hit! Answer quizzes for bonus points.</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // DEFAULT VIEW - Study Mode Selection
    return (
        <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto relative p-8">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </button>

                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-white mb-2">{learningSet.title}</h1>
                            {learningSet.description && (
                                <p className="text-slate-400">{learningSet.description}</p>
                            )}
                            <p className="text-slate-500 text-sm mt-2">{items.length} terms</p>
                        </div>

                        {user?.id === learningSet.user_id && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => router.push(`${params.setId}/edit`)}
                                    className="p-3 glass-button rounded-xl"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Study Mode Buttons - 7 modes */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-10">
                        <button onClick={startFlashcards} className="glass-card p-4 hover:bg-white/5 transition-all group text-center">
                            <Layers className="w-6 h-6 text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-white text-sm font-medium">Flashcards</span>
                        </button>

                        <button onClick={startMultipleChoice} className="glass-card p-4 hover:bg-white/5 transition-all group text-center">
                            <ClipboardList className="w-6 h-6 text-green-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-white text-sm font-medium">Multiple Choice</span>
                        </button>

                        <button onClick={startWritingMode} className="glass-card p-4 hover:bg-white/5 transition-all group text-center">
                            <PenTool className="w-6 h-6 text-yellow-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-white text-sm font-medium">Writing</span>
                        </button>

                        <button onClick={startLearningMode} className="glass-card p-4 hover:bg-white/5 transition-all group text-center">
                            <GraduationCap className="w-6 h-6 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-white text-sm font-medium">Learning</span>
                        </button>

                        <button onClick={startTestMode} className="glass-card p-4 hover:bg-white/5 transition-all group text-center">
                            <BookOpen className="w-6 h-6 text-red-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-white text-sm font-medium">Test</span>
                        </button>

                        <button onClick={startPlayMode} className="glass-card p-4 hover:bg-white/5 transition-all group text-center">
                            <Gamepad2 className="w-6 h-6 text-pink-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-white text-sm font-medium">Play</span>
                        </button>

                        <button onClick={startMatchMode} className="glass-card p-4 hover:bg-white/5 transition-all group text-center">
                            <Shuffle className="w-6 h-6 text-orange-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-white text-sm font-medium">Match</span>
                        </button>
                    </div>

                    {/* All Terms List */}
                    <div>
                        <h2 className="text-xl font-bold text-white mb-4">All Terms ({items.length})</h2>
                        {items.length === 0 ? (
                            <div className="glass-card p-8 text-center">
                                <p className="text-slate-400">No terms in this learning set yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <div key={item.id} className="glass-card p-4 flex items-start gap-4">
                                        <span className="text-slate-500 font-mono text-sm w-6">{index + 1}</span>
                                        <div className="flex-1 grid grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="text-slate-400 text-xs mb-1">TERM</h4>
                                                <p className="text-white">{item.term}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-slate-400 text-xs mb-1">DEFINITION</h4>
                                                <p className="text-slate-300">{item.definition}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => toggleStar(item.id)} className="p-1">
                                            <Star className={`w-4 h-4 ${item.starred ? 'fill-yellow-500 text-yellow-500' : 'text-slate-600'}`} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
            {showSettings && <SettingsModal />}
        </div>
    );
}
