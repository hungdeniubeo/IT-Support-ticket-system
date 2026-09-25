import { useEffect, useState } from 'react'
import { Archive, X } from 'lucide-react'
import { inspectLocalMigration, completeLocalMigration, type LocalMigrationPreview } from '../services/localMigration'
import { ticketRepository } from '../services/activeTicketRepository'
import { getBrowserStorage } from '../services/browserStorage'
import { useToast } from './ToastProvider'
import { Button } from './Button'

export function LocalMigrationPrompt({ userId }: { userId: string }) {
  const [preview, setPreview] = useState<LocalMigrationPreview | null>(null)
  const [busy, setBusy] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    setPreview(inspectLocalMigration(getBrowserStorage(), userId))
  }, [userId])

  async function importTickets() {
    if (!preview || busy) return
    setBusy(true)
    try {
      const result = await ticketRepository.importTickets(preview.tickets)
      completeLocalMigration(getBrowserStorage(), userId, 'imported')
      setPreview(null)
      window.dispatchEvent(new Event('it-tickets-changed'))
      const renumberNote = result.renumbered ? `, ${result.renumbered} mã được đổi do trùng` : ''
      showToast(`Đã nhập ${result.imported} ticket${renumberNote}`)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể nhập dữ liệu ticket.', 'error')
    } finally { setBusy(false) }
  }

  function skip() {
    completeLocalMigration(getBrowserStorage(), userId, 'skipped')
    setPreview(null)
  }

  if (!preview) return null
  return (
    <section aria-labelledby="local-migration-heading" className="mb-5 flex flex-col gap-4 rounded-md border border-sky-200 bg-sky-50/70 px-4 py-3.5 sm:flex-row sm:items-center">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-white text-sky-700"><Archive size={17} /></span>
      <div className="min-w-0 flex-1"><h2 id="local-migration-heading" className="text-[13px] font-semibold text-slate-900">Phát hiện dữ liệu ticket trên thiết bị này</h2><p className="mt-0.5 text-xs leading-5 text-slate-600">Có {preview.count} ticket trong bản sao lưu cục bộ. Dữ liệu trên tài khoản hiện có sẽ được giữ nguyên; bản sao lưu vẫn còn trên thiết bị.</p></div>
      <div className="flex shrink-0 items-center gap-2"><Button type="button" disabled={busy} onClick={skip} className="h-9 px-3">Bỏ qua</Button><Button type="button" variant="primary" disabled={busy} onClick={() => void importTickets()} className="h-9 px-3">{busy ? 'Đang nhập…' : 'Nhập vào tài khoản'}</Button><button type="button" aria-label="Bỏ qua nhập dữ liệu" onClick={skip} className="flex size-8 items-center justify-center rounded text-slate-500 hover:bg-white hover:text-slate-900"><X size={16} /></button></div>
    </section>
  )
}
