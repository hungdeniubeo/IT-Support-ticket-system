import { useEffect, useRef, useState } from 'react'
import { Download, FileText, Paperclip, Trash2, Upload } from 'lucide-react'
import type { TicketAttachment } from '../domain/attachment'
import { validateAttachment } from '../domain/ticketValidation'
import { formatDate } from '../lib/dates'
import { friendlyError } from '../lib/errors'
import { attachmentRepository } from '../services/activeAttachmentRepository'
import { Button } from './Button'
import { ConfirmDialog } from './ConfirmDialog'
import { useToast } from './ToastProvider'

function formatSize(size: number): string {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function AttachmentPanel({ ticketId }: { ticketId: string }) {
  const [files, setFiles] = useState<TicketAttachment[]>([])
  const [loading, setLoading] = useState(Boolean(attachmentRepository))
  const [busy, setBusy] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<TicketAttachment | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  useEffect(() => {
    setLoading(Boolean(attachmentRepository))
    setFiles([])
    if (!attachmentRepository) return
    let cancelled = false
    void attachmentRepository.list(ticketId)
      .then((result) => { if (!cancelled) setFiles(result) })
      .catch((error) => { if (!cancelled) showToast(friendlyError(error, 'Không thể tải tệp đính kèm.').message, 'error') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [ticketId, showToast])

  async function upload(file: File | undefined) {
    if (!file || !attachmentRepository) return
    const validationError = validateAttachment(file)
    if (validationError) { showToast(validationError, 'error'); return }
    setBusy(true)
    try {
      const attachment = await attachmentRepository.upload(ticketId, file)
      setFiles((current) => [attachment, ...current])
      showToast('Đã tải tệp lên')
    } catch (error) {
      showToast(friendlyError(error, 'Không thể tải tệp lên.').message, 'error')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function openAttachment(attachment: TicketAttachment) {
    if (!attachmentRepository) return
    try {
      const url = await attachmentRepository.signedUrl(attachment)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error) { showToast(friendlyError(error, 'Không thể mở tệp đính kèm.').message, 'error') }
  }

  async function downloadAttachment(attachment: TicketAttachment) {
    if (!attachmentRepository) return
    try {
      const url = await attachmentRepository.signedUrl(attachment, true)
      const link = document.createElement('a')
      link.href = url
      link.download = attachment.name
      link.rel = 'noopener noreferrer'
      document.body.append(link)
      link.click()
      link.remove()
    } catch (error) { showToast(friendlyError(error, 'Không thể tải tệp xuống.').message, 'error') }
  }

  async function removeAttachment() {
    if (!pendingDelete || !attachmentRepository) return
    setBusy(true)
    try {
      await attachmentRepository.delete(pendingDelete)
      setFiles((current) => current.filter((file) => file.id !== pendingDelete.id))
      showToast('Đã xóa tệp đính kèm')
      setPendingDelete(null)
    } catch (error) { showToast(friendlyError(error, 'Không thể xóa tệp đính kèm.').message, 'error') }
    finally { setBusy(false) }
  }

  return (
    <section className="border-b border-slate-200 pb-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-sm font-semibold text-slate-900">Tệp đính kèm</h2><p className="mt-0.5 text-xs text-slate-500">Ảnh chụp màn hình, PDF và tệp nhật ký (tối đa 10 MB)</p></div>
        {attachmentRepository && <>
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,.log" className="sr-only" aria-label="Chọn tệp đính kèm" onChange={(event) => void upload(event.currentTarget.files?.[0])} />
          <Button type="button" variant="secondary" disabled={busy} onClick={() => inputRef.current?.click()}><Upload size={15} />{busy ? 'Đang tải…' : 'Tải tệp lên'}</Button>
        </>}
      </div>
      {!attachmentRepository ? <p className="mt-3 rounded-md bg-slate-50 px-3 py-3 text-[13px] text-slate-500">Tệp đính kèm khả dụng sau khi kết nối Supabase.</p>
        : loading ? <div className="mt-4 space-y-2" aria-label="Đang tải tệp đính kèm">{[1, 2].map((item) => <div key={item} className="skeleton h-12 rounded" />)}</div>
          : files.length ? <ul className="mt-3 divide-y divide-slate-100 rounded-md border border-slate-200">
            {files.map((file) => <li key={file.id} className="flex items-center gap-3 px-3 py-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-500"><FileText size={16} /></span>
              <button type="button" onClick={() => void openAttachment(file)} className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"><span className="block truncate text-[13px] font-medium text-slate-800">{file.name}</span><span className="mt-0.5 block text-[11px] text-slate-400">{formatSize(file.size)} · {formatDate(file.createdAt)}</span></button>
              <button type="button" aria-label={`Tải ${file.name}`} onClick={() => void downloadAttachment(file)} className="flex size-8 shrink-0 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Download size={15} /></button>
              <button type="button" aria-label={`Xóa ${file.name}`} onClick={() => setPendingDelete(file)} className="flex size-8 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={15} /></button>
            </li>)}
          </ul> : <p className="mt-3 flex items-center gap-2 text-[13px] text-slate-500"><Paperclip size={15} />Chưa có tệp đính kèm.</p>}
      <ConfirmDialog open={Boolean(pendingDelete)} title="Xóa tệp đính kèm?" description={`Tệp ${pendingDelete?.name ?? ''} sẽ bị xóa khỏi ticket này.`} confirmLabel="Xóa tệp" destructive busy={busy} onCancel={() => setPendingDelete(null)} onConfirm={() => void removeAttachment()} />
    </section>
  )
}
