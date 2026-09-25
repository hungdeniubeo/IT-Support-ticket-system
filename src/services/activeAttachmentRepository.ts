import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { createSupabaseAttachmentRepository } from './supabaseAttachmentRepository'

export const attachmentRepository = isSupabaseConfigured && supabase
  ? createSupabaseAttachmentRepository(supabase)
  : null
