import { ArrowRight, BookOpenText, Lightbulb } from 'lucide-react'
import { Link } from 'react-router'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/Button'

export function KnowledgePage() {
  return (
    <>
      <PageHeader eyebrow="Thư viện tham khảo" title="Kiến thức" description="Lưu lại kinh nghiệm xử lý để dễ dàng tra cứu cho những lần hỗ trợ sau." />
      <section className="max-w-3xl rounded-md border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.025)] sm:p-6">
        <span className="flex size-10 items-center justify-center rounded-md bg-slate-100 text-slate-700"><BookOpenText size={19} /></span>
        <h2 className="mt-4 text-base font-semibold tracking-tight text-slate-900">Bắt đầu từ những ticket đã xử lý</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Mỗi ticket đã lưu gồm quá trình kiểm tra, nguyên nhân và cách xử lý. Bạn có thể dùng các ghi chú này để xây dựng thư viện hướng dẫn riêng trong giai đoạn tiếp theo.</p>
        <div className="mt-5 flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3.5">
          <Lightbulb size={17} className="mt-0.5 shrink-0 text-slate-500" />
          <p className="text-xs leading-5 text-slate-600">Hãy ghi lại các bước đã kiểm tra, nguyên nhân tìm được và cách khắc phục cụ thể.</p>
        </div>
        <Link to="/tickets" className="mt-5 inline-flex"><Button>Xem ticket<ArrowRight size={15} /></Button></Link>
      </section>
    </>
  )
}
