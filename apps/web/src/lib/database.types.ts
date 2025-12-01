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
                    avatar_url: string | null
                    updated_at: string | null
                    is_admin: boolean
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    avatar_url?: string | null
                    updated_at?: string | null
                    is_admin?: boolean
                }
                Update: {
                    id?: string
                    full_name?: string | null
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
                    type: 'test' | 'review' | 'assignment' | 'deadline' | null
                    is_completed: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    subject_id?: string | null
                    title: string
                    due_date?: string | null
                    type?: 'test' | 'review' | 'assignment' | 'deadline' | null
                    is_completed?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    subject_id?: string | null
                    title?: string
                    due_date?: string | null
                    type?: 'test' | 'review' | 'assignment' | 'deadline' | null
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
                    type: 'pdf' | 'link' | 'video' | 'image' | 'other'
                    url: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    subject_id?: string | null
                    title: string
                    type: 'pdf' | 'link' | 'video' | 'image' | 'other'
                    url: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    subject_id?: string | null
                    title?: string
                    type?: 'pdf' | 'link' | 'video' | 'image' | 'other'
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
                    document_type: 'rich_text' | 'html' | 'youtube' | 'image'
                    order_index: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    paragraph_id: string
                    title: string
                    content?: Json
                    document_type?: 'rich_text' | 'html' | 'youtube' | 'image'
                    order_index?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    paragraph_id?: string
                    title?: string
                    content?: Json
                    document_type?: 'rich_text' | 'html' | 'youtube' | 'image'
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
            user_settings: {
                Row: {
                    id: string
                    user_id: string
                    theme: 'light' | 'dark'
                    email_notifications: boolean
                    push_notifications: boolean
                    study_reminders: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    theme?: 'light' | 'dark'
                    email_notifications?: boolean
                    push_notifications?: boolean
                    study_reminders?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    theme?: 'light' | 'dark'
                    email_notifications?: boolean
                    push_notifications?: boolean
                    study_reminders?: boolean
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
                    role: 'user' | 'assistant' | 'system'
                    content: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    chat_id: string
                    role: 'user' | 'assistant' | 'system'
                    content: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    chat_id?: string
                    role?: 'user' | 'assistant' | 'system'
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
                    question_type: 'multiple_choice' | 'true_false' | 'short_answer'
                    options: string[] | null
                    correct_answer: string
                    explanation: string | null
                    order_index: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    test_id: string
                    question_text: string
                    question_type: 'multiple_choice' | 'true_false' | 'short_answer'
                    options?: string[] | null
                    correct_answer: string
                    explanation?: string | null
                    order_index?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    test_id?: string
                    question_text?: string
                    question_type?: 'multiple_choice' | 'true_false' | 'short_answer'
                    options?: string[] | null
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
        }
    }
}
