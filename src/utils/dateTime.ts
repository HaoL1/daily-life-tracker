import { format } from 'date-fns'

export function currentTimestamp(): number {
  return Date.now()
}

export function minutesAgoIso(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString()
}

export function toDateTimeInput(value = new Date().toISOString()): string {
  return format(new Date(value), "yyyy-MM-dd'T'HH:mm")
}

export function toDateInput(value = new Date()): string {
  return format(value, 'yyyy-MM-dd')
}

export function inputToIso(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error('请输入有效的日期和时间')
  return date.toISOString()
}

export function formatTime(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

export function formatDateHeading(value: string): string {
  const date = new Date(value)
  const today = toDateInput(new Date())
  const key = toDateInput(date)
  if (key === today) return '今天'

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (key === toDateInput(yesterday)) return '昨天'

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date)
}

export function formatFullDate(value = new Date()): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(value)
}

export function formatElapsed(startedAt: string, now = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60
  return hours
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}
