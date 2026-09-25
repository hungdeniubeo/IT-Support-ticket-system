import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '../components/Button'
import { PageHeader } from '../components/PageHeader'

export function NotFoundPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader eyebrow="404 · Không tìm thấy trang" title="Trang này không tồn tại" description="Địa chỉ có thể không chính xác hoặc trang đã được chuyển đi." />
      <Link to="/"><Button><ArrowLeft size={15} />Về trang tổng quan</Button></Link>
    </div>
  )
}
