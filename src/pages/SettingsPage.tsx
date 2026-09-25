import { useState } from 'react'
import { Database, Download, MonitorCog } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/Button'
import { ticketRepository } from '../services/ticketRepository'

export function SettingsPage() {
  const [exportError, setExportError] = useState('')

  async function exportTickets() {
    setExportError('')
    try {
      const tickets = await ticketRepository.list()
      const file = {
        format: 'it-support-ticket-system/v1',
        exportedAt: new Date().toISOString(),
        tickets,
      }
      const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `it-support-tickets-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
    } catch {
      setExportError('Không thể xuất dữ liệu. Vui lòng thử lại.')
    }
  }

  return (
    <>
      <PageHeader eyebrow="Tùy chọn" title="Cài đặt" description="Thông tin cơ bản về không gian lưu trữ ticket của bạn." />
      <section className="max-w-3xl overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.025)]">
        <div className="flex items-start gap-3.5 border-b border-slate-200 p-4 sm:p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600"><MonitorCog size={18} /></span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Không gian cá nhân</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Phiên bản này dành cho một nhân viên IT Support. Ticket được lưu trong hồ sơ trình duyệt hiện tại.</p>
          </div>
        </div>
        <div className="flex items-start gap-3.5 border-b border-slate-200 p-4 sm:p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600"><Database size={18} /></span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Lưu trên thiết bị này</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Ticket được lưu tự động trong trình duyệt và không đồng bộ giữa các thiết bị.</p>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">Hãy tạo bản sao lưu trước khi xóa dữ liệu trang web của trình duyệt.</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600"><Download size={18} /></span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Sao lưu dữ liệu</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Tải tất cả ticket về máy dưới dạng tệp JSON.</p>
            </div>
          </div>
          <Button onClick={() => void exportTickets()}><Download size={15} />Xuất dữ liệu</Button>
        </div>
        {exportError && <p role="alert" className="border-t border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:px-5">{exportError}</p>}
      </section>
    </>
  )
}
