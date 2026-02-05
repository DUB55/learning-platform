 'use client';
 
 import { useState } from 'react';
 import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Sparkles, Target, BookOpen, Clock, RefreshCw, PlusCircle } from 'lucide-react';
import { generateLearningPath, adjustLearningPath, suggestResources, addResource } from '@/app/actions/aiPaths';

type StepView = {
   title: string;
   description: string;
   duration_minutes: number;
   mode: 'flashcards' | 'practice' | 'reading' | 'video' | 'project';
   topic: string;
 };
 
 export default function AIPathsPage() {
   const { user, updateXP } = useAuth();
   const router = useRouter();
   const [goal, setGoal] = useState('');
   const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
   const [style, setStyle] = useState<'visual' | 'auditory' | 'hands_on' | 'reading'>('visual');
   const [hours, setHours] = useState<number>(5);
   const [loading, setLoading] = useState(false);
   const [planId, setPlanId] = useState<string | null>(null);
   const [steps, setSteps] = useState<StepView[]>([]);
   const [suggestingFor, setSuggestingFor] = useState<string | null>(null);
   const [suggestions, setSuggestions] = useState<Record<string, Array<{ title: string; url: string; type: string }>>>({});
 
   const handleGenerate = async () => {
     if (!user || !goal.trim()) return;
     setLoading(true);
     const res = await generateLearningPath({
       userId: user.id,
       goal,
       currentLevel: level,
       learningStyle: style,
       hoursPerWeek: hours
     });
     if (res.success) {
      setPlanId(res.planId || null);
      setSteps(res.steps || []);
      
      // Award XP for generating a learning path
      await updateXP(50, 'Generated a personalized AI learning path');
      
      try {
        if (res.planId) {
          const local = JSON.parse(localStorage.getItem('local_study_plans') || '[]');
          const entry = { id: res.planId, title: goal, createdAt: new Date().toISOString() };
          local.unshift(entry);
          localStorage.setItem('local_study_plans', JSON.stringify(local.slice(0, 20)));
        }
      } catch {}
     }
     setLoading(false);
   };
 
   const handleAdjust = async () => {
     if (!planId || !user) return;
     setLoading(true);
     await adjustLearningPath(planId, user.id);
     setLoading(false);
     router.push(`/study-plans/${planId}`);
   };
 
   const handleSuggestResources = async (topic: string) => {
     if (!user) return;
     setSuggestingFor(topic);
     const res = await suggestResources(user.id, topic);
     if (res.success && res.suggestions) {
       setSuggestions(prev => ({ ...prev, [topic]: res.suggestions! }));
     }
     setSuggestingFor(null);
   };
 
   const handleAddResource = async (s: { title: string; url: string; type: string }) => {
     if (!user) return;
     await addResource(user.id, s);
   };
 
  return (
    <div className="h-full p-8">
       <div className="max-w-5xl mx-auto">
         <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 border border-purple-500/20 flex items-center justify-center shadow-lg shadow-purple-600/20">
               <Sparkles className="w-6 h-6 text-white" />
             </div>
             <div>
               <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">AI Learning Paths</h1>
               <p className="text-slate-400">Generate and adapt personalized study journeys</p>
             </div>
           </div>
           <button
             onClick={() => planId ? router.push(`/study-plans/${planId}`) : router.push('/study-plans')}
             className="glass-button px-4 py-2 rounded-xl flex items-center gap-2"
           >
             <BookOpen className="w-5 h-5" />
             <span>Open Study Plans</span>
           </button>
         </div>
 
         <div className="glass-card p-6 mb-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <label className="text-xs text-slate-400">Learning Goal</label>
               <input
                 value={goal}
                 onChange={(e) => setGoal(e.target.value)}
                 placeholder="e.g., Learn Python for Data Science"
                 className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500"
               />
             </div>
             <div>
               <label className="text-xs text-slate-400">Current Level</label>
               <select
                 value={level}
                 onChange={(e) => setLevel(e.target.value as any)}
                 className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500"
               >
                 <option value="beginner">Beginner</option>
                 <option value="intermediate">Intermediate</option>
                 <option value="advanced">Advanced</option>
               </select>
             </div>
             <div>
               <label className="text-xs text-slate-400">Preferred Style</label>
               <select
                 value={style}
                 onChange={(e) => setStyle(e.target.value as any)}
                 className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500"
               >
                 <option value="visual">Visual</option>
                 <option value="auditory">Auditory</option>
                 <option value="hands_on">Hands-on</option>
                 <option value="reading">Reading</option>
               </select>
             </div>
             <div>
               <label className="text-xs text-slate-400">Hours per week</label>
               <input
                 type="number"
                 min={1}
                 max={40}
                 value={hours}
                 onChange={(e) => setHours(parseInt(e.target.value || '5'))}
                 className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500"
               />
             </div>
           </div>
           <div className="flex justify-end gap-3 mt-6">
             <button
               onClick={handleGenerate}
               disabled={loading || !goal}
               className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-purple-500/25 disabled:opacity-50"
             >
               <Sparkles className="w-5 h-5" />
               <span>Generate Path</span>
             </button>
             {planId && (
               <button
                 onClick={handleAdjust}
                 disabled={loading}
                 className="glass-button px-6 py-3 rounded-xl flex items-center gap-2"
               >
                 <RefreshCw className="w-5 h-5" />
                 <span>Adjust Based on Progress</span>
               </button>
             )}
           </div>
         </div>
 
         {steps.length > 0 && (
           <div className="space-y-4">
             {steps.map((s, idx) => (
               <div key={idx} className="glass-card p-6 flex items-start justify-between">
                 <div className="flex items-start gap-4">
                   <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                     <Target className="w-5 h-5 text-blue-400" />
                   </div>
                   <div>
                     <h3 className="text-lg font-bold text-white">{s.title}</h3>
                     <p className="text-slate-400 text-sm mb-3">{s.description}</p>
                     <div className="flex items-center gap-6 text-xs text-slate-500">
                       <span className="flex items-center gap-1">
                         <Clock className="w-3 h-3" /> {s.duration_minutes} min
                       </span>
                       <span className="flex items-center gap-1">
                         <BookOpen className="w-3 h-3" /> {s.mode}
                       </span>
                       <span>{s.topic}</span>
                     </div>
 
                     {suggestions[s.topic] && (
                       <div className="mt-4">
                         <div className="text-xs text-slate-400 mb-2">Suggested resources</div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                           {suggestions[s.topic].map((rec, ridx) => (
                             <div key={ridx} className="p-3 border border-white/10 rounded-xl flex items-center justify-between">
                               <div className="min-w-0">
                                 <div className="text-white text-sm truncate">{rec.title}</div>
                                 <a href={rec.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 truncate">
                                   {rec.url}
                                 </a>
                               </div>
                               <button
                                 onClick={() => handleAddResource(rec)}
                                 className="text-slate-400 hover:text-white p-2 rounded-lg"
                               >
                                 <PlusCircle className="w-4 h-4" />
                               </button>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
                 <div className="flex flex-col items-end gap-2">
                   <button
                     onClick={() => handleSuggestResources(s.topic)}
                     disabled={suggestingFor === s.topic}
                     className="glass-button px-3 py-2 rounded-lg text-sm"
                   >
                     {suggestingFor === s.topic ? 'Suggesting...' : 'Suggest resources'}
                   </button>
                   {planId && (
                     <button
                       onClick={() => router.push(`/study-plans/${planId}`)}
                       className="text-blue-400 hover:text-blue-300 text-sm"
                     >
                       View in plan
                     </button>
                   )}
                 </div>
               </div>
             ))}
           </div>
         )}
       </div>
     </div>
   );
 }
