const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export function formatDate(value: string, includeTime = true): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return (includeTime ? dateTimeFormatter : dateFormatter).format(date)
}
