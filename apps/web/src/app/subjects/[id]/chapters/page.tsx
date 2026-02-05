'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, BookOpen, Layers, FileText, Plus, MoreVertical, Brain, FileQuestion, HelpCircle, LayoutGrid, List, TrendingUp, Target, Award, Book, Edit2, Trash2, Eye } from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts';
import UniversalAddModal from '@/components/UniversalAddModal';
import BookManagerModal, { Book as BookType } from '@/components/BookManagerModal';
import ResourceMenu from '@/components/ResourceMenu';

const MOCK_BOOKS: BookType[] = [
  { id: '1', title: 'Mathematics Vol. 1', author: 'Dr. Smith', coverColor: 'bg-blue-500' },
  { id: '2', title: 'Mathematics Vol. 2', author: 'Dr. Smith', coverColor: 'bg-indigo-500' },
  { id: '3', title: 'Geometry Essentials', author: 'Prof. Johnson', coverColor: 'bg-emerald-500' },
  { id: '4', title: 'Algebra Advanced', author: 'Prof. Williams', coverColor: 'bg-purple-500' },
  { id: '5', title: 'Calculus Intro', author: 'Dr. Brown', coverColor: 'bg-rose-500' },
  { id: '6', title: 'Statistics 101', author: 'Prof. Davis', coverColor: 'bg-orange-500' },
];

type Unit = {
  id: string;
  title: string;
  order_index: number;
  created_at: string;
};

type Paragraph = {
  id: string;
  unit_id: string;
  title: string;
  order_index: number;
};

