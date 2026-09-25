import { useCallback, useEffect, useState } from 'react'
import type { Ticket } from '../domain/ticket'
import { ticketRepository } from '../services/ticketRepository'

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setTickets(await ticketRepository.list())
      setError(null)
    } catch {
      setError('Không thể tải danh sách ticket. Vui lòng làm mới trang và thử lại.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { tickets, loading, error, refresh }
}
