export function LoadingScreen({ label = 'Đang khôi phục phiên đăng nhập…' }: { label?: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <span className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </main>
  )
}
