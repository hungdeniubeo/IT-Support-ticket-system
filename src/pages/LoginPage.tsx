import { useState, type FormEvent } from 'react'
import { LifeBuoy, LogIn } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthProvider'
import { Button } from '../components/Button'
import { ConfigNotice } from '../components/ConfigNotice'
import { LoadingScreen } from '../components/LoadingScreen'

export function LoginPage() {
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (auth.loading) return <LoadingScreen />
  if (auth.configured && auth.session) return <Navigate to="/dashboard" replace />
  if (!auth.configured) return <ConfigNotice fullPage allowLocal={import.meta.env.DEV} />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalError('')
    if (!email.trim() || !password) {
      setLocalError('Nhập email và mật khẩu để đăng nhập.')
      return
    }
    setSubmitting(true)
    try {
      await auth.signIn(email, password)
      const requestedPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
      navigate(requestedPath?.startsWith('/') && requestedPath !== '/login' ? requestedPath : '/dashboard', { replace: true })
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Không thể đăng nhập. Vui lòng thử lại.')
      setSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-8">
      <section className="w-full max-w-[400px] rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex size-10 items-center justify-center rounded-md bg-slate-900 text-white"><LifeBuoy size={20} /></div>
        <p className="mt-5 text-xs font-medium text-slate-500">IT Support</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Đăng nhập</h1>
        <p className="mt-1.5 text-sm leading-5 text-slate-500">Đăng nhập để tiếp tục quản lý yêu cầu hỗ trợ IT.</p>

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-[13px] font-medium text-slate-700">Email</label>
            <input id="login-email" name="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200" required autoFocus />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-1.5 block text-[13px] font-medium text-slate-700">Mật khẩu</label>
            <input id="login-password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200" required />
          </div>
          {(localError || auth.error) && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{localError || auth.error}</p>}
          <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
            <LogIn size={16} />{submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </Button>
        </form>
        <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">Tài khoản được quản lý trong Supabase Auth.</p>
      </section>
    </main>
  )
}
