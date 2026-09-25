import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  NewTicket,
  Ticket,
  TicketDashboardSnapshot,
  TicketHistoryEntry,
  TicketPage,
  TicketQuery,
  TicketRepository,
  TicketStatus,
} from '../domain/ticket'
import { normalizeTicket } from '../domain/normalizeTicket'
import { validateNewTicket } from '../domain/ticketValidation'
import { buildTicketSearchFilter, filterTickets } from '../lib/ticketFilters'
import { prioritizeAttentionTickets } from '../lib/ticketStats'
import { friendlyError } from '../lib/errors'
import type { Database } from '../lib/database.types'

type TicketRow = Database['public']['Tables']['tickets']['Row']
type TicketInsert = Database['public']['Tables']['tickets']['Insert']
type HistoryRow = Database['public']['Tables']['ticket_history']['Row']

export function mapTicketRow(row: TicketRow | Record<string, unknown>): Ticket {
  const ticket = normalizeTicket({
    id: row.id,
    ticketNumber: row.ticket_number,
    customer: row.customer,
    title: row.title,
    description: row.description,
    category: row.category,
    priority: row.priority,
    status: row.status,
    investigation: row.investigation,
    rootCause: row.root_cause,
    solution: row.solution,
    internalNotes: row.internal_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
  if (!ticket) throw new Error('Supabase returned an invalid ticket row.')
  return ticket
}

function mapHistoryRow(row: HistoryRow): TicketHistoryEntry {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    userId: row.user_id,
    action: row.action,
    fieldName: row.field_name,
    oldValue: row.old_value,
    newValue: row.new_value,
    createdAt: row.created_at,
  }
}

function toTicketInsert(ticket: NewTicket, userId: string): TicketInsert {
  return {
    user_id: userId,
    customer: ticket.customer,
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    investigation: ticket.investigation,
    root_cause: ticket.rootCause,
    solution: ticket.solution,
    internal_notes: ticket.internalNotes,
  }
}

function toTicketUpdate(ticket: Ticket) {
  return {
    customer: ticket.customer,
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    investigation: ticket.investigation,
    root_cause: ticket.rootCause,
    solution: ticket.solution,
    internal_notes: ticket.internalNotes,
  }
}

function importInsert(ticket: Ticket, userId: string, preserveTicketNumber: boolean): TicketInsert {
  const row: TicketInsert = {
    ...toTicketInsert(ticket, userId),
    legacy_id: ticket.id,
    created_at: ticket.createdAt,
    updated_at: ticket.updatedAt,
  }
  if (preserveTicketNumber) row.ticket_number = ticket.ticketNumber
  return row
}

export function createSupabaseTicketRepository(client: SupabaseClient<Database>): TicketRepository {
  async function requireUserId(): Promise<string> {
    const { data, error } = await client.auth.getUser()
    if (error || !data.user) throw friendlyError(error, 'Vui lòng đăng nhập lại để tiếp tục.')
    return data.user.id
  }

  async function findImportedLegacyId(legacyId: string): Promise<boolean> {
    const { data, error } = await client.from('tickets').select('id').eq('legacy_id', legacyId).maybeSingle()
    if (error) throw friendlyError(error, 'Không thể kiểm tra dữ liệu đã nhập.')
    return Boolean(data)
  }

  return {
    async list(query: TicketQuery = {}): Promise<TicketPage> {
      const page = Math.max(1, Math.floor(query.page ?? 1))
      const pageSize = Math.min(100, Math.max(1, Math.floor(query.pageSize ?? 50)))
      const start = (page - 1) * pageSize
      let request = client.from('tickets')
        .select('*', { count: 'exact' })
        .order('updated_at', { ascending: false })
        .order('ticket_number', { ascending: false })
      if (query.status) request = request.eq('status', query.status)
      if (query.priority) request = request.eq('priority', query.priority)
      if (query.category) request = request.eq('category', query.category)
      if (query.search?.trim()) request = request.or(buildTicketSearchFilter(query.search))
      const { data, error, count } = await request.range(start, start + pageSize - 1)
      if (error) throw friendlyError(error, 'Không thể tải danh sách ticket. Vui lòng thử lại.')
      return {
        tickets: (data ?? []).map(mapTicketRow),
        total: count ?? 0,
        page,
        pageSize,
      }
    },

    async listAll(): Promise<Ticket[]> {
      const tickets: Ticket[] = []
      const pageSize = 500
      let page = 1
      let total = 0
      do {
        const result = await this.list({ page, pageSize })
        tickets.push(...result.tickets)
        total = result.total
        page += 1
      } while (tickets.length < total)
      return tickets
    },

    async getDashboard(): Promise<TicketDashboardSnapshot> {
      async function countFor(statuses?: TicketStatus[]): Promise<number> {
        let request = client.from('tickets').select('id', { count: 'exact', head: true })
        if (statuses?.length) request = request.in('status', statuses)
        const { count, error } = await request
        if (error) throw friendlyError(error, 'Không thể tải thống kê ticket.')
        return count ?? 0
      }

      const [total, newCount, investigating, waiting, completed, recentPage] = await Promise.all([
        countFor(),
        countFor(['new']),
        countFor(['investigating']),
        countFor(['waiting']),
        countFor(['resolved', 'closed']),
        this.list({ page: 1, pageSize: 6 }),
      ])
      const staleBefore = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const openStatuses: TicketStatus[] = ['new', 'investigating', 'waiting']
      const [critical, waitingTickets, stale] = await Promise.all([
        client.from('tickets').select('*').eq('priority', 'critical').in('status', openStatuses).order('updated_at', { ascending: false }).limit(6),
        client.from('tickets').select('*').eq('status', 'waiting').order('updated_at', { ascending: false }).limit(6),
        client.from('tickets').select('*').in('status', openStatuses).lt('updated_at', staleBefore).order('updated_at', { ascending: true }).limit(6),
      ])
      for (const result of [critical, waitingTickets, stale]) {
        if (result.error) throw friendlyError(result.error, 'Không thể tải ticket cần chú ý.')
      }
      const attention = new Map<string, Ticket>()
      for (const row of [...(critical.data ?? []), ...(waitingTickets.data ?? []), ...(stale.data ?? [])]) {
        const ticket = mapTicketRow(row)
        attention.set(ticket.id, ticket)
      }

      return {
        summary: { total, new: newCount, investigating, waiting, completed },
        recentTickets: recentPage.tickets,
        attentionTickets: prioritizeAttentionTickets(filterTickets([...attention.values()])).slice(0, 6),
      }
    },

    async get(ticketNumber) {
      const { data, error } = await client.from('tickets').select('*').eq('ticket_number', ticketNumber).maybeSingle()
      if (error) throw friendlyError(error, 'Không thể tải ticket này.')
      return data ? mapTicketRow(data) : undefined
    },

    async create(input) {
      if (Object.keys(validateNewTicket(input)).length) {
        throw new Error('Vui lòng kiểm tra các trường bắt buộc.')
      }
      const userId = await requireUserId()
      const { data, error } = await client.from('tickets').insert(toTicketInsert(input, userId)).select('*').single()
      if (error) throw friendlyError(error, 'Không thể tạo ticket. Vui lòng thử lại.')
      return mapTicketRow(data)
    },

    async update(ticket) {
      const { data, error } = await client.from('tickets').update(toTicketUpdate(ticket)).eq('id', ticket.id).select('*').single()
      if (error) throw friendlyError(error, 'Không thể lưu thay đổi. Vui lòng thử lại.')
      return mapTicketRow(data)
    },

    async delete(ticketNumber) {
      const { error } = await client.from('tickets').delete().eq('ticket_number', ticketNumber)
      if (error) throw friendlyError(error, 'Không thể xóa ticket. Vui lòng thử lại.')
    },

    async history(ticketNumber) {
      const ticket = await this.get(ticketNumber)
      if (!ticket) return []
      const { data, error } = await client.from('ticket_history').select('*').eq('ticket_id', ticket.id).order('created_at', { ascending: false })
      if (error) throw friendlyError(error, 'Không thể tải lịch sử hoạt động.')
      return (data ?? []).map(mapHistoryRow)
    },

    async importTickets(rawTickets) {
      const userId = await requireUserId()
      let imported = 0
      let skipped = 0
      let renumbered = 0

      for (const rawTicket of rawTickets) {
        const ticket = normalizeTicket(rawTicket)
        if (!ticket || await findImportedLegacyId(ticket.id)) {
          skipped += 1
          continue
        }

        const { data: existingNumber, error: lookupError } = await client.from('tickets')
          .select('id')
          .eq('ticket_number', ticket.ticketNumber)
          .maybeSingle()
        if (lookupError) throw friendlyError(lookupError, 'Không thể kiểm tra mã ticket hiện có.')
        if (existingNumber) {
          skipped += 1
          continue
        }

        const first = await client.from('tickets').insert(importInsert(ticket, userId, true)).select('*').single()
        if (!first.error) {
          imported += 1
          continue
        }
        if (first.error.code !== '23505') throw friendlyError(first.error, 'Không thể nhập dữ liệu ticket.')
        if (await findImportedLegacyId(ticket.id)) {
          skipped += 1
          continue
        }

        const retry = await client.from('tickets').insert(importInsert(ticket, userId, false)).select('*').single()
        if (retry.error) {
          if (retry.error.code === '23505' && await findImportedLegacyId(ticket.id)) {
            skipped += 1
            continue
          }
          throw friendlyError(retry.error, 'Không thể nhập dữ liệu ticket.')
        }
        imported += 1
        renumbered += 1
      }

      return { imported, skipped, renumbered }
    },
  }
}
