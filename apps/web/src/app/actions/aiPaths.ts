'use server';

import { supabase } from '@/lib/supabase';
import { dub5ai } from '@/lib/dub5ai';
import ErrorLogger from '@/lib/ErrorLogger';

export type LearningGoalInput = {
  userId: string;
  goal: string;
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  learningStyle: 'visual' | 'auditory' | 'hands_on' | 'reading';
  hoursPerWeek: number;
};

export type GeneratedPathStep = {
  title: string;
  description: string;
  duration_minutes: number;
  mode: 'flashcards' | 'practice' | 'reading' | 'video' | 'project';
  topic: string;
};

export type GeneratePathResult = {
  success: boolean;
  planId?: string;
  steps?: GeneratedPathStep[];
  error?: string;
};

export async function generateLearningPath(input: LearningGoalInput): Promise<GeneratePathResult> {
  try {
    const prompt = [
      'Generate a personalized learning path as raw JSON.',
      'The JSON must be an array of steps with keys: title, description, duration_minutes, mode, topic.',
      'Do not include code fences.',
      `Goal: ${input.goal}`,
      `Level: ${input.currentLevel}`,
      `Style: ${input.learningStyle}`,
      `HoursPerWeek: ${input.hoursPerWeek}`
    ].join('\n');

    const response = await dub5ai.streamRequest(prompt, {
      task: 'learning_path',
      params: { format: 'json' }
    });

    const clean = response.replace(/```json/g, '').replace(/```/g, '').trim();
    const steps: GeneratedPathStep[] = JSON.parse(clean);

    const { data: plan, error: planErr } = await supabase
      .from('study_plans')
      .insert([{
        user_id: input.userId,
        title: input.goal,
        goal: input.goal,
        start_date: new Date().toISOString()
      }])
      .select()
      .single();

    if (planErr || !plan) {
      return { success: false, error: planErr?.message || 'Failed to create plan' };
    }

    const eventsPayload = steps.map(s => ({
      plan_id: plan.id,
      title: s.title,
      description: `${s.mode} | ${s.topic}\n${s.description}`,
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + s.duration_minutes * 60000).toISOString()
    }));

    const { error: eventsErr } = await supabase
      .from('study_plan_events')
      .insert(eventsPayload);

    if (eventsErr) {
      return { success: false, error: eventsErr.message };
    }

    return { success: true, planId: plan.id, steps };
  } catch (e: any) {
    return { success: false, error: e.message || 'Failed to generate learning path' };
  }
}

export async function adjustLearningPath(planId: string, userId: string): Promise<{ success: boolean; addedEvents?: number; error?: string }> {
  try {
    // 1. Get recent study results
    const { data: results } = await supabase
      .from('study_results')
      .select('learning_set_id, score, total_questions, study_mode, completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(10);

    // 2. Get recent AI Tutor interactions for context
    const { data: tutorLogs } = await supabase
      .from('ai_tutor_logs')
      .select('query, response, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if ((!results || results.length === 0) && (!tutorLogs || tutorLogs.length === 0)) {
      return { success: true, addedEvents: 0 };
    }

    const poorResults = results?.filter((r: any) => r.score < 70) || [];
    const tutorContext = (tutorLogs || [])?.map((log: { query: string; response: string }) => `Q: ${log.query} | A: ${log.response.substring(0, 100)}...`).join('\n') || '';

    const weakTopics: string[] = [];
    const analysisPrompt = [
      'Analyze the following student performance data and tutor interactions.',
      'Identify up to 3 specific sub-topics where the student is struggling or showing high interest/confusion.',
      'Data from Quizzes:',
      JSON.stringify(poorResults),
      'Context from AI Tutor Interactions:',
      tutorContext,
      'Return ONLY a raw JSON array of strings (the topics).',
    ].join('\n');

    const out = await dub5ai.streamRequest(analysisPrompt, { task: 'analyze', params: { format: 'json' } });
    const clean = out.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      const arr = JSON.parse(clean);
      if (Array.isArray(arr)) weakTopics.push(...arr.slice(0, 3));
    } catch (e) {
      ErrorLogger.warning('AI returned invalid JSON for topics', { out });
    }

    if (weakTopics.length === 0) {
      return { success: true, addedEvents: 0 };
    }

    // 3. Check existing events to avoid redundant remedial steps
    const { data: existingEvents } = await supabase
      .from('study_plan_events')
      .select('title')
      .eq('plan_id', planId);

    const existingTitles = new Set(existingEvents?.map((e: any) => e.title.toLowerCase()) || []);

    // 4. Generate hyper-personalized recommendations
    const remedialPrompt = [
      'Based on the identified weak topics, generate exactly 2 hyper-personalized study steps.',
      'One step should be a "Deep Dive" (Reading/Video) and one should be "Active Recall" (Practice/Quiz).',
      'Make the descriptions encouraging and specific to why they were added (e.g., "Based on your recent tutor chat about X...").',
      'The JSON must be an array of objects with keys: title, description, duration_minutes, mode, topic.',
      'Do not include topics already covered: ' + Array.from(existingTitles).join(', '),
      `Weak Topics: ${weakTopics.join(', ')}`
    ].join('\n');

    const roadOut = await dub5ai.streamRequest(remedialPrompt, { task: 'learning_path', params: { format: 'json' } });
    const roadClean = roadOut.replace(/```json/g, '').replace(/```/g, '').trim();
    const remedials: GeneratedPathStep[] = JSON.parse(roadClean);

    const eventsPayload = remedials
      .filter((s: any) => !existingTitles.has(s.title.toLowerCase()))
      .map((s: any) => ({
        plan_id: planId,
        title: `✨ Recommended: ${s.title}`,
        description: `ADAPTIVE STEP: ${s.topic}\n${s.mode} | ${s.description}`,
        start_time: new Date(Date.now() + 86400000).toISOString(), // Schedule for tomorrow
        end_time: new Date(Date.now() + 86400000 + s.duration_minutes * 60000).toISOString()
      }));

    if (eventsPayload.length === 0) {
      return { success: true, addedEvents: 0 };
    }

    const { error: eventsErr } = await supabase
      .from('study_plan_events')
      .insert(eventsPayload);

    if (eventsErr) {
      return { success: false, error: eventsErr.message };
    }

    return { success: true, addedEvents: eventsPayload.length };
  } catch (e: any) {
    ErrorLogger.error('Adjustment Error:', e);
    return { success: false, error: e.message || 'Failed to adjust path' };
  }
}

