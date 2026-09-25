import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
const legacyAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
const apiKey = publishableKey || legacyAnonKey

export const isSupabaseConfigured = Boolean(url && apiKey)
export const supabaseConfigurationMessage = !url
  ? 'Thiếu VITE_SUPABASE_URL trong cấu hình môi trường.'
  : !apiKey
    ? 'Thiếu VITE_SUPABASE_PUBLISHABLE_KEY trong cấu hình môi trường.'
    : ''

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(url!, apiKey!, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
    })
  : null
