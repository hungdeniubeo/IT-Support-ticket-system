import { useState } from 'react'
import { BookOpenText, ChevronRight, CircleHelp, ClipboardList, LayoutDashboard, LifeBuoy, Menu, Settings2, X } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'

const navigation = [
  { label: 'Tổng quan', to: '/', icon: LayoutDashboard, end: true },
  { label: 'Ticket hỗ trợ', to: '/tickets', icon: ClipboardList, end: false },
  { label: 'Kiến thức', to: '/knowledge', icon: BookOpenText, end: false },
  { label: 'Cài đặt', to: '/settings', icon: Settings2, end: false },
]

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <span className="flex size-8 items-center justify-center rounded-md bg-slate-100 text-slate-900"><LifeBuoy size={18} strokeWidth={1.8} /></span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-white">IT Support</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Sổ tay hỗ trợ IT</p>
        </div>
      </div>
      <nav aria-label="Điều hướng chính" className="px-3 py-6">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Không gian làm việc</p>
        <div className="space-y-1">
          {navigation.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={label}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) => `group relative flex h-10 items-center gap-3 rounded-md px-3 text-[13px] font-medium transition-colors duration-150 ${isActive ? 'bg-white/[0.09] text-white before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-slate-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}`}
            >
              {({ isActive }) => <><Icon size={17} strokeWidth={1.8} /><span className="flex-1">{label}</span>{isActive && <ChevronRight size={14} className="text-slate-400" />}</>}
            </NavLink>
          ))}
        </div>
      </nav>
      <div className="mt-auto border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-slate-700 text-[10px] font-semibold text-slate-100">IT</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-200">Không gian IT Support</p>
            <p className="mt-0.5 truncate text-[10px] text-slate-500">Dữ liệu trên thiết bị này</p>
          </div>
          <CircleHelp size={15} className="text-slate-500" />
        </div>
      </div>
    </>
  )
}

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[216px] flex-col bg-[#172333] lg:flex">
        <Sidebar />
      </aside>

      <div className="lg:pl-[216px]">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3">
            <button type="button" className="flex size-9 items-center justify-center rounded-md text-slate-600 transition-colors duration-150 hover:bg-slate-100 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Mở menu">
              <Menu size={20} />
            </button>
            <span className="whitespace-nowrap text-[12px] font-medium text-slate-500">IT Support</span>
            <span className="hidden text-slate-300 sm:inline">/</span>
            <span className="hidden whitespace-nowrap text-[12px] text-slate-700 sm:inline">Quản lý yêu cầu hỗ trợ</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span className="sm:hidden">Đã lưu</span>
            <span className="hidden sm:inline">Đã lưu trên thiết bị</span>
          </div>
        </header>

        {menuOpen && (
          <div className="fixed inset-0 z-30 bg-slate-950/25 transition-opacity duration-150 lg:hidden" role="presentation" onClick={() => setMenuOpen(false)}>
            <aside className="relative flex h-full w-[260px] flex-col bg-[#172333] shadow-xl transition-transform duration-150" onClick={(event) => event.stopPropagation()}>
              <button type="button" onClick={() => setMenuOpen(false)} className="absolute right-3 top-4 flex size-8 items-center justify-center rounded-md text-slate-400 transition-colors duration-150 hover:bg-white/10 hover:text-white" aria-label="Đóng menu"><X size={18} /></button>
              <Sidebar onNavigate={() => setMenuOpen(false)} />
            </aside>
          </div>
        )}

        <main className="mx-auto min-h-[calc(100vh-56px)] max-w-[1440px] px-4 py-6 sm:px-7 sm:py-7 lg:px-9">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
