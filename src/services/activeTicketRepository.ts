import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { createSupabaseTicketRepository } from './supabaseTicketRepository'
import { ticketRepository as localTicketRepository } from './ticketRepository'

export const ticketRepository = isSupabaseConfigured && supabase
  ? createSupabaseTicketRepository(supabase)
  : localTicketRepository

export const isUsingSupabaseRepository = isSupabaseConfigured && Boolean(supabase)
