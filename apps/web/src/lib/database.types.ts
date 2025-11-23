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
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    avatar_url?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    updated_at?: string | null
                }
            }
            subjects: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    color: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    color?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    color?: string
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
        }
    }
}
