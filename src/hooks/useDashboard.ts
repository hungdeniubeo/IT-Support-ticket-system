import { useCallback, useEffect, useState } from 'react'
import type { TicketDashboardSnapshot } from '../domain/ticket'
import { ticketRepository } from '../services/activeTicketRepository'

const emptySnapshot: TicketDashboardSnapshot = {
  summary: { total: 0, new: 0, investigating: 0, waiting: 0, completed: 0 },
  recentTickets: [],
  attentionTickets: [],
}

export function useDashboard() {
  const [snapshot, setSnapshot] = useState(emptySnapshot)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = useCallback(() => setRefreshKey((value) => value + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void ticketRepository.getDashboard()
      .then((result) => {
        if (!cancelled) {
          setSnapshot(result)
          setError('')
        }
      })
      .catch(() => {
        if (!cancelled) setError('Không thể tải tổng quan ticket. Vui lòng thử lại.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [refreshKey])

  useEffect(() => {
    window.addEventListener('it-tickets-changed', refresh)
    return () => window.removeEventListener('it-tickets-changed', refresh)
  }, [refresh])

  return { ...snapshot, loading, error, refresh }
}
