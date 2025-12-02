export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          key: string
          name: string
          requirement_type: string | null
          requirement_value: number | null
          xp_reward: number
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          icon: string
          id?: string
          key: string
          name: string
          requirement_type?: string | null
          requirement_value?: number | null
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          key?: string
          name?: string
          requirement_type?: string | null
          requirement_value?: number | null
          xp_reward?: number
        }
        Relationships: []
      }
      admin_permission_settings: {
        Row: {
          category: string | null
          default_value: Json | null
          description: string | null
          id: string
          order_index: number | null
          setting_description: string | null
          setting_key: string | null
          setting_name: string | null
          setting_type: string | null
          setting_value: Json | null
          subcategory: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          default_value?: Json | null
          description?: string | null
          id?: string
          order_index?: number | null
          setting_description?: string | null
          setting_key?: string | null
          setting_name?: string | null
          setting_type?: string | null
          setting_value?: Json | null
          subcategory?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          default_value?: Json | null
          description?: string | null
          id?: string
          order_index?: number | null
          setting_description?: string | null
          setting_key?: string | null
          setting_name?: string | null
          setting_type?: string | null
          setting_value?: Json | null
          subcategory?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          category: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_chat_sessions: {
        Row: {
          chat_summary: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          chat_summary?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          chat_summary?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_chats: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          conversation_type: string | null
          created_at: string | null
          id: string
          messages: Json | null
          subject_id: string | null
          system_prompt: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conversation_type?: string | null
          created_at?: string | null
          id?: string
          messages?: Json | null
          subject_id?: string | null
          system_prompt?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conversation_type?: string | null
          created_at?: string | null
          id?: string
          messages?: Json | null
          subject_id?: string | null
          system_prompt?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_generated_content: {
        Row: {
          content_type: string
          created_at: string | null
          generated_content: Json | null
          id: string
          input_data: Json | null
          subject_id: string | null
          user_id: string
        }
        Insert: {
          content_type: string
          created_at?: string | null
          generated_content?: Json | null
          id?: string
          input_data?: Json | null
          subject_id?: string | null
          user_id: string
        }
        Update: {
          content_type?: string
          created_at?: string | null
          generated_content?: Json | null
          id?: string
          input_data?: Json | null
          subject_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "ai_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_pages: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          id: string
          is_published: boolean | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          is_published?: boolean | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          is_published?: boolean | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcement_pages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          linked_page_id: string | null
          priority: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          linked_page_id?: string | null
          priority?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          linked_page_id?: string | null
          priority?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_linked_page"
            columns: ["linked_page_id"]
            isOneToOne: false
            referencedRelation: "announcement_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          created_at: string | null
          end_at: string | null
          id: string
          meta: Json | null
          start_at: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_at?: string | null
          id?: string
          meta?: Json | null
          start_at: string
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_at?: string | null
          id?: string
          meta?: Json | null
          start_at?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      chapters: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean | null
          subject_id: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean | null
          subject_id: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean | null
          subject_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: Json | null
          created_at: string | null
          document_type: string | null
          elements: Json | null
          html_content: string | null
          id: string
          is_admin_created: boolean | null
          is_global: boolean | null
          paragraph_id: string | null
          title: string
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          document_type?: string | null
          elements?: Json | null
          html_content?: string | null
          id?: string
          is_admin_created?: boolean | null
          is_global?: boolean | null
          paragraph_id?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          document_type?: string | null
          elements?: Json | null
          html_content?: string | null
          id?: string
          is_admin_created?: boolean | null
          is_global?: boolean | null
          paragraph_id?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_paragraph_id_fkey"
            columns: ["paragraph_id"]
            isOneToOne: false
            referencedRelation: "paragraphs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          end_time: string
          event_type: string | null
          id: string
          learning_set_id: string | null
          recurrence: string | null
          start_time: string
          subject_id: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          event_type?: string | null
          id?: string
          learning_set_id?: string | null
          recurrence?: string | null
          start_time: string
          subject_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          event_type?: string | null
          id?: string
          learning_set_id?: string | null
          recurrence?: string | null
          start_time?: string
          subject_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          back_html: string | null
          back_image_url: string | null
          back_text: string
          created_at: string | null
          difficulty: number | null
          front_html: string | null
          front_image_url: string | null
          front_text: string
          id: string
          learning_set_id: string
          order_index: number | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          back_html?: string | null
          back_image_url?: string | null
          back_text: string
          created_at?: string | null
          difficulty?: number | null
          front_html?: string | null
          front_image_url?: string | null
          front_text: string
          id?: string
          learning_set_id: string
          order_index?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          back_html?: string | null
          back_image_url?: string | null
          back_text?: string
          created_at?: string | null
          difficulty?: number | null
          front_html?: string | null
          front_image_url?: string | null
          front_text?: string
          id?: string
          learning_set_id?: string
          order_index?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      folders: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_global: boolean | null
          name: string
          order_index: number | null
          paragraph_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_global?: boolean | null
          name: string
          order_index?: number | null
          paragraph_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_global?: boolean | null
          name?: string
          order_index?: number | null
          paragraph_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_paragraph_id_fkey"
            columns: ["paragraph_id"]
            isOneToOne: false
            referencedRelation: "paragraphs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_sets: {
        Row: {
          chapter_id: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_public: boolean | null
          paragraph_id: string | null
          subject_id: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          paragraph_id?: string | null
          subject_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          paragraph_id?: string | null
          subject_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_sets_paragraph_id_fkey"
            columns: ["paragraph_id"]
            isOneToOne: false
            referencedRelation: "paragraphs"
            referencedColumns: ["id"]
          },
        ]
      }
      leerset_items: {
        Row: {
          created_at: string | null
          definition: string
          id: string
          images: Json | null
          leerset_id: string | null
          term: string
        }
        Insert: {
          created_at?: string | null
          definition: string
          id?: string
          images?: Json | null
          leerset_id?: string | null
          term: string
        }
        Update: {
          created_at?: string | null
          definition?: string
          id?: string
          images?: Json | null
          leerset_id?: string | null
          term?: string
        }
        Relationships: [
          {
            foreignKeyName: "leerset_items_leerset_id_fkey"
            columns: ["leerset_id"]
            isOneToOne: false
            referencedRelation: "leersets"
            referencedColumns: ["id"]
          },
        ]
      }
      leersets: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          subject_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          subject_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          subject_id?: string | null
          title?: string
        }
        Relationships: []
      }
      mindmaps: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          paragraph_id: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: string
          paragraph_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          paragraph_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mindmaps_paragraph_id_fkey"
            columns: ["paragraph_id"]
            isOneToOne: false
            referencedRelation: "paragraphs"
            referencedColumns: ["id"]
          },
        ]
      }
      paragraphs: {
        Row: {
          chapter_id: string
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_global: boolean | null
          order_index: number | null
          title: string
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          chapter_id: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_global?: boolean | null
          order_index?: number | null
          title: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          chapter_id?: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_global?: boolean | null
          order_index?: number | null
          title?: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paragraphs_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_test_questions: {
        Row: {
          correct_answer: string
          created_at: string
          explanation: string | null
          id: string
          options: Json | null
          order_index: number | null
          question_text: string
          question_type: string
          test_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          order_index?: number | null
          question_text: string
          question_type: string
          test_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          order_index?: number | null
          question_text?: string
          question_type?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "practice_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_tests: {
        Row: {
          created_at: string
          description: string | null
          id: string
          subject_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          subject_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          subject_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_tests_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_tests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          correct_answers: number | null
          created_at: string | null
          finished_at: string | null
          id: string
          quiz_id: string
          score: number | null
          started_at: string | null
          time_taken_seconds: number | null
          total_questions: number | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          correct_answers?: number | null
          created_at?: string | null
          finished_at?: string | null
          id?: string
          quiz_id: string
          score?: number | null
          started_at?: string | null
          time_taken_seconds?: number | null
          total_questions?: number | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          correct_answers?: number | null
          created_at?: string | null
          finished_at?: string | null
          id?: string
          quiz_id?: string
          score?: number | null
          started_at?: string | null
          time_taken_seconds?: number | null
          total_questions?: number | null
          user_id?: string
        }
        Relationships: []
      }
      quizzes: {
        Row: {
          chapter_id: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          questions: Json | null
          quiz_type: string | null
          settings: Json | null
          subject_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          questions?: Json | null
          quiz_type?: string | null
          settings?: Json | null
          subject_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          chapter_id?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          questions?: Json | null
          quiz_type?: string | null
          settings?: Json | null
          subject_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          created_at: string
          id: string
          subject_id: string | null
          title: string
          type: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          subject_id?: string | null
          title: string
          type?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          subject_id?: string | null
          title?: string
          type?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_powerpoints: {
        Row: {
          created_at: string
          id: string
          slides: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          slides?: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          slides?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      srs_cards: {
        Row: {
          created_at: string | null
          due_at: string | null
          ease: number | null
          id: string
          interval: number | null
          lapses: number | null
          leerset_item_id: string | null
          repetitions: number | null
          suspended: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          due_at?: string | null
          ease?: number | null
          id?: string
          interval?: number | null
          lapses?: number | null
          leerset_item_id?: string | null
          repetitions?: number | null
          suspended?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          due_at?: string | null
          ease?: number | null
          id?: string
          interval?: number | null
          lapses?: number | null
          leerset_item_id?: string | null
          repetitions?: number | null
          suspended?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "srs_cards_leerset_item_id_fkey"
            columns: ["leerset_item_id"]
            isOneToOne: false
            referencedRelation: "leerset_items"
            referencedColumns: ["id"]
          },
        ]
      }
      srs_reviews: {
        Row: {
          card_id: string | null
          consecutive_correct: number | null
          created_at: string | null
          ease_factor: number | null
          id: string
          interval_days: number | null
          lapses: number | null
          last_reviewed_at: string | null
          next_review_date: string | null
          quality: number | null
          review_count: number | null
          user_id: string | null
        }
        Insert: {
          card_id?: string | null
          consecutive_correct?: number | null
          created_at?: string | null
          ease_factor?: number | null
          id?: string
          interval_days?: number | null
          lapses?: number | null
          last_reviewed_at?: string | null
          next_review_date?: string | null
          quality?: number | null
          review_count?: number | null
          user_id?: string | null
        }
        Update: {
          card_id?: string | null
          consecutive_correct?: number | null
          created_at?: string | null
          ease_factor?: number | null
          id?: string
          interval_days?: number | null
          lapses?: number | null
          last_reviewed_at?: string | null
          next_review_date?: string | null
          quality?: number | null
          review_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      study_plan_events: {
        Row: {
          created_at: string
          description: string | null
          end_time: string
          id: string
          is_completed: boolean | null
          plan_id: string
          start_time: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          is_completed?: boolean | null
          plan_id: string
          start_time: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          is_completed?: boolean | null
          plan_id?: string
          start_time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_plan_events_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plans: {
        Row: {
          created_at: string
          end_date: string | null
          goal: string | null
          id: string
          start_date: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          goal?: string | null
          id?: string
          start_date?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          goal?: string | null
          id?: string
          start_date?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      study_results: {
        Row: {
          completed_at: string | null
          correct_answers: number
          created_at: string | null
          id: string
          learning_set_id: string
          score: number
          study_mode: string
          time_spent_seconds: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          correct_answers: number
          created_at?: string | null
          id?: string
          learning_set_id: string
          score: number
          study_mode: string
          time_spent_seconds?: number | null
          total_questions: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          correct_answers?: number
          created_at?: string | null
          id?: string
          learning_set_id?: string
          score?: number
          study_mode?: string
          time_spent_seconds?: number | null
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_results_learning_set_id_fkey"
            columns: ["learning_set_id"]
            isOneToOne: false
            referencedRelation: "learning_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          created_at: string
          duration_seconds: number
          id: string
          subject_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds: number
          id?: string
          subject_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          id?: string
          subject_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_global: boolean | null
          is_public: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_global?: boolean | null
          is_public?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_global?: boolean | null
          is_public?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          is_completed: boolean | null
          subject_id: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          subject_id?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          subject_id?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string
          id: string
          is_global: boolean | null
          order_index: number | null
          subject_id: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_global?: boolean | null
          order_index?: number | null
          subject_id: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_global?: boolean | null
          order_index?: number | null
          subject_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_availability: {
        Row: {
          created_at: string | null
          day_of_week: number | null
          end_time: string
          id: string
          is_available: boolean | null
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week?: number | null
          end_time: string
          id?: string
          is_available?: boolean | null
          start_time: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number | null
          end_time?: string
          id?: string
          is_available?: boolean | null
          start_time?: string
          user_id?: string
        }
        Relationships: []
      }
      user_confidence: {
        Row: {
          confidence_level: number | null
          created_at: string | null
          id: string
          notes: string | null
          subject_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          subject_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence_level?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          subject_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_permission_overrides: {
        Row: {
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_enabled: boolean
          permission_key: string
          reason: string | null
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_enabled?: boolean
          permission_key: string
          reason?: string | null
          user_id: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_enabled?: boolean
          permission_key?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          preferences: Json | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          preferences?: Json | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          preferences?: Json | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          email_notifications: boolean | null
          id: string
          push_notifications: boolean | null
          study_reminders: boolean | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          push_notifications?: boolean | null
          study_reminders?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          push_notifications?: boolean | null
          study_reminders?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_permission: {
        Args: { perm_key: string; user_uuid: string }
        Returns: boolean
      }
      get_admin_setting: { Args: { key: string }; Returns: Json }
      get_unread_count: { Args: { user_uuid: string }; Returns: number }
      mark_announcement_read: {
        Args: { announcement_uuid: string; user_uuid: string }
        Returns: boolean
      }
      toggle_resource_global: {
        Args: {
          new_global_status: boolean
          resource_id: string
          resource_type: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
