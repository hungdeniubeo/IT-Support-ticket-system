import { useRef, useState } from 'react'
import { Database, Download, MonitorCog, Upload, UserRound } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/Button'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useAuth } from '../auth/AuthProvider'
import { isUsingSupabaseRepository, ticketRepository } from '../services/activeTicketRepository'
import { normalizeTicket } from '../domain/normalizeTicket'
import type { Ticket } from '../domain/ticket'
import { useToast } from '../components/ToastProvider'

function readImportTickets(raw: unknown): Ticket[] {
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as { tickets?: unknown }).tickets)) throw new Error('Tệp không có danh sách ticket hợp lệ.')
  const tickets = (raw as { tickets: unknown[] }).tickets.map(normalizeTicket).filter((ticket): ticket is Ticket => ticket !== null)
  if (!tickets.length) throw new Error('Không tìm thấy ticket hợp lệ trong tệp.')
  return tickets
}

export function SettingsPage() {
  const auth = useAuth()
  const { showToast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<Ticket[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [importError, setImportError] = useState('')

  async function exportTickets() {
    try {
      const tickets = await ticketRepository.listAll()
      const file = { format: 'it-support-ticket-system/v1', exportedAt: new Date().toISOString(), tickets }
      const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `it-support-tickets-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
      showToast(`Đã xuất ${tickets.length} ticket`)
    } catch (error) { showToast(error instanceof Error ? error.message : 'Không thể xuất dữ liệu. Vui lòng thử lại.', 'error') }
  }

  async function selectImport(file: File | undefined) {
    if (!file) return
    setImportError('')
    try {
      const raw: unknown = JSON.parse(await file.text())
      setPendingImport(readImportTickets(raw))
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Tệp JSON không hợp lệ.')
      showToast(error instanceof Error ? error.message : 'Tệp JSON không hợp lệ.', 'error')
    } finally { if (fileRef.current) fileRef.current.value = '' }
  }

  async function importTickets() {
    if (!pendingImport || busy) return
    setBusy(true)
    try {
      const result = await ticketRepository.importTickets(pendingImport)
      setPendingImport(null)
      setImportError('')
      window.dispatchEvent(new Event('it-tickets-changed'))
      showToast(`Đã nhập ${result.imported} ticket${result.skipped ? ` · bỏ qua ${result.skipped} ticket trùng hoặc không hợp lệ` : ''}`)
    } catch (error) { showToast(error instanceof Error ? error.message : 'Không thể nhập dữ liệu. Vui lòng thử lại.', 'error') }
    finally { setBusy(false) }
  }

  const displayName = typeof auth.user?.user_metadata.display_name === 'string' && auth.user.user_metadata.display_name.trim()
    ? auth.user.user_metadata.display_name : auth.user?.email ?? 'Nhân viên IT'

  return (
    <>
      <PageHeader eyebrow="Tùy chọn" title="Cài đặt" description="Quản lý tài khoản, dữ liệu và tùy chọn giao diện." />
      <div className="max-w-3xl divide-y divide-slate-200 rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.025)]">
        <section className="flex items-start gap-3.5 p-4 sm:p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600"><UserRound size={18} /></span>
          <div className="min-w-0 flex-1"><h2 className="text-sm font-semibold text-slate-900">Tài khoản</h2><p className="mt-1 text-sm text-slate-600">{displayName}</p><p className="mt-0.5 text-xs text-slate-500">{auth.user?.email ?? 'Chế độ phát triển cục bộ'}</p></div>
        </section>

        <section className="flex items-start gap-3.5 p-4 sm:p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600"><Database size={18} /></span>
          <div className="min-w-0 flex-1"><h2 className="text-sm font-semibold text-slate-900">Dữ liệu</h2><p className="mt-1 text-sm leading-6 text-slate-500">{isUsingSupabaseRepository ? 'Ticket được lưu an toàn trong Supabase và đồng bộ giữa các thiết bị.' : 'Ticket được lưu cục bộ trong trình duyệt này. Kết nối Supabase để đồng bộ trên các thiết bị.'}</p><p className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-slate-600"><span className={`size-1.5 rounded-full ${isUsingSupabaseRepository ? 'bg-emerald-500' : 'bg-amber-500'}`} />{isUsingSupabaseRepository ? 'Kết nối Supabase đang hoạt động' : 'Đang dùng bộ lưu trữ trên thiết bị'}</p></div>
        </section>

        <section className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3.5"><span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600"><Download size={18} /></span><div><h2 className="text-sm font-semibold text-slate-900">Xuất dữ liệu JSON</h2><p className="mt-1 text-sm leading-6 text-slate-500">Tải bản sao lưu đầy đủ các ticket trong tài khoản hiện tại.</p></div></div>
          <Button onClick={() => void exportTickets()}><Download size={15} />Xuất dữ liệu</Button>
        </section>

        <section className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3.5"><span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600"><Upload size={18} /></span><div><h2 className="text-sm font-semibold text-slate-900">Nhập dữ liệu JSON / local backup</h2><p className="mt-1 max-w-lg text-sm leading-6 text-slate-500">Dữ liệu được gộp vào tài khoản. Ticket đã có sẽ không bị ghi đè; các bản sao trùng mã sẽ được bỏ qua.</p>{importError && <p role="alert" className="mt-2 text-xs text-rose-700">{importError}</p>}</div></div>
          <div className="shrink-0"><input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" aria-label="Chọn tệp JSON để nhập" onChange={(event) => void selectImport(event.currentTarget.files?.[0])} /><Button onClick={() => fileRef.current?.click()}><Upload size={15} />Chọn tệp</Button></div>
        </section>

        <section className="flex items-start gap-3.5 p-4 sm:p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600"><MonitorCog size={18} /></span>
          <div><h2 className="text-sm font-semibold text-slate-900">Giao diện</h2><p className="mt-1 text-sm leading-6 text-slate-500">Giao diện sáng · Tối ưu cho máy tính và thiết bị di động.</p></div>
        </section>
      </div>
      <ConfirmDialog open={Boolean(pendingImport)} title={`Nhập ${pendingImport?.length ?? 0} ticket?`} description="Ticket hiện có sẽ được giữ nguyên. Những ticket trùng mã sẽ được bỏ qua và không có dữ liệu nào bị ghi đè." confirmLabel="Nhập ticket" busy={busy} onCancel={() => setPendingImport(null)} onConfirm={() => void importTickets()} />
    </>
  )
}
