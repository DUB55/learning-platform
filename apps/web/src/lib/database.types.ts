export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    bio: string | null
                    avatar_url: string | null
                    updated_at: string | null
                    is_admin: boolean
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    bio?: string | null
                    avatar_url?: string | null
                    updated_at?: string | null
                    is_admin?: boolean
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    bio?: string | null
                    avatar_url?: string | null
                    updated_at?: string | null
                    is_admin?: boolean
                }
            }
            subjects: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    color: string
                    is_public: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    color?: string
                    is_public?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    color?: string
                    is_public?: boolean
                    created_at?: string
                }
            }
            chapters: {
                Row: {
                    id: string
                    subject_id: string
                    title: string
                    is_completed: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    subject_id: string
                    title: string
                    is_completed?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    subject_id?: string
                    title?: string
                    is_completed?: boolean
                    created_at?: string
                }
            }
            study_sessions: {
                Row: {
                    id: string
                    user_id: string
                    subject_id: string | null
                    duration_seconds: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    subject_id?: string | null
                    duration_seconds: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    subject_id?: string | null
                    duration_seconds?: number
                    created_at?: string
                }
            }
            tasks: {
                Row: {
                    id: string
                    user_id: string
                    subject_id: string | null
                    title: string
                    due_date: string | null
                    type: string | null
                    is_completed: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    subject_id?: string | null
                    title: string
                    due_date?: string | null
                    type?: string | null
                    is_completed?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    subject_id?: string | null
                    title?: string
                    due_date?: string | null
                    type?: string | null
                    is_completed?: boolean
                    created_at?: string
                }
            }
            resources: {
                Row: {
                    id: string
                    user_id: string
                    subject_id: string | null
                    title: string
                    type: string
                    url: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    subject_id?: string | null
                    title: string
                    type: string
                    url: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    subject_id?: string | null
                    title?: string
                    type?: string
                    url?: string
                    created_at?: string
                }
            }
            units: {
                Row: {
                    id: string
                    subject_id: string
                    title: string
                    order_index: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    subject_id: string
                    title: string
                    order_index?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    subject_id?: string
                    title?: string
                    order_index?: number
                    created_at?: string
                }
            }
            paragraphs: {
                Row: {
                    id: string
                    unit_id: string
                    title: string
                    order_index: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    unit_id: string
                    title: string
                    order_index?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    unit_id?: string
                    title?: string
                    order_index?: number
                    created_at?: string
                }
            }
            documents: {
                Row: {
                    id: string
                    paragraph_id: string
                    title: string
                    content: Json
                    document_type: string
                    order_index: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    paragraph_id: string
                    title: string
                    content?: Json
                    document_type?: string
                    order_index?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    paragraph_id?: string
                    title?: string
                    content?: Json
                    document_type?: string
                    order_index?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            calendar_events: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    description: string | null
                    start_date: string
                    end_date: string | null
                    color: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    description?: string | null
                    start_date: string
                    end_date?: string | null
                    color?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    description?: string | null
                    start_date?: string
                    end_date?: string | null
                    color?: string
                    created_at?: string
                }
            }
            smart_notes: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    content: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    content: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    content?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            user_settings: {
                Row: {
                    id: string
                    user_id: string
                    theme: string
                    email_notifications: boolean
                    push_notifications: boolean
                    study_reminders: boolean
                    ui_preferences: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    theme?: string
                    email_notifications?: boolean
                    push_notifications?: boolean
                    study_reminders?: boolean
                    ui_preferences?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    theme?: string
                    email_notifications?: boolean
                    push_notifications?: boolean
                    study_reminders?: boolean
                    ui_preferences?: Json | null
                    created_at?: string
                    updated_at?: string
                }
            }
            admin_settings: {
                Row: {
                    id: string
                    setting_key: string
                    setting_value: Json
                    description: string | null
                    category: string
                    updated_at: string
                    updated_by: string | null
                }
                Insert: {
                    id?: string
                    setting_key: string
                    setting_value?: Json
                    description?: string | null
                    category?: string
                    updated_at?: string
                    updated_by?: string | null
                }
                Update: {
                    id?: string
                    setting_key?: string
                    setting_value?: Json
                    description?: string | null
                    category?: string
                    updated_at?: string
                    updated_by?: string | null
                }
            }
            user_permission_overrides: {
                Row: {
                    id: string
                    user_id: string
                    permission_key: string
                    is_enabled: boolean
                    granted_by: string | null
                    granted_at: string
                    expires_at: string | null
                    reason: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    permission_key: string
                    is_enabled?: boolean
                    granted_by?: string | null
                    granted_at?: string
                    expires_at?: string | null
                    reason?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    permission_key?: string
                    is_enabled?: boolean
                    granted_by?: string | null
                    granted_at?: string
                    expires_at?: string | null
                    reason?: string | null
                }
            }
            ai_chats: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            ai_messages: {
                Row: {
                    id: string
                    chat_id: string
                    role: string
                    content: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    chat_id: string
                    role: string
                    content: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    chat_id?: string
                    role?: string
                    content?: string
                    created_at?: string
                }
            }
            practice_tests: {
                Row: {
                    id: string
                    user_id: string
                    subject_id: string | null
                    title: string
                    description: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    subject_id?: string | null
                    title: string
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    subject_id?: string | null
                    title?: string
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            practice_test_questions: {
                Row: {
                    id: string
                    test_id: string
                    question_text: string
                    question_type: string
                    options: Json | null
                    correct_answer: string
                    explanation: string | null
                    order_index: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    test_id: string
                    question_text: string
                    question_type: string
                    options?: Json | null
                    correct_answer: string
                    explanation?: string | null
                    order_index?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    test_id?: string
                    question_text?: string
                    question_type?: string
                    options?: Json | null
                    correct_answer?: string
                    explanation?: string | null
                    order_index?: number
                    created_at?: string
                }
            }
            study_plans: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    goal: string | null
                    start_date: string
                    end_date: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    goal?: string | null
                    start_date?: string
                    end_date?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    goal?: string | null
                    start_date?: string
                    end_date?: string | null
                    created_at?: string
                }
            }
            study_plan_events: {
                Row: {
                    id: string
                    plan_id: string
                    title: string
                    start_time: string
                    end_time: string
                    description: string | null
                    is_completed: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    plan_id: string
                    title: string
                    start_time: string
                    end_time: string
                    description?: string | null
                    is_completed?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    plan_id?: string
                    title?: string
                    start_time?: string
                    end_time?: string
                    description?: string | null
                    is_completed?: boolean
                    created_at?: string
                }
            }
            user_xp: {
                Row: {
                    id: string
                    user_id: string
                    total_xp: number
                    level: number
                    current_streak: number
                    longest_streak: number
                    last_activity_date: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    total_xp?: number
                    level?: number
                    current_streak?: number
                    longest_streak?: number
                    last_activity_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    total_xp?: number
                    level?: number
                    current_streak?: number
                    longest_streak?: number
                    last_activity_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            achievements: {
                Row: {
                    id: string
                    key: string
                    name: string
                    description: string
                    icon: string
                    xp_reward: number
                    category: string
                    requirement_type: string
                    requirement_value: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    key: string
                    name: string
                    description: string
                    icon: string
                    xp_reward?: number
                    category: string
                    requirement_type: string
                    requirement_value?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    key?: string
                    name?: string
                    description?: string
                    icon?: string
                    xp_reward?: number
                    category?: string
                    requirement_type?: string
                    requirement_value?: number | null
                    created_at?: string
                }
            }
            user_achievements: {
                Row: {
                    id: string
                    user_id: string
                    achievement_id: string
                    unlocked_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    achievement_id: string
                    unlocked_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    achievement_id?: string
                    unlocked_at?: string
                }
            }
            daily_streaks: {
                Row: {
                    id: string
                    user_id: string
                    activity_date: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    activity_date: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    activity_date?: string
                    created_at?: string
                }
            }
            xp_transactions: {
                Row: {
                    id: string
                    user_id: string
                    amount: number
                    reason: string
                    reference_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    amount: number
                    reason: string
                    reference_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    amount?: number
                    reason?: string
                    reference_id?: string | null
                    created_at?: string
                }
            }
            srs_items: {
                Row: {
                    id: string
                    user_id: string
                    subject_id: string | null
                    front: string
                    back: string
                    interval: number
                    repetition: number
                    efactor: number
                    next_review: string
                    tags: string[] | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    subject_id?: string | null
                    front: string
                    back: string
                    interval?: number
                    repetition?: number
                    efactor?: number
                    next_review?: string
                    tags?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    subject_id?: string | null
                    front?: string
                    back?: string
                    interval?: number
                    repetition?: number
                    efactor?: number
                    next_review?: string
                    tags?: string[] | null
                    created_at?: string
                    updated_at?: string
                }
            }
            study_groups: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    created_by: string
                    created_at: string
                    image_url: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    created_by: string
                    created_at?: string
                    image_url?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    created_by?: string
                    created_at?: string
                    image_url?: string | null
                }
            }
            group_members: {
                Row: {
                    id: string
                    group_id: string
                    user_id: string
                    role: 'admin' | 'member'
                    joined_at: string
                }
                Insert: {
                    id?: string
                    group_id: string
                    user_id: string
                    role?: 'admin' | 'member'
                    joined_at?: string
                }
                Update: {
                    id?: string
                    group_id?: string
                    user_id?: string
                    role?: 'admin' | 'member'
                    joined_at?: string
                }
            }
            group_messages: {
                Row: {
                    id: string
                    group_id: string
                    user_id: string
                    content: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    group_id: string
                    user_id: string
                    content: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    group_id?: string
                    user_id?: string
                    content?: string
                    created_at?: string
                }
            }
            group_shared_resources: {
                Row: {
                    id: string
                    group_id: string
                    resource_type: 'note' | 'study_plan' | 'resource'
                    resource_id: string
                    shared_by: string
                    shared_at: string
                }
                Insert: {
                    id?: string
                    group_id: string
                    resource_type: 'note' | 'study_plan' | 'resource'
                    resource_id: string
                    shared_by: string
                    shared_at?: string
                }
                Update: {
                    id?: string
                    group_id?: string
                    resource_type?: 'note' | 'study_plan' | 'resource'
                    resource_id?: string
                    shared_by?: string
                    shared_at?: string
                }
            }
            challenges: {
                Row: {
                    id: string
                    challenger_id: string
                    opponent_id: string
                    type: string
                    status: string
                    result: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    challenger_id: string
                    opponent_id: string
                    type: string
                    status?: string
                    result?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    challenger_id?: string
                    opponent_id?: string
                    type?: string
                    status?: string
                    result?: Json | null
                    created_at?: string
                }
            }
            practice_test_results: {
                Row: {
                    id: string
                    user_id: string
                    test_id: string
                    score: number
                    total_questions: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    test_id: string
                    score: number
                    total_questions: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    test_id?: string
                    score?: number
                    total_questions?: number
                    created_at?: string
                }
            }
            mastery_data: {
                Row: {
                    id: string
                    user_id: string
                    subject_id: string
                    mastery_level: number
                    last_updated: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    subject_id: string
                    mastery_level: number
                    last_updated?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    subject_id?: string
                    mastery_level?: number
                    last_updated?: string
                }
            }
            friendships: {
                Row: {
                    id: string
                    user_id: string
                    friend_id: string
                    status: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    friend_id: string
                    status?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    friend_id?: string
                    status?: string
                    created_at?: string
                }
            }
            study_results: {
                Row: {
                    id: string
                    user_id: string
                    learning_set_id: string
                    score: number
                    correct_answers: number
                    total_questions: number
                    study_mode: string
                    time_spent_seconds: number
                    completed_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    learning_set_id: string
                    score: number
                    correct_answers: number
                    total_questions: number
                    study_mode: string
                    time_spent_seconds: number
                    completed_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    learning_set_id?: string
                    score?: number
                    correct_answers?: number
                    total_questions?: number
                    study_mode?: string
                    time_spent_seconds?: number
                    completed_at?: string
                }
            }
            leersets: {
                Row: {
                    id: string
                    title: string
                    subject_id: string
                    created_by: string
                    source_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    subject_id: string
                    created_by: string
                    source_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    subject_id?: string
                    created_by?: string
                    source_id?: string | null
                    created_at?: string
                }
            }
            leerset_items: {
                Row: {
                    id: string
                    leerset_id: string
                    term: string
                    definition: string
                    source_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    leerset_id: string
                    term: string
                    definition: string
                    source_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    leerset_id?: string
                    term?: string
                    definition?: string
                    source_id?: string | null
                    created_at?: string
                }
            }
            learning_sets: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    paragraph_id: string
                    subject_id: string
                    user_id: string
                    created_by: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    paragraph_id: string
                    subject_id: string
                    user_id: string
                    created_by: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    paragraph_id?: string
                    subject_id?: string
                    user_id?: string
                    created_by?: string
                    created_at?: string
                }
            }
            learning_set_terms: {
                Row: {
                    id: string
                    learning_set_id: string
                    term: string
                    definition: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    learning_set_id: string
                    term: string
                    definition: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    learning_set_id?: string
                    term?: string
                    definition?: string
                    created_at?: string
                }
            }
            announcements: {
                Row: {
                    id: string
                    title: string
                    content: string
                    slug: string
                    author_id: string | null
                    is_published: boolean
                    priority: 'low' | 'normal' | 'high' | 'urgent'
                    linked_page_id: string | null
                    expires_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    content: string
                    slug: string
                    author_id?: string | null
                    is_published?: boolean
                    priority?: 'low' | 'normal' | 'high' | 'urgent'
                    linked_page_id?: string | null
                    expires_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    content?: string
                    slug?: string
                    author_id?: string | null
                    is_published?: boolean
                    priority?: 'low' | 'normal' | 'high' | 'urgent'
                    linked_page_id?: string | null
                    expires_at?: string | null
                    created_at?: string
                }
            }
            announcement_pages: {
                Row: {
                    id: string
                    title: string
                    content: string
                    slug: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    content: string
                    slug: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    content?: string
                    slug?: string
                    created_at?: string
                }
            }
            announcement_reads: {
                Row: {
                    id: string
                    announcement_id: string
                    user_id: string
                    read_at: string
                }
                Insert: {
                    id?: string
                    announcement_id: string
                    user_id: string
                    read_at?: string
                }
                Update: {
                    id?: string
                    announcement_id?: string
                    user_id?: string
                    read_at?: string
                }
            }
            quizzes: {
                Row: {
                    id: string
                    unit_id: string
                    title: string
                    description: string | null
                    created_at: string
                    user_id: string
                }
                Insert: {
                    id?: string
                    unit_id: string
                    title: string
                    description?: string | null
                    created_at?: string
                    user_id: string
                }
                Update: {
                    id?: string
                    unit_id?: string
                    title?: string
                    description?: string | null
                    created_at?: string
                    user_id?: string
                }
            }
            quiz_questions: {
                Row: {
                    id: string
                    quiz_id: string
                    question_text: string
                    options: Json
                    correct_option_index: number
                    explanation: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    quiz_id: string
                    question_text: string
                    options: Json
                    correct_option_index: number
                    explanation?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    quiz_id?: string
                    question_text?: string
                    options?: Json
                    correct_option_index?: number
                    explanation?: string | null
                    created_at?: string
                }
            }
            quiz_attempts: {
                Row: {
                    id: string
                    quiz_id: string
                    user_id: string
                    score: number
                    max_score: number
                    completed_at: string
                }
                Insert: {
                    id?: string
                    quiz_id: string
                    user_id: string
                    score: number
                    max_score: number
                    completed_at?: string
                }
                Update: {
                    id?: string
                    quiz_id?: string
                    user_id?: string
                    score?: number
                    max_score?: number
                    completed_at?: string
                }
            }
            system_settings: {
                Row: {
                    key: string
                    value: Json
                    updated_at: string
                    updated_by: string | null
                }
                Insert: {
                    key: string
                    value: Json
                    updated_at?: string
                    updated_by?: string | null
                }
                Update: {
                    key?: string
                    value?: Json
                    updated_at?: string
                    updated_by?: string | null
                }
            }
            admin_permission_settings: {
                Row: {
                    setting_key: string
                    default_value: string
                    setting_type: string
                    description: string | null
                    updated_at: string
                }
                Insert: {
                    setting_key: string
                    default_value: string
                    setting_type?: string
                    description?: string | null
                    updated_at?: string
                }
                Update: {
                    setting_key?: string
                    default_value?: string
                    setting_type?: string
                    description?: string | null
                    updated_at?: string
                }
            }
            groups: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    created_by: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    created_by: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    created_by?: string
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
