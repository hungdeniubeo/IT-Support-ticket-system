const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export function formatDate(value: string, includeTime = true): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const formattedDate = dateFormatter.format(date)
  return includeTime ? `${formattedDate}, ${timeFormatter.format(date)}` : formattedDate
}
