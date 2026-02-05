 # AI Learning Platform – Implementation Plan & Tasks
 
 This plan outlines the tasks and detailed planning to build the requested AI enhancements for the Complete Learning Platform. It focuses on a practical MVP-first approach with iterative improvements, leveraging existing components and Supabase data structures already present in the project.
 
 ## Scope Overview
 - Core: AI Learning Path Generator (dynamic generation and adaptive adjustment).
 - Supporting: Goal-oriented resource curation, AI-powered content creation, intelligent practice question generation, proactive interventions, gamified AI challenges, semantic search & Q&A.
 - Integration with existing pages and components: study-plans, study-modes, PracticeQuestions, games, ai-tutor, library, dashboard/stats, announcements.
 
 ## Current Foundations
 - Supabase client and typed schema available.
 - Existing AI pipeline via Dub5 AI streaming API.
 - Pages: study-plans, study-modes, library, practice questions player/importer, AI chat/tutor, notifications, stats.
 
 ## Recently Implemented (MVP seeds)
 - Server actions for AI Paths:
   - Path generation, adaptive adjustment, resource suggestions.
   - Code: [aiPaths.ts](file:///c:/Users/Mohammed/OneDrive%20-%20St%20Micha%C3%ABl%20College/2025-2026/Wiskunde/Uitwerkingen/Projects/Projects/Complete%20Learning%20Platform/apps/web/src/app/actions/aiPaths.ts)
 - New page for AI Paths:
   - Goal form, generated path visualization, resource suggestion add-to-library flow.
   - Code: [page.tsx (ai-paths)](file:///c:/Users/Mohammed/OneDrive%20-%20St%20Micha%C3%ABl%20College/2025-2026/Wiskunde/Uitwerkingen/Projects/Projects/Complete%20Learning%20Platform/apps/web/src/app/ai-paths/page.tsx)
 
 ---
 
 ## Phase 1 — Dynamic Learning Path Generation
 
 ### Goal
 Generate a personalized path based on user goal, current level, preferred learning style, and available hours; map steps to platform modes and store as study plan with events.
 
 ### Deliverables
 - Form UI to capture goal, level, style, hours per week (ai-paths page).
 - Server action that:
   - Produces JSON steps via AI (mode, topic, duration, title, description).
   - Creates a study_plans record and inserts study_plan_events.
 - Display of generated steps with quick resource suggestions.
 
 ### Tasks
 - Define prompt templates for consistent JSON output and validation.
 - Translate generated steps into study_plan_events (title, description, timing).
 - Link from ai-paths to study-plans details.
 - Error handling and fallback paths for malformed AI JSON.
 - Rate limit and user feedback during generation (loading states).
 
 ### Acceptance Criteria
 - Given a valid goal input, the platform creates a new study plan and renders steps on ai-paths.
 - Generated steps are persisted as study_plan_events and visible under study-plans.
 
 ---
 
 ## Phase 2 — Adaptive Path Adjustment
 
 ### Goal
 Continuously adjust the plan based on user performance and engagement (PracticeQuestions, study-modes, ai-tutor interactions), adding remedial or acceleration steps.
 
 ### Deliverables
 - Server action to analyze recent study_results and produce remedial steps.
 - Button on ai-paths page to trigger adjustment for an existing plan.
 - Hooks for collecting results and engagement signals (see Tasks).
 
 ### Tasks
 - Ensure practice session outcomes are recorded consistently in study_results (score, total_questions, mode).
 - Aggregate recent performance; identify weak topics via AI summarization.
 - Generate remedial steps and append as study_plan_events.
 - Basic policy rules:
   - Low scores → add remedial flashcards/practice.
   - High scores quickly → unlock next-level topics and reduce repetitions.
 - Later iterations: Bayesian updates or simple bandit heuristics to choose next steps.
 
 ### Acceptance Criteria
 - Clicking “Adjust Based on Progress” adds remedial steps when weaknesses are detected.
 - No duplicate or nonsensical events; descriptions include mode/topic.
 
 ---
 
 ## Phase 3 — Goal-Oriented Resource Curation
 
 ### Goal
 Suggest internal library items and vetted external resources relevant to each step/topic.
 
 ### Deliverables
 - Server action to propose up to 5 resources as JSON (title, url, type).
 - Per-step “Suggest resources” button and UI list; add-to-library action.
 - Optional YouTube transcript fetch integration to convert videos to summaries/flashcards (existing actions/generate.ts).
 
 ### Tasks
 - Prompt engineering for high-precision suggestions aligned to topic and user context.
 - Deduplication vs existing library items.
 - Quick “Add to Library” action to persist suggestions.
 - Extend imports/Youtube integration for curated pathways (later).
 
 ### Acceptance Criteria
 - For a selected step/topic, the platform shows 3–5 relevant resources; user can add them to library instantly.
 
 ---
 
 ## Phase 4 — AI-Powered Content Creation & Expansion
 
 ### Goal
 Expand content creation via ai-mindmap, ai-ppt, and file/YouTube ingestion to produce modules, flashcards, summaries.
 
 ### Deliverables
 - Unified entry points under library/study to generate learning sets, mind maps, and slides from inputs.
 - Reuse existing generate.ts and AI pages; add flows that store outputs into appropriate tables.
 
 ### Tasks
 - Add “Generate Learning Set” and “Create Mind Map/Slides” workflows from a topic or uploaded file.
 - Chunk large documents safely; enforce limits and robust parsing.
 - Save outputs and link them to study plans or subjects.
 
 ### Acceptance Criteria
 - Users can upload a PDF or paste a URL and obtain structured materials that integrate with study modes.
 
 ---
 
 ## Phase 5 — Intelligent Practice Question Generation
 
 ### Goal
 Create AI-generated practice questions tailored to content and learner progress, with personalized feedback.
 
 ### Deliverables
 - Server action to generate MCQ/input/drag-drop questions with explanations.
 - Extend PracticeQuestionImporter to accept AI-generated drafts before publishing.
 - Enhance PracticeQuestionPlayer to render feedback and record outcomes.
 
 ### Tasks
 - Prompts for question generation constrained to safe formats and difficulty levels.
 - Feedback generator for incorrect answers: explain reasoning, hint next steps.
 - Store attempts in study_results with per-question granularity (future iteration).
 
 ### Acceptance Criteria
 - Given a topic or learning set, the platform produces valid questions and feedback; user can practice and results are saved.
 
 ---
 
 ## Phase 6 — Proactive Learning Intervention & Motivation
 
 ### Goal
 Detect plateaus or disengagement and nudge users via notifications, announcements, and tutor connections.
 
 ### Deliverables
 - Simple heuristics on study_minutes, streaks, and recent performance.
 - NotificationMenu and GlobalAnnouncementOverlay hooks for motivational prompts.
 - Optional routing to ai-tutor for targeted help sessions.
 
 ### Tasks
 - Define thresholds for inactivity, low scores, and negative trends.
 - Send contextual messages with links to remedial steps or alternative study modes.
 - Log interventions for A/B testing later.
 
 ### Acceptance Criteria
 - Inactivity or low performance triggers a helpful, non-intrusive prompt with action suggestions.
 
 ---
 
 ## Phase 7 — Gamified AI Challenges
 
 ### Goal
 Introduce adaptive AI challenges in games related to current learning topics; scale difficulty based on skill.
 
 ### Deliverables
 - Topic-aware puzzles or opponents; dynamic difficulty curves.
 - Rewards tied to XP and achievements; record challenge outcomes.
 
 ### Tasks
 - Map topics to game mechanics; define scoring and progression.
 - Generate challenge seeds via AI, constrained by game rules.
 - Persist results for adaptive tuning and streak rewards.
 
 ### Acceptance Criteria
 - Users receive relevant challenges; difficulty adapts; results affect XP/streak/achievements.
 
 ---
 
 ## Phase 8 — Semantic Search & Q&A
 
 ### Goal
 Natural language search over the learning library and Q&A responses grounded in stored content.
 
 ### Deliverables
 - Semantic search service (embedding index or delegated AI with context retrieval).
 - Q&A responses surfaced in AIChatSidebar with source citations.
 
 ### Tasks
 - Index titles, summaries, and key sections; attach metadata and permissions.
 - Retrieval-augmented generation for grounded answers; limit hallucinations via strict context windows.
 - UI enhancements to display sources and copy references.
 
 ### Acceptance Criteria
 - Queries like “main causes of climate change” return concise, source-backed answers.
 
 ---
 
 ## Architecture & Data Touchpoints
 - Supabase tables used:
   - study_plans, study_plan_events for scheduling.
   - study_results for practice outcomes.
   - resources for curated links/media.
   - achievements/xp for gamification (future interactions).
 - AI service: Dub5 AI streaming endpoint; JSON-only outputs; sanitization before parsing.
 - Pages/components leveraged:
   - ai-paths, study-plans, study-modes, library, PracticeQuestions (Importer/Player), games, ai-chat/ai-tutor, notifications and overlays.
 
 ## Risks & Mitigations
 - Unstable AI JSON formats → strict prompt contracts, sanitization, schema validation.
 - Rate limits and latency → debounce actions, background processing where possible.
 - Data integrity (duplicate/irrelevant events) → deduplication rules and topic validation.
 - User trust → show sources and rationale, avoid opaque adjustments.
 
 ## Validation & QA
 - Unit tests for server actions (path generation, adjustment, suggestions).
 - Integration paths:
   - Generate → events created → visible in study-plans.
   - Adjust → remedial events appended → visible in plan.
   - Suggest → resources added → visible in library.
 - Manual scenarios covering edge inputs (very low/high hours, advanced level, empty topics).
 
 ## Timeline (Indicative)
 - Week 1: Phases 1–2 (MVP generation + adjustment).
 - Week 2: Phase 3 (resource curation), Phase 4 (content creation hooks).
 - Week 3: Phase 5 (question generation + feedback).
 - Week 4: Phase 6–7 (interventions + gamified challenges MVP).
 - Week 5: Phase 8 (semantic search & Q&A), polish and stabilization.
 
 ## Task Checklist
 - [x] Server actions for learning paths and adjustments.
 - [x] AI Paths page with goal input and steps display.
 - [x] Resource suggestion and add-to-library.
 - [ ] Consistent saving of practice outcomes for adaptive logic.
 - [ ] AI question generation with feedback and importer integration.
 - [ ] Intervention heuristics and messaging pipelines.
 - [ ] Semantic search service with source-backed Q&A.
 - [ ] Gamified challenge generation tied to topics and XP.
 
 ## Notes
 - Start with robust prompts and validation schemas; iterate to RL/Bayesian updates after baseline heuristics perform consistently.
 - Keep user agency: allow regenerate/adjust, show why recommendations are made, and provide manual overrides.