export default function SubjectChaptersPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id as string;

  const [units, setUnits] = useState<Unit[]>([]);
  const [subject, setSubject] = useState<{ id: string; title: string; color?: string; description?: string } | null>(null);
  const [paragraphsByUnit, setParagraphsByUnit] = useState<Record<string, Paragraph[]>>({});
  const [loading, setLoading] = useState(true);
  const [masteryData, setMasteryData] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [subjectStats, setSubjectStats] = useState({
    completion: 0,
    perfectQuizzes: 0,
    timeInvested: 0,
    readinessScore: 0
  });
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [showAddContentMenu, setShowAddContentMenu] = useState<{ paraId: string; unitId: string; x: number; y: number } | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [viewMode, setViewMode] = useState<'subject' | 'chapters' | 'paragraphs'>('chapters');
  const [editingUnit, setEditingUnit] = useState<{ id: string; title: string } | null>(null);
  const [editingParagraph, setEditingParagraph] = useState<{ id: string; title: string } | null>(null);

  // Universal Add & Books
  const [showUniversalAdd, setShowUniversalAdd] = useState(false);
  const [showBookManager, setShowBookManager] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);

  const fetchDataControllerRef = useRef<AbortController | null>(null);
  const addUnitControllerRef = useRef<AbortController | null>(null);

  const fetchData = async (signal?: AbortSignal) => {
    setLoading(true);

    try {
      // Fetch subject details and units in parallel
      const [subjectRes, unitsRes] = await Promise.all([
        (supabase.from('subjects') as any)
          .select('*')
          .eq('id', subjectId)
          .abortSignal(signal)
          .single(),
        (supabase.from('units') as any)
          .select('*')
          .eq('subject_id', subjectId)
          .order('order_index', { ascending: true })
          .abortSignal(signal)
      ]);

      if (subjectRes.error && subjectRes.error.name !== 'AbortError') {
        console.error('Error fetching subject:', subjectRes.error);
      }
      if (subjectRes.data) {
        setSubject(subjectRes.data);
      }

      const unitsData = unitsRes.data || [];
      setUnits(unitsData);

      if (unitsData.length > 0) {
        const unitIds = unitsData.map((u: Unit) => u.id);
        const { data: paras, error: parasError } = await (supabase.from('paragraphs') as any)
          .select('*')
          .in('unit_id', unitIds)
          .order('order_index', { ascending: true })
          .abortSignal(signal);

        if (parasError) {
          if (parasError.name === 'AbortError') return;
          console.error('Error fetching paragraphs:', parasError);
        }

        const map: Record<string, Paragraph[]> = {};
        (paras || []).forEach((p: Paragraph) => {
          if (!map[p.unit_id]) map[p.unit_id] = [];
          map[p.unit_id].push(p);
        });
        setParagraphsByUnit(map);
        
        // Fetch stats for the subject
        await fetchSubjectStats(unitsData, paras || [], signal);
      } else {
        setParagraphsByUnit({});
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error in fetchData:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectStats = async (unitsList: Unit[], parasList: Paragraph[], signal?: AbortSignal) => {
    try {
      const unitIds = unitsList.map(u => u.id);
      
      // 1. Fetch all quizzes for these units
      const { data: quizzes, error: quizError } = await (supabase.from('quizzes') as any)
        .select('id, unit_id')
        .in('unit_id', unitIds)
        .abortSignal(signal);
        
      if (quizError) {
        if (quizError.name === 'AbortError') return;
        throw quizError;
      }

      if (!quizzes || quizzes.length === 0) {
        // Fallback mock data if no real data exists yet
        setMasteryData(unitsList.map(u => ({
          subject: u.title.length > 15 ? u.title.substring(0, 12) + '...' : u.title,
          A: 0,
          fullMark: 100,
        })));
        return;
      }

      const quizIds = quizzes.map((q: any) => q.id);

      // 2. Fetch study results for these quizzes
      const { data: results, error: resultsError } = await (supabase.from('study_results') as any)
        .select('*')
        .in('learning_set_id', quizIds)
        .order('completed_at', { ascending: true })
        .abortSignal(signal);

      if (resultsError) {
        if (resultsError.name === 'AbortError') return;
        throw resultsError;
      }

      if (!results || results.length === 0) {
        setMasteryData(unitsList.map(u => ({
          subject: u.title.length > 15 ? u.title.substring(0, 12) + '...' : u.title,
          A: 0,
          fullMark: 100,
        })));
        return;
      }

      // 3. Aggregate Mastery by Unit
      const unitMastery: Record<string, number[]> = {};
      results.forEach((r: any) => {
        const quiz = quizzes.find((q: any) => q.id === r.learning_set_id);
        if (quiz) {
          if (!unitMastery[quiz.unit_id]) unitMastery[quiz.unit_id] = [];
          unitMastery[quiz.unit_id].push(r.score);
        }
      });

      const masteryArr = unitsList.map(u => ({
        subject: u.title.length > 15 ? u.title.substring(0, 12) + '...' : u.title,
        A: unitMastery[u.id] 
          ? Math.round(unitMastery[u.id].reduce((a, b) => a + b, 0) / unitMastery[u.id].length)
          : 0,
        fullMark: 100,
      }));
      setMasteryData(masteryArr);

      // 4. Aggregate Activity by Day (last 7 days)
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          day: days[d.getDay()],
          dateStr: d.toISOString().split('T')[0],
          sessions: 0
        };
      });

      results.forEach((r: any) => {
        const dateStr = r.completed_at.split('T')[0];
        const dayObj = last7Days.find(d => d.dateStr === dateStr);
        if (dayObj) dayObj.sessions++;
      });

      setActivityData(last7Days);

      // 5. Subject Goals & Predictive Readiness
      const perfectQuizzes = results.filter((r: any) => r.score === 100).length;
      
      // Fetch actual study sessions for this subject
      const { data: sessions, error: sessionsError } = await supabase
        .from('study_sessions')
        .select('duration_seconds')
        .eq('subject_id', subjectId)
        .abortSignal(signal);

      if (sessionsError && sessionsError.name !== 'AbortError') {
        ErrorLogger.error('Error fetching study sessions for subject', sessionsError);
      }

      const totalTime = sessions?.reduce((acc: number, s: any) => acc + (s.duration_seconds || 0), 0) || 0;
      const completionRate = parasList.length > 0 ? Math.round((results.length / (parasList.length * 2)) * 100) : 0; // Rough estimate

      // Calculate Readiness Score (0-100)
      // Factors: Average Score (50%), Completion (30%), Recent Activity (10%), Mastery Consistency (10%)
      const avgScore = results.length > 0 ? results.reduce((acc: number, r: any) => acc + r.score, 0) / results.length : 0;
      const recentActivityBonus = Math.min(last7Days.filter(d => d.sessions > 0).length * 2, 10);
      
      const unitMasteryValues = Object.values(unitMastery).map(scores => scores.reduce((a, b) => a + b, 0) / scores.length);
      const masteryConsistency = unitMasteryValues.length > 0 
        ? 10 - (Math.max(...unitMasteryValues) - Math.min(...unitMasteryValues)) / 10
        : 0;

      const calculatedReadiness = (avgScore * 0.5) + (Math.min(completionRate, 100) * 0.3) + recentActivityBonus + Math.max(0, masteryConsistency);

      setSubjectStats({
        completion: Math.min(completionRate, 100),
        perfectQuizzes,
        timeInvested: Math.round(totalTime / 3600), // hours
        readinessScore: Math.round(Math.min(calculatedReadiness, 100))
      });

    } catch (err) {
      console.error('Error fetching subject stats:', err);
    }
  };

  useEffect(() => {
    fetchDataControllerRef.current?.abort();
    const controller = new AbortController();
    fetchDataControllerRef.current = controller;
    fetchData(controller.signal);
    return () => {
      fetchDataControllerRef.current?.abort();
      fetchDataControllerRef.current = null;
      addUnitControllerRef.current?.abort();
    };
  }, [subjectId]);

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      addUnitControllerRef.current?.abort();
      const controller = new AbortController();
      addUnitControllerRef.current = controller;

      const { error } = await (supabase.from('units') as any).insert([
        {
          subject_id: subjectId,
          title: newTitle,
          order_index: units.length,
        }
      ]).abortSignal(controller.signal as any);

      if (error) {
        if (error.name === 'AbortError') return;
        throw error;
      }

      setNewTitle('');
      setShowAddUnitModal(false);
      
      fetchDataControllerRef.current?.abort();
      const fetchController = new AbortController();
      fetchDataControllerRef.current = fetchController;
      fetchData(fetchController.signal);
    } catch (error) {
      console.error('Error adding unit:', error);
    } finally {
      addUnitControllerRef.current = null;
    }
  };

  const handleAddContent = (type: 'document' | 'learning_set' | 'quiz') => {
    if (!showAddContentMenu) return;
    const { paraId, unitId } = showAddContentMenu;

    switch (type) {
      case 'document':
        router.push(`/subjects/${subjectId}/chapters/${unitId}/paragraphs/${paraId}/documents?action=new`);
        break;
      case 'learning_set':
        router.push(`/subjects/${subjectId}/chapters/${unitId}/paragraphs/${paraId}/learning-sets?action=new`);
        break;
      case 'quiz':
        router.push(`/subjects/${subjectId}/chapters/${unitId}/paragraphs/${paraId}/quizzes?action=new`);
        break;
    }
    setShowAddContentMenu(null);
  };

  const handleRenameUnit = async (unitId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('units')
        .update({ title: newTitle })
        .eq('id', unitId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error renaming unit:', error);
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm('Are you sure you want to delete this chapter? This will delete all paragraphs and content inside.')) return;
    try {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', unitId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting unit:', error);
    }
  };

  const handleRenameParagraph = async (paraId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('paragraphs')
        .update({ title: newTitle })
        .eq('id', paraId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error renaming paragraph:', error);
    }
  };

  const handleDeleteParagraph = async (paraId: string) => {
    if (!confirm('Are you sure you want to delete this paragraph? This will delete all content inside.')) return;
    try {
      const { error } = await supabase
        .from('paragraphs')
        .delete()
        .eq('id', paraId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting paragraph:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const allParagraphs = Object.values(paragraphsByUnit).flat();

  return (
    <div className="h-full p-8 relative overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.push('/subjects')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Subjects</span>
          </button>

          <button
            onClick={() => setShowBookManager(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors border border-white/10 ml-4"
          >
            <Book className="w-4 h-4" />
            <span>Manage Books</span>
          </button>

          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 ml-auto">
            <button
              onClick={() => setViewMode('subject')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'subject' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              <BookOpen className="w-4 h-4" />
              Subject
            </button>
            <button
              onClick={() => setViewMode('chapters')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'chapters' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              <LayoutGrid className="w-4 h-4" />
              Chapters
            </button>
            <button
              onClick={() => setViewMode('paragraphs')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'paragraphs' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              <List className="w-4 h-4" />
              Paragraphs
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-serif font-bold text-white">
                {viewMode === 'subject' ? (subject?.title || 'Subject Overview') : viewMode === 'chapters' ? 'Chapters' : 'All Paragraphs'}
              </h1>
            </div>
            <p className="text-slate-400">
              {viewMode === 'subject' ? 'Overview and statistics for this subject' : viewMode === 'chapters' ? 'Browse units and paragraphs for this subject' : `Showing all ${allParagraphs.length} paragraphs in this subject`}
            </p>
          </div>
          {viewMode === 'chapters' && (
            <button
              onClick={() => setShowUniversalAdd(true)}
              className="glass-button px-4 py-2 rounded-xl flex items-center gap-2 bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>Add New</span>
            </button>
          )}
        </div>

        {selectedBookIds.length > 0 && viewMode === 'subject' && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Book className="w-5 h-5 text-blue-400" />
              Selected Books
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {MOCK_BOOKS.filter(b => selectedBookIds.includes(b.id)).map(book => (
                <div key={book.id} className="glass-card p-4 border border-white/5 flex flex-col items-center text-center group hover:bg-white/5 transition-colors">
                  <div className={`w-12 h-16 rounded mb-3 shadow-lg ${book.coverColor} flex items-center justify-center`}>
                    <Book className="w-5 h-5 text-white/50" />
                  </div>
                  <div className="text-sm font-medium text-white truncate w-full">{book.title}</div>
                  <div className="text-xs text-slate-500">{book.author}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'subject' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Info & Activity */}
            <div className="lg:col-span-2 space-y-8">
              <div className="glass-card p-8 border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Brain className="w-24 h-24 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-400" />
                  About this Subject
                </h2>
                <p className="text-slate-400 leading-relaxed relative z-10">
                  {subject?.description || 'No description available for this subject yet. Add one to help organize your learning goals.'}
                </p>
                <div className="mt-8 flex gap-4">
                  <div className="flex-1 glass-card p-4 bg-white/5 border-white/10">
                    <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Chapters</div>
                    <div className="text-2xl font-bold text-white">{units.length}</div>
                  </div>
                </div>
              </div>

              {/* Activity Heatmap (Simplified) */}
              <div className="glass-card p-8 border border-white/5">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    Learning Velocity
                  </h3>
                  <span className="text-xs text-slate-500">Last 7 days</span>
                </div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData}>
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      />
                      <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
                        {activityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.sessions > 7 ? '#3b82f6' : '#6366f1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right Column: Mastery & Goals */}
            <div className="space-y-8">
              {/* Predictive Readiness Card */}
              <div className="glass-card p-6 border border-white/5 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Brain className="w-20 h-20 text-purple-500" />
                </div>
                
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-400" />
                  Predictive Readiness
                </h3>
                
                <div className="flex items-end gap-3 mb-6">
                  <div className="text-5xl font-serif font-bold text-white tracking-tighter">
                    {subjectStats.readinessScore}%
                  </div>
                  <div className="text-sm text-slate-400 mb-1.5 font-medium">
                    {subjectStats.readinessScore > 80 ? 'Exam Ready' : subjectStats.readinessScore > 50 ? 'Gaining Ground' : 'Early Stages'}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(139,92,246,0.5)] ${
                        subjectStats.readinessScore > 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 
                        subjectStats.readinessScore > 50 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 
                        'bg-gradient-to-r from-orange-500 to-rose-500'
                      }`}
                      style={{ width: `${subjectStats.readinessScore}%` }} 
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Our DUB5 AI analyzes your quiz trends, syllabus coverage, and mastery consistency to predict your exam preparedness.
                  </p>
                </div>
              </div>

              {/* Radar Chart: Mastery Radar */}
              <div className="glass-card p-6 border border-white/5 flex flex-col items-center">
                <h3 className="text-lg font-bold text-white mb-6 self-start flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  Mastery Radar
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={masteryData}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 100]} 
                        tick={false}
                        axisLine={false}
                      />
                      <Radar
                        name="Mastery"
                        dataKey="A"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-slate-500 text-center mt-4 uppercase tracking-widest font-bold">
                  Based on quiz performance & active recall
                </p>
              </div>

              {/* Progress Card */}
              <div className="glass-card p-6 border border-white/5">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Subject Goals
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400 font-medium">Syllabus Completion</span>
                      <span className="text-blue-400 font-bold">{subjectStats.completion}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000" style={{ width: `${subjectStats.completion}%` }} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{subjectStats.perfectQuizzes}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Perfect Quizzes</div>
                    </div>
                    <div className="text-center border-l border-white/5">
                      <div className="text-2xl font-bold text-white">{subjectStats.timeInvested}h</div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Time Invested</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : viewMode === 'chapters' ? (
          units.length === 0 ? (
            <div className="glass-card p-12 text-center border border-white/5">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Layers className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-white font-bold mb-2">No chapters yet</h3>
              <p className="text-slate-500 mb-6">Start by adding your first chapter to organize your learning.</p>
              <button
                onClick={() => setShowAddUnitModal(true)}
                className="glass-button px-6 py-2 rounded-xl"
              >
                Create Chapter
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {units.map((unit) => (
                <div key={unit.id} className="glass-card overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-300">
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => router.push(`/subjects/${subjectId}/chapters/${unit.id}/paragraphs`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        {editingUnit && editingUnit.id === unit.id ? (
                          <input
                            type="text"
                            value={editingUnit.title}
                            onChange={(e) => setEditingUnit({ ...editingUnit, title: e.target.value })}
                            onBlur={() => {
                              if (editingUnit.title !== unit.title) {
                                handleRenameUnit(unit.id, editingUnit.title);
                              }
                              setEditingUnit(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (editingUnit.title !== unit.title) {
                                  handleRenameUnit(unit.id, editingUnit.title);
                                }
                                setEditingUnit(null);
                              }
                              if (e.key === 'Escape') setEditingUnit(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white font-bold text-lg focus:outline-none focus:border-blue-500"
                          />
                        ) : (
                          <h3 className="text-white font-bold text-lg">{unit.title}</h3>
                        )}
                        <p className="text-slate-500 text-xs">{(paragraphsByUnit[unit.id] || []).length} paragraphs</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ResourceMenu 
                        title="Chapter Actions"
                        actions={[
                          {
                            label: 'View Paragraphs',
                            icon: Eye,
                            onClick: () => router.push(`/subjects/${subjectId}/chapters/${unit.id}/paragraphs`)
                          },
                          {
                            label: 'Rename',
                            icon: Edit2,
                            onClick: () => setEditingUnit({ id: unit.id, title: unit.title })
                          },
                          {
                            label: 'Delete',
                            icon: Trash2,
                            onClick: () => handleDeleteUnit(unit.id),
                            variant: 'danger'
                          }
                        ]}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allParagraphs.length === 0 ? (
              <div className="col-span-full glass-card p-12 text-center">
                <p className="text-slate-400">No paragraphs found.</p>
              </div>
            ) : (
              allParagraphs.map((para) => (
                <div
                  key={para.id}
                  onClick={() => router.push(`/subjects/${subjectId}/chapters/${para.unit_id}/paragraphs/${para.id}/documents`)}
                  className="group p-5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col gap-4 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-300 border border-white/5 group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setShowAddContentMenu({
                            paraId: para.id,
                            unitId: para.unit_id,
                            x: rect.left - 180,
                            y: rect.bottom + 8
                          });
                        }}
                        className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-transparent hover:border-white/10"
                        title="Add Content"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <ResourceMenu 
                        title="Paragraph Actions"
                        actions={[
                          {
                            label: 'View Documents',
                            icon: Eye,
                            onClick: () => router.push(`/subjects/${subjectId}/chapters/${para.unit_id}/paragraphs/${para.id}/documents`)
                          },
                          {
                            label: 'Rename',
                            icon: Edit2,
                            onClick: () => setEditingParagraph({ id: para.id, title: para.title })
                          },
                          {
                            label: 'Delete',
                            icon: Trash2,
                            onClick: () => handleDeleteParagraph(para.id),
                            variant: 'danger'
                          }
                        ]}
                      />
                    </div>
                  </div>
                  <div>
                    {editingParagraph && editingParagraph.id === para.id ? (
                      <input
                        type="text"
                        value={editingParagraph.title}
                        onChange={(e) => setEditingParagraph({ ...editingParagraph, title: e.target.value })}
                        onBlur={() => {
                          if (editingParagraph.title !== para.title) {
                            handleRenameParagraph(para.id, editingParagraph.title);
                          }
                          setEditingParagraph(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editingParagraph.title !== para.title) {
                              handleRenameParagraph(para.id, editingParagraph.title);
                            }
                            setEditingParagraph(null);
                          }
                          if (e.key === 'Escape') setEditingParagraph(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="w-full bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white font-medium focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <h3 className="text-white font-medium group-hover:text-blue-400 transition-colors">{para.title}</h3>
                    )}
                    <p className="text-slate-500 text-xs mt-1">
                      Part of {units.find(u => u.id === para.unit_id)?.title}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Add Unit Modal */}
        {showAddUnitModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="glass-card p-8 w-full max-w-md relative animate-in fade-in zoom-in duration-200">
              <h2 className="text-2xl font-bold text-white mb-6">Add New Chapter</h2>
              <form onSubmit={handleAddUnit}>
                <div className="mb-6">
                  <label className="block text-slate-400 text-sm mb-2 font-medium">Chapter Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="e.g. Introduction to Calculus"
                    autoFocus
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => { setShowAddUnitModal(false); setNewTitle(''); }}
                    className="flex-1 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 glass-button rounded-xl font-bold"
                  >
                    Create Chapter
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Content Menu */}
        {showAddContentMenu && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setShowAddContentMenu(null)} />
            <div
              className="fixed z-[101] glass-card p-2 w-56 border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
              style={{ top: showAddContentMenu.y, left: showAddContentMenu.x }}
            >
              <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-white/5 mb-1">
                Add Content
              </div>
              <button
                onClick={() => handleAddContent('document')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-sm">Smart Notes</span>
              </button>
              <button
                onClick={() => handleAddContent('learning_set')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-sm">Learning Set</span>
              </button>
              <button
                onClick={() => handleAddContent('quiz')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <FileQuestion className="w-4 h-4 text-orange-400" />
                <span className="text-sm">Quiz</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Universal Add Modal */}
      <UniversalAddModal 
        isOpen={showUniversalAdd}
        onClose={() => setShowUniversalAdd(false)}
        onAddChapter={() => {
          setShowUniversalAdd(false);
          setShowAddUnitModal(true);
        }}
        onAddParagraph={() => {
          // In a real app, we might ask which unit to add to
          alert('To add a paragraph, please go to a specific chapter or select "Manage Structure".');
          setShowUniversalAdd(false);
        }}
        onAddContent={(type) => {
          alert('To add content, please navigate to a specific paragraph.');
          setShowUniversalAdd(false);
        }}
      />

      {/* Book Manager Modal */}
      <BookManagerModal
        isOpen={showBookManager}
        onClose={() => setShowBookManager(false)}
        books={MOCK_BOOKS}
        selectedBookIds={selectedBookIds}
        onToggleBook={(id) => {
          setSelectedBookIds(prev => 
            prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]
          );
        }}
      />
    </div>
  );
}