export async function suggestResources(userId: string, topic: string): Promise<{ success: boolean; suggestions?: Array<{ title: string; url: string; type: string }>; error?: string }> {
  try {
    const { data: existing } = await supabase
      .from('resources')
      .select('*')
      .eq('user_id', userId);

    const base = existing ? existing.map((r: any) => `${r.title} | ${r.url} | ${r.type}`).join('\n') : '';
    const prompt = [
      'Recommend up to 5 study resources relevant to topic as raw JSON.',
      'Keys: title, url, type.',
      `Topic: ${topic}`,
      `Available: ${base}`
    ].join('\n');

    const out = await dub5ai.streamRequest(prompt, { task: 'recommend', params: { format: 'json' } });
    const clean = out.replace(/```json/g, '').replace(/```/g, '').trim();
    const suggestions = JSON.parse(clean);
    return { success: true, suggestions };
  } catch (e: any) {
    return { success: false, error: e.message || 'Failed to suggest resources' };
  }
}

export async function addResource(userId: string, suggestion: { title: string; url: string; type: string }) {
  const { error } = await supabase
    .from('resources')
    .insert([{ user_id: userId, title: suggestion.title, url: suggestion.url, type: suggestion.type }]);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function checkForSpacedRepetition(planId: string, userId: string): Promise<{ success: boolean; addedRefresh?: boolean; error?: string }> {
  try {
    // 1. Get the last study result for this plan/user
    const { data: lastResult } = await supabase
      .from('study_results')
      .select('completed_at, learning_set_id')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (!lastResult) return { success: true, addedRefresh: false };

    const lastDate = new Date(lastResult.completed_at);
    const diffDays = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

    // If more than 3 days, suggest a refresh
    if (diffDays >= 3) {
      // Check if a refresh event already exists for today or tomorrow
      const { data: existingRefresh } = await supabase
        .from('study_plan_events')
        .select('id')
        .eq('plan_id', planId)
        .ilike('title', '%Refresh%')
        .gte('start_time', new Date().toISOString())
        .limit(1);

      if (existingRefresh && existingRefresh.length > 0) {
        return { success: true, addedRefresh: false };
      }

      // Add a Refresh event
      const { error: insertErr } = await supabase
        .from('study_plan_events')
        .insert([{
          plan_id: planId,
          title: '🔄 Spaced Repetition: Refresh Session',
          description: 'It has been a few days since your last session. Let\'s refresh your memory on the core concepts.',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 15 * 60000).toISOString() // 15 min refresh
        }]);

      if (insertErr) throw insertErr;
      return { success: true, addedRefresh: true };
    }

    return { success: true, addedRefresh: false };
  } catch (e: any) {
    ErrorLogger.error('Spaced Repetition Error:', e);
    return { success: false, error: e.message };
  }
}
