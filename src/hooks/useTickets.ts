import { useCallback, useEffect, useRef, useState } from 'react'
import type { Ticket, TicketQuery } from '../domain/ticket'
import { ticketRepository } from '../services/activeTicketRepository'

interface TicketListState {
  tickets: Ticket[]
  total: number
  page: number
  pageSize: number
}

export function useTickets(query: TicketQuery = {}) {
  const [data, setData] = useState<TicketListState>({ tickets: [], total: 0, page: query.page ?? 1, pageSize: query.pageSize ?? 50 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const requestId = useRef(0)
  const { search, status, priority, category, page = 1, pageSize = 50 } = query

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), [])

  useEffect(() => {
    window.addEventListener('it-tickets-changed', refresh)
    return () => window.removeEventListener('it-tickets-changed', refresh)
  }, [refresh])

  useEffect(() => {
    const currentRequest = ++requestId.current
    let cancelled = false
    setLoading(true)
    void ticketRepository.list({ search, status, priority, category, page, pageSize })
      .then((result) => {
        if (cancelled || currentRequest !== requestId.current) return
        setData(result)
        setError(null)
      })
      .catch(() => {
        if (!cancelled && currentRequest === requestId.current) {
          setError('Không thể tải danh sách ticket. Vui lòng thử lại.')
        }
      })
      .finally(() => {
        if (!cancelled && currentRequest === requestId.current) setLoading(false)
      })
    return () => { cancelled = true }
  }, [search, status, priority, category, page, pageSize, refreshKey])

  return { ...data, loading, error, refresh }
}
