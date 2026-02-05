'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical } from 'lucide-react';

import {
    PenTool,
    Sparkles,
    Search,
    Zap,
    Clock,
    TrendingUp,
    Target,
    Brain,
    MoreHorizontal,
    Calendar as CalendarIcon,
    Trophy,
    Mic,
    MicOff,
    Settings,
    X,
    Save,
    RefreshCw,
    Edit2,
    Trash2,
    LayoutGrid
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useUserXP } from '@/contexts/UserXPContext';
import { useUISettings } from '@/contexts/UISettingsContext';
import ErrorLogger from '@/lib/ErrorLogger';
import ProfileMenu from '@/components/ProfileMenu';
import NotificationMenu from '@/components/NotificationMenu';
import ResourceContextMenu from '@/components/ResourceContextMenu';
import ProofOfSuperiority from '@/components/dashboard/ProofOfSuperiority';

// Dynamic Icon Component
const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
    const Icon = (LucideIcons as any)[name] || LucideIcons.Lightbulb;
    return <Icon className={className} />;
};

function DraggableWidget({ id, children, isEnabled, isEditMode }: { id: string, children: React.ReactNode, isEnabled: boolean, isEditMode: boolean }) {
    const dragControls = useDragControls();
    
    if (!isEnabled) return null;

    return (
            <Reorder.Item
                value={id}
                id={id}
                dragControls={dragControls}
                dragListener={false}
                axis="y"
                className={`relative group/widget mb-8 last:mb-0 transition-all duration-300 ${isEditMode ? 'z-10' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileDrag={{ 
                    scale: 1.02, 
                    boxShadow: "0 20px 40px -10px rgb(0 0 0 / 0.5), 0 10px 15px -5px rgb(0 0 0 / 0.3)",
                    zIndex: 100,
                    filter: "brightness(1.05)",
                    cursor: "grabbing",
                    userSelect: "none"
                }}
                transition={{ type: "spring", stiffness: 400, damping: 40 }}
            >
                {/* Dragging Overlay Indicator */}
                {isEditMode && (
                    <>
                        <div className="absolute inset-0 bg-blue-500/5 rounded-[2.5rem] opacity-0 group-active/widget:opacity-100 transition-opacity pointer-events-none border-2 border-blue-500/20 z-0" />
                        
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-40 group-hover/widget:opacity-100 transition-opacity rounded-l-xl z-20" />
                        
                        {/* Drag Handle Indicator */}
                        <div className="absolute -left-1 top-4 bottom-4 w-0.5 bg-blue-500/20 opacity-40 group-hover/widget:opacity-100 transition-opacity rounded-full z-10" />

                        {/* Drag Handle */}
                        <div 
                            onPointerDown={(e) => dragControls.start(e)}
                            className="absolute -left-4 top-1/2 -translate-y-1/2 p-2.5 bg-slate-800 border border-white/10 rounded-xl cursor-grab active:cursor-grabbing opacity-0 group-hover/widget:opacity-100 transition-all hover:bg-slate-700 hover:scale-110 z-30 shadow-2xl group/handle"
                        >
                            <GripVertical className="w-4 h-4 text-slate-400 group-hover/handle:text-blue-400 transition-colors" />
                        </div>
                    </>
                )}

                <div className={isEditMode ? 'select-none opacity-80 scale-[0.98] transition-all pointer-events-auto' : ''}>
                    {children}
                </div>
            </Reorder.Item>
    );
}

export default function Dashboard() {
    const { user, profile, loading } = useAuth();
    const { userXP, xpProgress } = useUserXP();
    const { settings, updateSettings } = useUISettings();
    const router = useRouter();
    const [subjects, setSubjects] = useState<any[]>([]);
    const [localWidgetOrder, setLocalWidgetOrder] = useState<string[]>([]);
    const [isOrderChanged, setIsOrderChanged] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        if (settings.widgetOrder) {
            setLocalWidgetOrder(settings.widgetOrder);
        }
    }, [settings.widgetOrder]);

    // Memoized valid widget order to prevent Reorder.Group from crashing with undefined items
    const validWidgetOrder = useMemo(() => {
        const validIds = ['proof', 'tip', 'subjects', 'review', 'quick-tools', 'upcoming'];
        return localWidgetOrder.filter(id => validIds.includes(id));
    }, [localWidgetOrder]);

    const handleReorder = (newOrder: string[]) => {
        if (!isEditMode) return;
        setLocalWidgetOrder(newOrder);
        setIsOrderChanged(true);
    };

    const saveLayout = async () => {
        try {
            await updateSettings({ widgetOrder: localWidgetOrder });
            setIsOrderChanged(false);
            setIsEditMode(false);
            // Optionally force a refresh of the settings to ensure UI is in sync
        } catch (error) {
            ErrorLogger.error('Failed to save layout', error);
        }
    };
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [reviewItems, setReviewItems] = useState<any[]>([]);
    const [nextTest, setNextTest] = useState<any>(null);
    const [showWidgetManager, setShowWidgetManager] = useState(false);
    const [stats, setStats] = useState({
        streak: 0,
        totalStudyTime: 0,
        completedTasks: 0,
        totalTasks: 0,
        xp: 0,
        level: 1,
        xpProgress: 0
    });
    
    // Tip States
    const defaultTips = [
        "Probeer de Pomodoro-techniek: 25 minuten focus gevolgd door 5 minuten pauze.",
        "Actief herinneren is effectiever dan passief herlezen. Test jezelf regelmatig!",
        "Slaap is essentieel voor geheugenconsolidatie. Zorg voor 7-9 uur slaap.",
        "Leg moeilijke concepten uit aan iemand anders (Feynman-techniek) om je eigen begrip te versterken.",
        "Drink voldoende water tijdens het studeren om je concentratie op peil te houden.",
        "Verdeel je studietijd over meerdere korte sessies in plaats van één lange sessie (spaced repetition).",
        "Maak een duidelijke planning voordat je begint met studeren.",
        "Elimineer afleidingen: zet je telefoon op 'Niet storen'.",
        "Gebruik mindmaps om complexe verbanden tussen onderwerpen visueel te maken.",
        "Beloon jezelf na het voltooien van een moeilijke taak om gemotiveerd te blijven.",
        "Neem korte pauzes om je hersenen rust te geven tussen verschillende onderwerpen door.",
        "Schrijf je doelen voor vandaag op en vink ze af wanneer je ze hebt bereikt.",
        "Studeer in een goed verlichte en geventileerde ruimte voor betere focus.",
        "Gebruik verschillende kleuren in je aantekeningen om belangrijke informatie te markeren.",
        "Gebruik flashcards voor het leren van definities en formules.",
        "Varieer je studieplek om je hersenen alert te houden.",
        "Eet gezonde snacks zoals noten of fruit voor langdurige energie.",
        "Vermijd multitasken; focus op één onderwerp tegelijk voor maximale efficiëntie.",
        "Gebruik ezelsbruggetjes om lastige feiten of reeksen te onthouden.",
        "Start je dag met de moeilijkste taak (Eat that Frog).",
        "Maak samenvattingen in je eigen woorden in plaats van tekst letterlijk over te nemen.",
        "Gebruik de 5-minuten regel: als je geen zin hebt, spreek dan af dat je maar 5 minuten studeert.",
        "Visualiseer wat je leert; maak tekeningen of schema's.",
        "Leer samen met een studiegenoot om elkaar te overhoren en te motiveren.",
        "Zet een timer voor elke deeltaak om je tempo hoog te houden.",
        "Houd je studieplek georganiseerd en vrij van rommel.",
        "Reflecteer aan het einde van de dag op wat je hebt geleerd.",
        "Gebruik de Cornell-methode voor het maken van gestructureerde aantekeningen.",
        "Oefen met oude examens of toetsvragen om aan het vraagtype te wennen.",
        "Blijf fysiek actief; een korte wandeling kan je focus enorm verbeteren.",
        "Stel concrete en haalbare doelen (SMART-doelen).",
        "Gebruik een app om je schermtijd te beperken tijdens het studeren.",
        "Zorg voor een ergonomische zithouding om rug- en nekklachten te voorkomen.",
        "Leer complexe onderwerpen door ze op te delen in kleinere, behapbare stukjes.",
        "Gebruik associaties om nieuwe informatie te koppelen aan wat je al weet.",
        "Schrijf belangrijke formules op post-its en plak ze op plekken waar je vaak komt.",
        "Blijf positief; een groeimindset helpt je om door te zetten bij tegenslag.",
        "DUB5 is er om je te helpen; gebruik de AI-chat voor uitleg of planning!"
    ];

    const [featuredTip, setFeaturedTip] = useState<any>({
        header: "DUB5's Tip",
        content: defaultTips[0],
        xp_amount: 50,
        xp_text: "XP BONUS",
        link_text: "Try it with DUB5",
        link_url: "/ai-chat",
        icon_name: "Lightbulb",
        use_random: true
    });
    
    const [randomTip, setRandomTip] = useState<string>(() => {
        // Persistent randomness: Probeer herhaling te voorkomen met localStorage
        if (typeof window !== 'undefined') {
            const lastTip = localStorage.getItem('last_featured_tip');
            const availableTips = defaultTips.filter(t => t !== lastTip);
            const selected = availableTips[Math.floor(Math.random() * availableTips.length)];
            localStorage.setItem('last_featured_tip', selected);
            return selected;
        }
        return defaultTips[Math.floor(Math.random() * defaultTips.length)];
    });
    const [showAdminEditor, setShowAdminEditor] = useState(false);
    const [editForm, setEditForm] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const tipSaveControllerRef = useRef<AbortController | null>(null);
    const fetchTipsControllerRef = useRef<AbortController | null>(null);
    const fetchDashboardControllerRef = useRef<AbortController | null>(null);
    const subjectDeleteControllerRefs = useRef<Map<string, AbortController>>(new Map());
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [resourceMenu, setResourceMenu] = useState<{ x: number; y: number; resource: any } | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const recognitionRef = useRef<any>(null);

    // Initialize speech recognition
    useEffect(() => {
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            
            const langMap: Record<string, string> = {
                'en': 'en-US',
                'nl': 'nl-NL',
                'de': 'de-DE',
                'fr': 'fr-FR',
                'es': 'es-ES'
            };
            recognitionRef.current.lang = langMap[settings.language] || 'nl-NL';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setSearchQuery(transcript);
                setIsListening(false);
                // Proactively handle voice commands
                handleVoiceCommand(transcript);
            };

            recognitionRef.current.onerror = () => setIsListening(false);
            recognitionRef.current.onend = () => setIsListening(false);
        }
    }, []);

    const handleVoiceCommand = (command: string) => {
        const cmd = command.toLowerCase();
        
        // Navigation commands
        if (cmd.includes('ga naar') || cmd.includes('open')) {
            if (cmd.includes('vakken') || cmd.includes('subjects')) router.push('/subjects');
            if (cmd.includes('kalender') || cmd.includes('calendar')) router.push('/calendar');
            if (cmd.includes('games')) router.push('/games');
            if (cmd.includes('instellingen') || cmd.includes('settings')) router.push('/settings');
            if (cmd.includes('plannen') || cmd.includes('study plans')) router.push('/study-plans');
            if (cmd.includes('notities') || cmd.includes('notes')) router.push('/smart-notes');
            if (cmd.includes('stats') || cmd.includes('statistieken')) router.push('/dashboard/stats');
        }

        // Active Recall & Study Support
        if (cmd.includes('test') || cmd.includes('quiz') || cmd.includes('overhoring')) {
            router.push('/ai-chat?action=quiz');
        }
        
        if (cmd.includes('recall') || cmd.includes('actief herinneren') || cmd.includes('cues') || cmd.includes('vragen')) {
            router.push('/ai-chat?action=recall');
        }

        if (cmd.includes('plan') || cmd.includes('planning') || cmd.includes('rooster')) {
            router.push('/ai-chat?action=plan');
        }
        
        if (cmd.includes('synthese') || cmd.includes('combineer') || cmd.includes('samenvoegen')) {
            router.push('/ai-chat?action=synthesize');
        }

        if (cmd.includes('audio') || cmd.includes('recap') || cmd.includes('luister')) {
            router.push('/ai-audio-recap');
        }

        if (cmd.includes('flashcards') || cmd.includes('leren') || cmd.includes('study')) {
            router.push('/study');
        }

        if (cmd.includes('help') || cmd.includes('uitleg') || cmd.includes('explain') || cmd.includes('help mij')) {
            router.push('/ai-chat');
        }
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            try {
                recognitionRef.current?.start();
                setIsListening(true);
            } catch (err) {
                ErrorLogger.error('Failed to start speech recognition', err);
            }
        }
    };

    // Tip Fetching Logic
    useEffect(() => {
        const tipsController = new AbortController();
        fetchTipsControllerRef.current = tipsController;

        const fetchTips = async () => {
            try {
                // Fetch random tip from pool
                const { data: tips, error: tipsError } = await (supabase.from('dub5_tips') as any)
                    .select('content')
                    .abortSignal(tipsController.signal as any);
                
                if (tipsError) throw tipsError;

                if (tips && tips.length > 0) {
                    const lastTip = typeof window !== 'undefined' ? localStorage.getItem('last_featured_tip') : null;
                    const availableTips = tips.filter((t: any) => t.content !== lastTip);
                    const selected = (availableTips.length > 0 ? availableTips : tips)[Math.floor(Math.random() * (availableTips.length > 0 ? availableTips : tips).length)];
                    
                    setRandomTip(selected.content);
                    if (typeof window !== 'undefined') localStorage.setItem('last_featured_tip', selected.content);
                    console.log('DUB5 Tip selected from DB:', selected.content);
                } else {
                    console.warn('No DUB5 tips found in pool, using default pool');
                    const lastTip = typeof window !== 'undefined' ? localStorage.getItem('last_featured_tip') : null;
                    const availableTips = defaultTips.filter(t => t !== lastTip);
                    const selected = availableTips[Math.floor(Math.random() * availableTips.length)];
                    
                    setRandomTip(selected);
                    if (typeof window !== 'undefined') localStorage.setItem('last_featured_tip', selected);
                    console.log('DUB5 Tip selected from fallback pool:', selected);
                }

                // Fetch featured tip config
                const { data: featured, error: featuredError } = await (supabase.from('dub5_featured_tip') as any)
                    .select('*')
                    .eq('id', 'global')
                    .maybeSingle()
                    .abortSignal(tipsController.signal as any);
                
                if (featuredError) throw featuredError;

                if (featured) {
                    setFeaturedTip(featured);
                    setEditForm(featured);
                } else {
                    // Seed if missing
                    const initialTip = {
                        id: 'global',
                        header: "DUB5's Tip",
                        content: "Try the Pomodoro technique: 25 minutes of focus followed by a 5-minute break. DUB5 can help you track this!",
                        xp_amount: 50,
                        xp_text: "XP BONUS",
                        link_text: "Try it with DUB5",
                        link_url: "/ai-chat",
                        icon_name: "Lightbulb",
                        use_random: true
                    };
                    const { error: insertError } = await (supabase.from('dub5_featured_tip') as any)
                        .insert(initialTip)
                        .abortSignal(tipsController.signal as any);
                    
                    if (insertError) throw insertError;
                    
                    setFeaturedTip(initialTip);
                    setEditForm(initialTip);
                }
            } catch (err: any) {
                if (err.name === 'AbortError' || err.message === 'Fetch is aborted') return;
                ErrorLogger.error('Error fetching tips', err);
            }
        };

        fetchTips();

        return () => {
            tipsController.abort();
            fetchTipsControllerRef.current = null;
        };
    }, []);

    // Tip Admin Realtime Logic
    useEffect(() => {
        // Listen for open-tip-editor event from AdminControls
        const handleOpenEditor = () => {
            setEditForm(featuredTip);
            setShowAdminEditor(true);
        };
        window.addEventListener('open-tip-editor', handleOpenEditor);

        // Subscribe to featured tip changes
        const channel = supabase
            .channel('featured_tip_changes')
            .on('postgres_changes', {
                event: 'UPDATE', 
                schema: 'public', 
                table: 'dub5_featured_tip',
                filter: 'id=eq.global'
            }, (payload) => {
                setFeaturedTip(payload.new);
                if (!showAdminEditor) setEditForm(payload.new);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            window.removeEventListener('open-tip-editor', handleOpenEditor);
        };
    }, [featuredTip, showAdminEditor]);

    const handleSaveFeaturedTip = async () => {
        if (!editForm) return;
        
        tipSaveControllerRef.current?.abort();
        tipSaveControllerRef.current = new AbortController();
        
        setIsSaving(true);
        try {
            const { error } = await (supabase.from('dub5_featured_tip') as any)
                .update({
                    header: editForm.header,
                    content: editForm.content,
                    xp_amount: parseInt(editForm.xp_amount),
                    xp_text: editForm.xp_text,
                    link_text: editForm.link_text,
                    link_url: editForm.link_url,
                    icon_name: editForm.icon_name,
                    use_random: editForm.use_random,
                    updated_at: new Date().toISOString()
                })
                .eq('id', 'global')
                .abortSignal(tipSaveControllerRef.current.signal as any);

            if (error) {
                if (error.name === 'AbortError') return;
                throw error;
            }
            setShowAdminEditor(false);
        } catch (error) {
            ErrorLogger.error('Error saving featured tip', error);
        } finally {
            setIsSaving(false);
            tipSaveControllerRef.current = null;
        }
    };

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            fetchDashboardControllerRef.current?.abort();
            const refreshController = new AbortController();
            fetchDashboardControllerRef.current = refreshController;
            fetchDashboardData(refreshController.signal);
        }
        return () => {
            fetchDashboardControllerRef.current?.abort();
            fetchDashboardControllerRef.current = null;
        };
    }, [user]);

    // Update stats when userXP changes (real-time updates)
    useEffect(() => {
        if (userXP) {
            setStats(prev => ({
                ...prev,
                streak: userXP.current_streak,
                totalStudyTime: userXP.study_minutes, // Show minutes if less than 60, otherwise show hours
                level: userXP.level,
                xp: userXP.total_xp,
                xpProgress: xpProgress || prev.xpProgress,
                completedTasks: userXP.tasks_completed || prev.completedTasks
            }));
        }
    }, [userXP, xpProgress]);

    const fetchDashboardData = async (signal?: AbortSignal) => {
        try {
            const today = new Date().toISOString();

            // Fetch all data in parallel
            const [
                subjectsRes,
                eventsRes,
                reviewsRes,
                _tasksRes,
                sessionsRes,
                completedCountRes,
                totalCountRes,
                xpDataRes,
                nextTestRes
            ] = await Promise.all([
                // Fetch subjects
                (supabase.from('subjects') as any)
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(6)
                    .abortSignal(signal),

                // Fetch upcoming calendar events
                (supabase.from('calendar_events') as any)
                    .select('*')
                    .gte('start_date', today)
                    .order('start_date', { ascending: true })
                    .limit(5)
                    .abortSignal(signal),

                // Fetch review items
                (supabase.from('tasks') as any)
                    .select('*, subjects(title, color)')
                    .eq('user_id', user!.id)
                    .eq('type', 'review')
                    .eq('completed', false)
                    .order('due_date', { ascending: true })
                    .limit(3)
                    .abortSignal(signal),

                // Fetch tasks for stats
                supabase
                    .from('tasks')
                    .select('*')
                    .order('due_date', { ascending: true })
                    .abortSignal(signal as any),

                // Fetch study sessions for stats
                (supabase.from('study_sessions') as any)
                    .select('duration_seconds, created_at')
                    .eq('user_id', user!.id)
                    .abortSignal(signal as any),

                // Count completed tasks
                supabase
                    .from('tasks')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user!.id)
                    .eq('completed', true)
                    .abortSignal(signal as any),

                // Count total tasks
                supabase
                    .from('tasks')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user!.id)
                    .abortSignal(signal as any),

                // Fetch XP data
                (supabase.from('user_xp') as any)
                    .select('study_minutes, current_streak, total_xp, level, tasks_completed')
                    .eq('user_id', user!.id)
                    .single()
                    .abortSignal(signal),

                // Fetch Next Test
                (supabase.from('calendar_events') as any)
                    .select('*, subjects:subject_id(title, color)')
                    .or('title.ilike.%toets%,title.ilike.%test%,title.ilike.%exam%')
                    .gte('start_date', today)
                    .order('start_date', { ascending: true })
                    .limit(1)
                    .maybeSingle()
                    .abortSignal(signal)
            ]);

            // Process subjects with unit counts and study hours
            if (subjectsRes.data) {
                const subjectIds = subjectsRes.data.map((s: any) => s.id);
                
                // Fetch unit counts and study sessions in parallel
                const [unitsRes, sessionsDataRes] = await Promise.all([
                    supabase
                        .from('units')
                        .select('subject_id')
                        .in('subject_id', subjectIds)
                        .abortSignal(signal as any),
                    supabase
                        .from('study_sessions')
                        .select('subject_id, duration_seconds')
                        .in('subject_id', subjectIds)
                        .eq('user_id', user!.id)
                        .abortSignal(signal as any)
                ]);

                const countMap: Record<string, number> = {};
                unitsRes.data?.forEach((u: any) => {
                    countMap[u.subject_id] = (countMap[u.subject_id] || 0) + 1;
                });

                const studyTimeMap: Record<string, number> = {};
                sessionsDataRes.data?.forEach((s: any) => {
                    if (s.subject_id) {
                        studyTimeMap[s.subject_id] = (studyTimeMap[s.subject_id] || 0) + (s.duration_seconds || 0);
                    }
                });

                const subjectsWithStats = subjectsRes.data.map((subject: any) => ({
                    ...subject,
                    unit_count: countMap[subject.id] || 0,
                    study_hours: Math.round((studyTimeMap[subject.id] || 0) / 3600 * 10) / 10 // Rounded to 1 decimal
                }));
                setSubjects(subjectsWithStats);
            }

            if (eventsRes.data) setUpcomingEvents(eventsRes.data);
            if (reviewsRes.data) setReviewItems(reviewsRes.data);
            if (nextTestRes?.data) setNextTest(nextTestRes.data);

            const totalSeconds = sessionsRes.data?.reduce((acc: number, curr: any) => acc + (curr.duration_seconds || 0), 0) || 0;

            const xpData = xpDataRes.data;
            const currentXP = xpData?.total_xp || 0;
            const currentLevel = xpData?.level || 1;
            const tasksCompleted = xpData?.tasks_completed || 0;
            const xpForCurrent = Math.pow(currentLevel - 1, 2) * 100;
            const xpForNext = Math.pow(currentLevel, 2) * 100;
            const progress = xpForNext > xpForCurrent ? ((currentXP - xpForCurrent) / (xpForNext - xpForCurrent)) * 100 : 0;

            setStats({
                streak: userXP?.current_streak || xpData?.current_streak || 0,
                totalStudyTime: userXP?.study_minutes ?? (xpData?.study_minutes || Math.round(totalSeconds / 60)),
                completedTasks: userXP?.tasks_completed || tasksCompleted || completedCountRes.count || 0,
                totalTasks: totalCountRes.count || 0,
                xp: userXP?.total_xp || currentXP,
                level: userXP?.level || currentLevel,
                xpProgress: xpProgress || Math.round(progress)
            });

        } catch (error: any) {
            if (error.name === 'AbortError') return;
            console.error('CRITICAL DASHBOARD ERROR:', error);
            ErrorLogger.error('Error fetching dashboard data', error);
            // Even if there's an error, we should stop the loading state
            setIsLoadingData(false);
        } finally {
            // Only set to false if we didn't already set it in the catch block (though it's safe to set twice)
            setIsLoadingData(false);
        }
    };

    // Filtered data for search
    const filteredSubjects = useMemo(() => {
        if (!searchQuery.trim()) return subjects;
        return subjects.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [subjects, searchQuery]);

    const filteredReviewItems = useMemo(() => {
        if (!searchQuery.trim()) return reviewItems;
        return reviewItems.filter(i => 
            i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.subjects?.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [reviewItems, searchQuery]);

    const filteredEvents = useMemo(() => {
        if (!searchQuery.trim()) return upcomingEvents;
        return upcomingEvents.filter(e => 
            e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [upcomingEvents, searchQuery]);

    const handleMenuClick = (e: React.MouseEvent, subject: any) => {
        e.preventDefault();
        setResourceMenu({ x: e.clientX, y: e.clientY, resource: subject });
    };

    const handleDeleteSubject = async (subject: any) => {
        if (!confirm('Are you sure you want to delete this subject?')) return;

        try {
            subjectDeleteControllerRefs.current.get(subject.id)?.abort();
            const deleteController = new AbortController();
            subjectDeleteControllerRefs.current.set(subject.id, deleteController);

            const { error } = await (supabase.from('subjects') as any)
                .delete()
                .eq('id', subject.id)
                .abortSignal(deleteController.signal as any);

            if (error) {
                if (error.name === 'AbortError') return;
                throw error;
            }
            
            fetchDashboardControllerRef.current?.abort();
            const refreshController = new AbortController();
            fetchDashboardControllerRef.current = refreshController;
            fetchDashboardData(refreshController.signal);
        } catch (error) {
            ErrorLogger.error('Error deleting subject', error);
        } finally {
            subjectDeleteControllerRefs.current.delete(subject.id);
            setResourceMenu(null);
        }
    };

    const menuItems = useMemo(() => {
        if (!resourceMenu) return [];

        return [
            {
                icon: <Edit2 className="w-4 h-4" />,
                label: 'Edit',
                onClick: () => router.push('/subjects')
            },
            {
                icon: <Trash2 className="w-4 h-4" />,
                label: 'Delete',
                onClick: () => handleDeleteSubject(resourceMenu.resource),
                danger: true
            }
        ];
    }, [resourceMenu, router]);

    if (loading || isLoadingData) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="flex-1 flex flex-col p-4 md:p-8 relative">
            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] opacity-50"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto w-full flex-1 flex flex-col">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl md:text-3xl font-serif font-bold text-white">
                            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{user.user_metadata.full_name?.split(' ')[0] || 'Student'}!</span>
                        </h1>
                        {profile?.is_admin && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/50 uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                                Admin
                            </span>
                        )}
                    </div>
                    <p className="text-slate-400 text-sm md:text-base">Let's continue your learning journey</p>
                </div>

                <div className="relative flex-1 md:flex-none flex items-center gap-2">
                    {isEditMode ? (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                            <button
                                onClick={() => {
                                    setLocalWidgetOrder(settings.widgetOrder || []);
                                    setIsOrderChanged(false);
                                    setIsEditMode(false);
                                }}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-full transition-all border border-white/10"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveLayout}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-blue-600/20 group"
                            >
                                <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                Save Layout
                            </button>
                            <button
                                onClick={() => setShowWidgetManager(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-full transition-all border border-white/10 group"
                            >
                                <LayoutGrid className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                                Manage Widgets
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsEditMode(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-bold rounded-full transition-all border border-white/10 group"
                            >
                                <LayoutGrid className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                                Edit Widgets
                            </button>
                        </div>
                    )}
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search or say 'Open Subjects'..."
                            className="bg-slate-800/50 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors w-full md:w-64"
                        />
                    </div>
                    <button
                        onClick={toggleListening}
                        className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800/50 text-slate-400 hover:text-white border border-white/10'}`}
                        title={isListening ? 'Listening...' : 'Voice Search'}
                    >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    <NotificationMenu userId={user.id} />
                    <ProfileMenu />
                </div>
            </header>

            {/* Next Test Widget (If enabled) */}
            {settings?.enabledWidgets?.includes('next-test') && nextTest && (
                <div className="mb-8">
                    <NextTestWidget 
                        test={nextTest} 
                        onClick={() => router.push(`/calendar?event=${nextTest.id}`)} 
                    />
                </div>
            )}

            {/* Stats Grid */}
            {settings?.enabledWidgets?.includes('stats') && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatCard
                        title="Learning Level"
                        value={`Level ${stats.level}`}
                        icon={<Trophy className="w-5 h-5 text-amber-400" />}
                        progress={stats.xpProgress}
                        color="amber"
                    />
                    <StatCard
                        title="Study Streak"
                        value={`${stats.streak} days`}
                        icon={<Zap className="w-5 h-5 text-emerald-400" />}
                        progress={Math.min(stats.streak * 10, 100)}
                        color="emerald"
                    />
                    <StatCard
                        title="Total Study Time"
                        value={stats.totalStudyTime >= 60 
                            ? `${Math.round(stats.totalStudyTime / 60)}h ${stats.totalStudyTime % 60}m`
                            : `${stats.totalStudyTime}m`}
                        icon={<Clock className="w-5 h-5 text-blue-400" />}
                        progress={Math.min(stats.totalStudyTime / 6, 100)} // Progress based on 600 minutes (10 hours)
                        color="blue"
                    />
                    <StatCard
                        title="Tasks Completed"
                        value={`${stats.completedTasks}/${stats.totalTasks}`}
                        icon={<Target className="w-5 h-5 text-purple-400" />}
                        progress={stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}
                        color="purple"
                    />
                </div>
            )}

            <Reorder.Group
                axis="xy"
                values={validWidgetOrder}
                onReorder={handleReorder}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
                {/* Subjects Section */}
                <div className="lg:col-span-2">
                    {validWidgetOrder.map((id) => {
                        if (id === 'proof') {
                            return (
                                <DraggableWidget key={id} id={id} isEnabled={settings?.enabledWidgets?.includes('proof')} isEditMode={isEditMode}>
                                    <ProofOfSuperiority />
                                </DraggableWidget>
                            );
                        }
                        if (id === 'tip') {
                            return (
                                <DraggableWidget key={id} id={id} isEnabled={settings?.enabledWidgets?.includes('tip')} isEditMode={isEditMode}>
                                    <div className="glass-card p-6 border-none bg-gradient-to-r from-blue-600/20 to-purple-600/20 relative overflow-hidden group">
                                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500 ease-linear">
                                                <Sparkles className="w-24 h-24 text-white" />
                                            </div>
                                        <div className="relative flex items-start gap-4">
                                            <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400">
                                                <DynamicIcon name={featuredTip.icon_name} className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-white">{featuredTip.header}</h3>
                                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                                                        +{featuredTip.xp_amount} {featuredTip.xp_text}
                                                    </span>
                                                </div>
                                                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                                                    {featuredTip.use_random 
                                                        ? randomTip 
                                                        : (featuredTip.content || randomTip)
                                                    }
                                                </p>
                                                <button 
                                                    onClick={() => router.push(featuredTip.link_url)}
                                                    className="text-sm font-bold text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors"
                                                >
                                                    {featuredTip.link_text}
                                                    <LucideIcons.TrendingUp className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </DraggableWidget>
                            );
                        }
                        if (id === 'subjects') {
                            return (
                                <DraggableWidget key={id} id={id} isEnabled={settings?.enabledWidgets?.includes('subjects')} isEditMode={isEditMode}>
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold text-white">Your Subjects</h2>
                                        <button
                                            onClick={() => router.push('/subjects')}
                                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            View All
                                        </button>
                                    </div>

                                    {filteredSubjects.length === 0 ? (
                                        <div className="glass-card p-8 text-center">
                                            <p className="text-slate-400 mb-4">{searchQuery ? 'No subjects match your search.' : "You haven't added any subjects yet."}</p>
                                            {!searchQuery && (
                                                <button
                                                    onClick={() => router.push('/subjects')}
                                                    className="glass-button px-6 py-2 rounded-lg"
                                                >
                                                    Add Subject
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="grid md:grid-cols-2 gap-6">
                                            {filteredSubjects.map((subject) => (
                                                <SubjectCard
                                                    key={subject.id}
                                                    title={subject.title}
                                                    chapters={`${subject.unit_count || 0} units`}
                                                    progress={0}
                                                    time={`${subject.study_hours || 0}h studied`}
                                                    streak="0 days"
                                                    color={subject.color || 'blue'}
                                                    onClick={() => router.push(`/subjects/${subject.id}/chapters`)}
                                                    onMenu={(e: any) => handleMenuClick(e, subject)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </DraggableWidget>
                            );
                        }
                        return null;
                    })}
                </div>

                {/* Upcoming Events & Review Section */}
                <div className="space-y-6">
                    {validWidgetOrder.map((id) => {
                        if (id === 'review') {
                            return (
                                <DraggableWidget key={id} id={id} isEnabled={settings?.enabledWidgets?.includes('review')} isEditMode={isEditMode}>
                                    <div className="flex justify-between items-center mb-2">
                                        <h2 className="text-xl font-bold text-white">Recommended for Review</h2>
                                        <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {filteredReviewItems.length === 0 ? (
                                            <div className="glass-card p-6 border-dashed border-white/10 text-center">
                                                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                                                    <Brain className="w-6 h-6 text-blue-400" />
                                                </div>
                                                <p className="text-slate-400 text-sm italic">{searchQuery ? 'No review items match your search.' : "You're all caught up! No items need immediate review."}</p>
                                            </div>
                                        ) : (
                                            filteredReviewItems.map((item) => (
                                                <ReviewCard
                                                    key={item.id}
                                                    title={item.title}
                                                    subject={item.subjects?.title || 'General'}
                                                    dueIn={new Date(item.due_date) < new Date() ? 'Overdue' : 'Due today'}
                                                    color={item.subjects?.color || 'blue'}
                                                    onClick={() => router.push('/study')}
                                                />
                                            ))
                                        )}
                                    </div>
                                </DraggableWidget>
                            );
                        }
                        if (id === 'quick-tools') {
                            return (
                                <DraggableWidget key={id} id={id} isEnabled={settings?.enabledWidgets?.includes('quick-tools')} isEditMode={isEditMode}>
                                    <h2 className="text-xl font-bold text-white mb-4">Quick Tools</h2>
                                    <div className="grid grid-cols-1 gap-4">
                                        <QuickToolCard 
                                            title="AI Writing" 
                                            description="Refine essays & notes"
                                            icon={<PenTool className="w-5 h-5" />}
                                            onClick={() => router.push('/ai-writing')}
                                            color="amber"
                                        />
                                        <QuickToolCard 
                                            title="AI Chat" 
                                            description="Ask anything to DUB5"
                                            icon={<Sparkles className="w-5 h-5" />}
                                            onClick={() => router.push('/ai-chat')}
                                            color="purple"
                                        />
                                    </div>
                                </DraggableWidget>
                            );
                        }
                        if (id === 'upcoming') {
                            return (
                                <DraggableWidget key={id} id={id} isEnabled={settings?.enabledWidgets?.includes('upcoming')} isEditMode={isEditMode}>
                                    <h2 className="text-xl font-bold text-white mb-4">Upcoming Events</h2>
                                    <div className="space-y-4">
                                        {filteredEvents.length === 0 ? (
                                            <div className="glass-card p-6 text-center">
                                                <p className="text-slate-400 text-sm">{searchQuery ? 'No upcoming events match your search.' : 'No upcoming events.'}</p>
                                                {!searchQuery && (
                                                    <button
                                                        onClick={() => router.push('/calendar')}
                                                        className="text-sm text-blue-400 hover:text-blue-300 mt-2"
                                                    >
                                                        View Calendar
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            filteredEvents.map((event) => (
                                                <UpcomingCard
                                                    key={event.id}
                                                    title={event.title}
                                                    subject={event.description || ''}
                                                    date={new Date(event.start_date).toLocaleDateString()}
                                                    time={new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    type="event"
                                                    color={event.color || 'blue'}
                                                />
                                            ))
                                        )}
                                    </div>
                                </DraggableWidget>
                            );
                        }
                        return null;
                    })}
                </div>
            </Reorder.Group>
        </div>

        {/* Widget Manager Modal */}
        {showWidgetManager && (
            <WidgetManager 
                enabledWidgets={settings?.enabledWidgets || []}
                onToggle={(id) => {
                    const currentWidgets = settings?.enabledWidgets || [];
                    const newWidgets = currentWidgets.includes(id)
                        ? currentWidgets.filter(w => w !== id)
                        : [...currentWidgets, id];
                    updateSettings({ enabledWidgets: newWidgets });
                }}
                onClose={() => {
                    setShowWidgetManager(false);
                    // Ensure settings are persisted when closing the manager
                    saveLayout();
                }}
            />
        )}

                {/* Admin Tip Editor Modal */}
                {showAdminEditor && editForm && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative animate-in zoom-in duration-200">
                            <button 
                                onClick={() => setShowAdminEditor(false)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                                    <Settings className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Edit Featured Tip</h2>
                                    <p className="text-slate-400 text-sm">Customize the DUB5 tip element for all users</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Header Text</label>
                                        <input 
                                            type="text"
                                            value={editForm.header}
                                            onChange={(e) => setEditForm({...editForm, header: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Icon Name (Lucide)</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text"
                                                value={editForm.icon_name}
                                                onChange={(e) => setEditForm({...editForm, icon_name: e.target.value})}
                                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                                                placeholder="Lightbulb, Zap, Star..."
                                            />
                                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-white">
                                                <DynamicIcon name={editForm.icon_name} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                    <input 
                                        type="checkbox"
                                        id="use_random"
                                        checked={editForm.use_random}
                                        onChange={(e) => setEditForm({...editForm, use_random: e.target.checked})}
                                        className="w-5 h-5 rounded border-white/10 bg-slate-900 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="use_random" className="text-white font-medium cursor-pointer">
                                        Use a random tip from the pool ({randomTip ? 'Example: ' + randomTip.substring(0, 30) + '...' : 'Loading pool...'})
                                    </label>
                                </div>

                                {!editForm.use_random && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Fixed Content Text</label>
                                        <textarea 
                                            value={editForm.content}
                                            onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                                            rows={3}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all resize-none"
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">XP Amount</label>
                                        <input 
                                            type="number"
                                            value={editForm.xp_amount}
                                            onChange={(e) => setEditForm({...editForm, xp_amount: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">XP Label Text</label>
                                        <input 
                                            type="text"
                                            value={editForm.xp_text}
                                            onChange={(e) => setEditForm({...editForm, xp_text: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Link Button Text</label>
                                        <input 
                                            type="text"
                                            value={editForm.link_text}
                                            onChange={(e) => setEditForm({...editForm, link_text: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Link URL</label>
                                        <input 
                                            type="text"
                                            value={editForm.link_url}
                                            onChange={(e) => setEditForm({...editForm, link_url: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => setShowAdminEditor(false)}
                                        className="flex-1 px-6 py-4 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-bold border border-transparent hover:border-white/10"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveFeaturedTip}
                                        disabled={isSaving}
                                        className="flex-1 px-6 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {resourceMenu && (
                    <ResourceContextMenu
                        items={menuItems}
                        position={resourceMenu}
                        onClose={() => setResourceMenu(null)}
                        resourceType="subject"
                        isGlobal={resourceMenu.resource.is_global}
                        isAdmin={profile?.is_admin || false}
                    />
                )}
            </div>
        );
}

function ReviewCard({ title, subject, dueIn, color, onClick }: any) {
    const colors = {
        cyan: 'border-cyan-500/50 text-cyan-400',
        orange: 'border-orange-500/50 text-orange-400',
        emerald: 'border-emerald-500/50 text-emerald-400',
        purple: 'border-purple-500/50 text-purple-400',
        blue: 'border-blue-500/50 text-blue-400',
    };

    const isOverdue = dueIn === 'Overdue';

    return (
        <div 
            onClick={onClick}
            className={`glass-card p-4 border-l-4 ${colors[color as keyof typeof colors] || colors.blue} hover:bg-white/5 transition-all duration-500 ease-in-out cursor-pointer group`}
        >
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-bold text-sm">{title}</h4>
                        {isOverdue && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 border border-red-500/20 font-bold uppercase tracking-tighter">
                                Active Recall
                            </span>
                        )}
                    </div>
                    <p className="text-slate-400 text-xs">{subject}</p>
                </div>
                <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${isOverdue ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                    {dueIn}
                </div>
            </div>
        </div>
    );
}

function QuickToolCard({ title, description, icon, onClick, color }: any) {
    const colors = {
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20',
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-500 ease-in-out text-left ${colors[color as keyof typeof colors] || colors.blue}`}
        >
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                {icon}
            </div>
            <div>
                <h3 className="font-bold text-sm text-white">{title}</h3>
                <p className="text-xs text-slate-400">{description}</p>
            </div>
        </button>
    );
}

function StatCard({ title, value, icon, progress, color }: { title: string, value: string, icon: React.ReactNode, progress: number, color: string }) {
    const colors = {
        emerald: 'bg-emerald-500',
        blue: 'bg-blue-500',
        purple: 'bg-purple-500',
        amber: 'bg-amber-500',
    };

    return (
        <div className="glass-card p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-slate-400 font-medium text-sm mb-1">{title}</h3>
                    <p className="text-white font-medium">{value}</p>
                </div>
                <div className="p-2 bg-white/5 rounded-lg border border-white/10 group-hover:scale-110 transition-transform duration-300">
                    {icon}
                </div>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${colors[color as keyof typeof colors]} transition-all duration-500 ease-out`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <div className="mt-2 text-right text-xs text-slate-500">{progress}%</div>
        </div>
    );
}

function SubjectCard({ title, chapters, progress, time, streak, color, onClick, onMenu }: any) {
    const colors = {
        cyan: 'border-cyan-500/50',
        orange: 'border-orange-500/50',
        emerald: 'border-emerald-500/50',
        purple: 'border-purple-500/50',
        blue: 'border-blue-500/50',
    };

    const barColors = {
        cyan: 'bg-cyan-500',
        orange: 'bg-orange-500',
        emerald: 'bg-emerald-500',
        purple: 'bg-purple-500',
        blue: 'bg-blue-500',
    };

    return (
        <div
            className={`glass-card p-6 border-l-4 ${colors[color as keyof typeof colors] || colors.blue} hover:bg-white/5 transition-all duration-500 ease-in-out group cursor-pointer relative`}
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
                    <p className="text-slate-400 text-sm">{chapters}</p>
                </div>
                <button
                    className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                    onClick={(e) => {
                        e.stopPropagation();
                        onMenu(e);
                    }}
                >
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>

            <div className="mb-4">
                <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-500">Progress</span>
                    <span className="text-white font-medium">{progress}% complete</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full ${barColors[color as keyof typeof barColors] || barColors.blue} transition-all duration-500 ease-out group-hover:brightness-110`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 mt-4">
                <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{time}</span>
                </div>
                <div className="flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    <span>{streak}</span>
                </div>
            </div>
        </div>
    );
}

function UpcomingCard({ title, subject, date, type }: any) {
    const types = {
        test: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        review: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        deadline: 'bg-red-500/10 text-red-400 border-red-500/20',
        assignment: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        event: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    };

    return (
        <div className="glass-card p-4 flex items-center gap-4 hover:bg-white/5 transition-all duration-500 ease-in-out cursor-pointer">
            <div className="flex-1">
                <h4 className="text-white font-medium mb-1">{title}</h4>
                <p className="text-slate-400 text-sm">{subject}</p>
            </div>
            <div className="text-right">
                <div className={`text-xs px-2 py-1 rounded-full border ${types[type as keyof typeof types] ?? types.event} inline-block mb-1`}>
                    {type}
                </div>
                <div className="text-slate-500 text-xs flex items-center justify-end gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    {date}
                </div>
            </div>
        </div>
    );
}

function NextTestWidget({ test, onClick }: { test: any, onClick: () => void }) {
    if (!test) return null;

    const startDate = new Date(test.start_date);
    const today = new Date();
    const diffTime = Math.abs(startDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const subject = test.subjects || { title: 'General', color: 'blue' };

    return (
        <div 
            onClick={onClick}
            className="glass-card p-6 border-l-4 border-amber-500 hover:bg-white/5 transition-all duration-500 ease-in-out cursor-pointer group relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Target className="w-16 h-16 text-amber-500" />
            </div>
            
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/20 font-bold uppercase tracking-wider">
                            Upcoming Test
                        </span>
                        <span className="text-slate-500 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {diffDays} {diffDays === 1 ? 'day' : 'days'} left
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">
                        {test.title}
                    </h3>
                    <p className="text-slate-400 text-sm flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full bg-${subject.color}-500`}></span>
                        {subject.title}
                    </p>
                </div>
                
                <div className="text-center bg-white/5 rounded-xl p-3 border border-white/10 group-hover:border-amber-500/30 transition-colors">
                    <div className="text-2xl font-bold text-amber-400">{diffDays}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Days</div>
                </div>
            </div>
            
            <div className="mt-4 flex items-center text-xs text-amber-400 font-bold group-hover:gap-2 transition-all">
                <span>View Study Material</span>
                <ChevronRight className="w-3 h-3" />
            </div>
        </div>
    );
}

function WidgetManager({ enabledWidgets, onToggle, onClose }: { enabledWidgets: string[], onToggle: (id: string) => void, onClose: () => void }) {
    const allWidgets = [
        { id: 'stats', name: 'Statistieken', description: 'Streak, XP, Studietijd en Taken' },
        { id: 'tip', name: 'DUB5 Tip', description: 'Dagelijkse studietip van de AI' },
        { id: 'next-test', name: 'Volgende Toets', description: 'Aftelling naar je volgende toets' },
        { id: 'quick-tools', name: 'Snelle Tools', description: 'Directe links naar belangrijke functies' },
        { id: 'subjects', name: 'Vakken', description: 'Overzicht van je actieve vakken' },
        { id: 'upcoming', name: 'Agenda', description: 'Aankomende evenementen en deadlines' },
        { id: 'review', name: 'Herhaling', description: 'Items die je moet herhalen (Active Recall)' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="glass-card w-full max-w-md p-6 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white">Beheer Widgets</h2>
                        <p className="text-slate-400 text-xs">Kies welke widgets je op je dashboard wilt zien</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {allWidgets.map(widget => {
                        const isEnabled = enabledWidgets.includes(widget.id);
                        return (
                            <div 
                                key={widget.id}
                                onClick={() => onToggle(widget.id)}
                                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                                    isEnabled 
                                    ? 'bg-blue-500/10 border-blue-500/30 text-white' 
                                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                                }`}
                            >
                                <div className="flex-1">
                                    <h4 className={`font-bold text-sm ${isEnabled ? 'text-blue-400' : 'text-slate-300 group-hover:text-white'}`}>
                                        {widget.name}
                                    </h4>
                                    <p className="text-[11px] opacity-60">{widget.description}</p>
                                </div>
                                <div className={`w-10 h-5 rounded-full relative transition-colors ${isEnabled ? 'bg-blue-500' : 'bg-slate-700'}`}>
                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isEnabled ? 'right-1' : 'left-1'}`}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button 
                    onClick={onClose}
                    className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20"
                >
                    Opslaan & Sluiten
                </button>
            </div>
        </div>
    );
}

const ChevronRight = LucideIcons.ChevronRight;
