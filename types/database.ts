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
      drafts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          title: string
          content: string
          content_type: string
          tone: string
          length: string
          metadata: Json
          is_published: boolean
          version: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          title: string
          content: string
          content_type: string
          tone: string
          length: string
          metadata?: Json
          is_published?: boolean
          version?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          title?: string
          content?: string
          content_type?: string
          tone?: string
          length?: string
          metadata?: Json
          is_published?: boolean
          version?: number
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          default_tone: string
          default_length: string
          default_content_type: string
          theme: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          default_tone?: string
          default_length?: string
          default_content_type?: string
          theme?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          default_tone?: string
          default_length?: string
          default_content_type?: string
          theme?: string
          created_at?: string
          updated_at?: string
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