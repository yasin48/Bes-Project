import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          user_id: string
          event_name: string
          metric_1: number
          metric_2: number
          calculated_score: number
          calculated_token_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_name: string
          metric_1: number
          metric_2: number
          calculated_score: number
          calculated_token_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_name?: string
          metric_1?: number
          metric_2?: number
          calculated_score?: number
          calculated_token_amount?: number
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          total_earnings: number
          created_at: string
        }
        Insert: {
          id: string
          email: string
          total_earnings?: number
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          total_earnings?: number
          created_at?: string
        }
      }
    }
  }
}
