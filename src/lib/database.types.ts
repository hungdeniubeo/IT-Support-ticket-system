export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string | null; created_at: string; updated_at: string }
        Insert: { id: string; display_name?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; display_name?: string | null; created_at?: string; updated_at?: string }
        Relationships: []
      }
      tickets: {
        Row: {
          id: string
          ticket_number: string
          user_id: string
          legacy_id: string | null
          customer: string
          title: string
          description: string
          category: string
          priority: 'low' | 'medium' | 'high' | 'critical'
          status: 'new' | 'investigating' | 'waiting' | 'resolved' | 'closed'
          investigation: string
          root_cause: string
          solution: string
          internal_notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ticket_number?: string
          user_id?: string
          legacy_id?: string | null
          customer: string
          title: string
          description?: string
          category: string
          priority: 'low' | 'medium' | 'high' | 'critical'
          status?: 'new' | 'investigating' | 'waiting' | 'resolved' | 'closed'
          investigation?: string
          root_cause?: string
          solution?: string
          internal_notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ticket_number?: string
          user_id?: string
          legacy_id?: string | null
          customer?: string
          title?: string
          description?: string
          category?: string
          priority?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'new' | 'investigating' | 'waiting' | 'resolved' | 'closed'
          investigation?: string
          root_cause?: string
          solution?: string
          internal_notes?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ticket_history: {
        Row: {
          id: string
          ticket_id: string
          user_id: string
          action: 'created' | 'updated' | 'status_changed' | 'priority_changed' | 'resolved' | 'reopened'
          field_name: string | null
          old_value: string | null
          new_value: string | null
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          user_id: string
          action: 'created' | 'updated' | 'status_changed' | 'priority_changed' | 'resolved' | 'reopened'
          field_name?: string | null
          old_value?: string | null
          new_value?: string | null
          created_at?: string
        }
        Update: never
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
