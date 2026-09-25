export class AppError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message)
    this.name = 'AppError'
  }
}

export function friendlyError(error: unknown, fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.'): AppError {
  const source = error as { code?: unknown; message?: unknown; status?: unknown } | null
  const code = typeof source?.code === 'string' ? source.code : undefined
  const message = typeof source?.message === 'string' ? source.message : ''
  const normalized = message.toLocaleLowerCase('en-US')

  if (code === '23505') return new AppError('Mã ticket này đã tồn tại. Vui lòng tải lại dữ liệu.', code)
  if (code === '42501' || code === 'PGRST301') return new AppError('Bạn không có quyền thực hiện thao tác này.', code)
  if (code === 'PGRST116') return new AppError('Không tìm thấy dữ liệu yêu cầu.', code)
  if (normalized.includes('invalid login credentials')) return new AppError('Email hoặc mật khẩu chưa chính xác.', code)
  if (normalized.includes('email not confirmed')) return new AppError('Vui lòng xác nhận email trước khi đăng nhập.', code)
  if (source?.status === 429) return new AppError('Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.', code)
  if (normalized.includes('fetch') || normalized.includes('network')) return new AppError('Không thể kết nối máy chủ. Hãy kiểm tra mạng và thử lại.', code)

  if (import.meta.env.DEV && message) console.error('IT Support operation failed:', { code, message })
  return new AppError(fallback, code)
}
