import { CircleAlert, Settings2 } from 'lucide-react'
import { Link } from 'react-router'
import { supabaseConfigurationMessage } from '../lib/supabase'
import { Button } from './Button'

export function ConfigNotice({ fullPage = false, allowLocal = false }: { fullPage?: boolean; allowLocal?: boolean }) {
  const content = (
    <section className={`border border-amber-200 bg-amber-50 text-amber-950 ${fullPage ? 'w-full max-w-lg rounded-lg p-6' : 'rounded-md px-3.5 py-2.5'}`} role="alert">
      <div className="flex items-start gap-3">
        <CircleAlert size={18} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">Cần cấu hình Supabase</h2>
          <p className="mt-1 text-sm leading-5 text-amber-900">{supabaseConfigurationMessage}</p>
          <p className="mt-1 text-xs leading-5 text-amber-900/80">Tạo tệp <code>.env.local</code> theo mẫu <code>.env.example</code>, sau đó khởi động lại ứng dụng.</p>
          {allowLocal && (
            <Link to="/dashboard" className="mt-3 inline-flex">
              <Button type="button" variant="secondary"><Settings2 size={15} />Tiếp tục chế độ cục bộ</Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  )

  if (!fullPage) return content
  return <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-8">{content}</main>
}
