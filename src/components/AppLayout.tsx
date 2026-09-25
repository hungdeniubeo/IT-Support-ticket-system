import { useEffect, useRef, useState } from 'react'
import { BookOpenText, ChevronRight, ClipboardList, LayoutDashboard, LifeBuoy, LogOut, Menu, Settings2, X } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthProvider'
import { isUsingSupabaseRepository } from '../services/activeTicketRepository'
import { ConfigNotice } from './ConfigNotice'
import { useToast } from './ToastProvider'
import { LocalMigrationPrompt } from './LocalMigrationPrompt'

const navigation = [
  { label: 'Tổng quan', to: '/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Ticket hỗ trợ', to: '/tickets', icon: ClipboardList, end: false },
  { label: 'Kiến thức', to: '/knowledge', icon: BookOpenText, end: false },
  { label: 'Cài đặt', to: '/settings', icon: Settings2, end: false },
]

function Sidebar({ onNavigate, onSignOut }: { onNavigate?: () => void; onSignOut(): void }) {
  const { user } = useAuth()
  const displayName = typeof user?.user_metadata.display_name === 'string' && user.user_metadata.display_name.trim()
    ? user.user_metadata.display_name
    : user?.email ?? 'Nhân viên IT'
  const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4">
        <span className="flex size-8 items-center justify-center rounded-md bg-slate-100 text-slate-900"><LifeBuoy size={18} strokeWidth={1.8} /></span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-white">IT Support</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Quản lý yêu cầu hỗ trợ</p>
        </div>
      </div>
      <nav aria-label="Điều hướng chính" className="px-3 py-5">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500">Không gian làm việc</p>
        <div className="space-y-1">
          {navigation.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={label}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) => `group relative flex h-10 items-center gap-3 rounded-md px-3 text-[13px] font-medium transition-colors duration-150 ${isActive ? 'bg-white/[0.1] text-white before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-slate-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}`}
            >
              {({ isActive }) => <><Icon size={17} strokeWidth={1.8} /><span className="flex-1">{label}</span>{isActive && <ChevronRight size={14} className="text-slate-400" />}</>}
            </NavLink>
          ))}
        </div>
      </nav>
      <div className="mt-auto border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-semibold text-slate-100">{initials || 'IT'}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-200">{user ? displayName : 'Không gian cục bộ'}</p>
            <p className="mt-0.5 truncate text-[10px] text-slate-500">{user?.email ?? 'Dữ liệu trên thiết bị này'}</p>
          </div>
          {user && (
            <button type="button" onClick={onSignOut} aria-label="Đăng xuất" title="Đăng xuất" className="flex size-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </>
  )
}

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLElement>(null)
  const auth = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()

  useEffect(() => {
    if (!menuOpen) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    drawerRef.current?.querySelector<HTMLElement>('button, a[href]')?.focus()
    function handleDrawerKeys(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setMenuOpen(false)
        return
      }
      if (event.key !== 'Tab' || !drawerRef.current) return
      const items = drawerRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', handleDrawerKeys)
    return () => {
      document.removeEventListener('keydown', handleDrawerKeys)
      if (previous?.isConnected) previous.focus()
    }
  }, [menuOpen])

  async function signOut() {
    try {
      await auth.signOut()
      setMenuOpen(false)
      navigate('/login', { replace: true })
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể đăng xuất.', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[220px] flex-col bg-[#192635] lg:flex">
        <Sidebar onSignOut={() => void signOut()} />
      </aside>

      <div className="lg:pl-[220px]">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button ref={menuTriggerRef} type="button" className="flex size-9 items-center justify-center rounded-md text-slate-600 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Mở menu điều hướng">
              <Menu size={20} />
            </button>
            <span className="whitespace-nowrap text-[12px] font-medium text-slate-500">IT Support</span>
            <span className="hidden text-slate-300 sm:inline">/</span>
            <span className="hidden truncate text-[12px] text-slate-700 sm:inline">Quản lý yêu cầu hỗ trợ</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-[11px] font-medium text-slate-500">
            <span className={`size-1.5 rounded-full ${isUsingSupabaseRepository ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="hidden sm:inline">{isUsingSupabaseRepository ? 'Đã kết nối Supabase' : 'Lưu trên thiết bị'}</span>
            <span className="sm:hidden">{isUsingSupabaseRepository ? 'Đã đồng bộ' : 'Cục bộ'}</span>
          </div>
        </header>

        <main className="mx-auto min-h-[calc(100vh-56px)] max-w-[1440px] px-4 py-6 sm:px-7 sm:py-7 lg:px-9">
          {!auth.configured && import.meta.env.DEV && <ConfigNotice />}
          {auth.user && isUsingSupabaseRepository && <div className={!auth.configured && import.meta.env.DEV ? 'mt-5' : undefined}><LocalMigrationPrompt userId={auth.user.id} /></div>}
          <div className={!auth.configured && import.meta.env.DEV ? 'mt-5' : undefined}>
            <Outlet />
          </div>
        </main>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setMenuOpen(false) }}>
          <aside ref={drawerRef} className="drawer-enter relative flex h-full w-[min(280px,86vw)] flex-col bg-[#192635] shadow-xl" role="dialog" aria-modal="true" aria-label="Menu điều hướng">
            <button type="button" onClick={() => setMenuOpen(false)} className="absolute right-3 top-4 flex size-8 items-center justify-center rounded-md text-slate-400 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400" aria-label="Đóng menu"><X size={18} /></button>
            <Sidebar onNavigate={() => setMenuOpen(false)} onSignOut={() => void signOut()} />
          </aside>
        </div>
      )}
    </div>
  )
}
