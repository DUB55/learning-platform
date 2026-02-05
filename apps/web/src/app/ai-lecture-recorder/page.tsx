
"use client";

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Mic, Square, Loader2, CheckCircle2, Pause, Play, Save, History, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ErrorLogger from '@/lib/ErrorLogger';
import { apiFetch, getApiBaseUrl } from '@/lib/api';
import { supabase } from '@/lib/supabase';

interface AIResult {
  overview: string;
  summary: string;
  explanation: string;
}

interface RecordedLecture {
  id: string;
  date: string;
  duration: number;
  name: string;
  result: AIResult;
}

export default function AiLectureRecorderPage() {
  const { user, loading: authLoading, updateXP } = useAuth();
  const router = useRouter();
  
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'completed'>('idle');
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [recordedLectures, setRecordedLectures] = useState<RecordedLecture[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const saved = localStorage.getItem('ai_recorded_lectures');
    if (saved) {
      try {
        setRecordedLectures(JSON.parse(saved));
      } catch (e) {
        ErrorLogger.error('Failed to parse saved lectures', e);
      }
    }
  }, []);

  useEffect(() => {
    if (status === 'recording' && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, isPaused]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setStatus('processing');
        
        try {
          // 1. Upload audio
          const formData = new FormData();
          formData.append('audio', blob, 'lecture.webm');
          
          const baseUrl = getApiBaseUrl();
          const uploadRes = await fetch(`${baseUrl}/api/upload-lecture-audio`, {
            method: 'POST',
            body: formData,
          });
          const { fileId } = await uploadRes.json();

          // 2. Process with AI
          const result = await apiFetch('/api/process-lecture-ai', {
            method: 'POST',
            body: JSON.stringify({ transcriptionId: fileId, userId: user?.id }),
          });
          
          if (result.success) {
            setAiResult(result.data);
            setStatus('completed');
            
            // Award XP for recording and processing a lecture
            if (user) {
              await updateXP(100, 'Recorded and processed a live lecture with AI');
            }
          } else {
            throw new Error(result.error);
          }
        } catch (err) {
          ErrorLogger.error('Processing failed', err);
          alert('AI processing failed. Please check if the backend API is running.');
          setStatus('idle');
        }
      };

      mediaRecorder.start();
      setStatus('recording');
    } catch (err) {
      ErrorLogger.error('Failed to start recording', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setStatus('idle');
    }
  };

  const togglePause = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const saveLecture = () => {
    if (!aiResult) return;

    const newLecture = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      duration,
      name: `Lecture ${recordedLectures.length + 1}`,
      result: aiResult
    };

    const updated = [newLecture, ...recordedLectures];
    setRecordedLectures(updated);
    localStorage.setItem('ai_recorded_lectures', JSON.stringify(updated));
    setAiResult(null);
    setStatus('idle');
    setDuration(0);
    alert('Lecture saved locally!');
  };

  if (authLoading) return null;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-10 text-center lg:text-left">
        <div className="flex flex-col lg:flex-row items-center gap-4 mb-2">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 flex items-center gap-3">
            <Mic className="w-8 h-8 text-red-400" />
            AI Lecture Recorder
          </h1>
        </div>
        <p className="text-slate-400">Record your lectures and let AI generate summaries and insights for you.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-10 flex flex-col items-center justify-center space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
            
            <div className={`w-32 h-32 rounded-full flex items-center justify-center relative z-10 transition-all duration-500 ${
              status === 'recording' 
                ? 'bg-red-500/20 border-4 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-pulse' 
                : 'bg-blue-500/20 border-4 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.2)]'
            }`}>
              <Mic className={`w-14 h-14 ${status === 'recording' ? 'text-red-500' : 'text-blue-500'}`} />
            </div>

            <div className="text-center relative z-10">
              <div className="text-6xl font-mono font-bold text-white mb-2 tracking-tighter">
                {formatDuration(duration)}
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  status === 'recording' ? (isPaused ? 'bg-amber-500' : 'bg-red-500') : 'bg-slate-500'
                }`}></div>
                <div className="text-slate-400 uppercase tracking-widest text-xs font-bold">
                  {status === 'recording' ? (isPaused ? 'Paused' : 'Recording Live') : status === 'processing' ? 'AI is Processing...' : 'Ready to Start'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 relative z-10">
              {status === 'idle' && (
                <button 
                  onClick={startRecording} 
                  className="glass-button px-8 py-3 rounded-xl flex items-center gap-2 text-white font-bold hover:scale-105 transition-transform"
                >
                  <Play className="w-5 h-5 fill-current" /> Start Recording
                </button>
              )}

              {status === 'recording' && (
                <>
                  <button 
                    onClick={togglePause} 
                    className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-bold hover:bg-white/10 transition-colors flex items-center gap-2"
                  >
                    {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button 
                    onClick={stopRecording} 
                    className="px-8 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 flex items-center gap-2"
                  >
                    <Square className="w-5 h-5 fill-current" /> Stop
                  </button>
                </>
              )}

              {status === 'completed' && (
                <button 
                  onClick={saveLecture} 
                  className="glass-button px-8 py-3 rounded-xl flex items-center gap-2 text-white font-bold hover:scale-105 transition-transform"
                >
                  <Save className="w-5 h-5" /> Save Analysis
                </button>
              )}
            </div>
          </div>

          {status === 'completed' && aiResult && (
            <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500 w-6 h-6" />
                AI Analysis Ready
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="glass-card p-6 border-l-4 border-blue-500">
                  <h3 className="font-bold text-blue-400 mb-3 uppercase tracking-wider text-xs">Overview</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{aiResult.overview}</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-purple-500">
                  <h3 className="font-bold text-purple-400 mb-3 uppercase tracking-wider text-xs">Summary</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{aiResult.summary}</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-amber-500 md:col-span-2">
                  <h3 className="font-bold text-amber-400 mb-3 uppercase tracking-wider text-xs">Complete Explanation</h3>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{aiResult.explanation}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            History
          </h2>
          <div className="space-y-3">
            {recordedLectures.length === 0 ? (
              <div className="glass-card p-8 text-center border-dashed border-white/10">
                <p className="text-slate-500 text-sm">No lectures recorded yet.</p>
              </div>
            ) : (
              recordedLectures.map((lecture) => (
                <div key={lecture.id} className="glass-card p-4 hover:bg-white/5 transition-all group cursor-pointer border-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white font-medium group-hover:text-blue-400 transition-colors">{lecture.name}</h3>
                    <div className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Analyzed
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(lecture.duration)}
                    </div>
                    <div>{new Date(lecture.date).toLocaleDateString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
