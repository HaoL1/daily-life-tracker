import { getPeriodRange, type DateRange, type PeriodKind } from '../../services/statisticsService'

export type ExportRange = PeriodKind | 'all' | 'yesterday' | 'yesterdayAndToday'

const chineseDateTime = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function resolveRange(
  type: ExportRange,
  records: Array<{ recordedAt: string }>,
  customStart: string,
  customEnd: string,
  now = new Date(),
): DateRange {
  if (type === 'yesterday') {
    const anchor = new Date(now)
    anchor.setDate(anchor.getDate() - 1)
    return getPeriodRange('day', anchor)
  }
  if (type === 'yesterdayAndToday') {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    return getPeriodRange('custom', now, { start: yesterday, end: now })
  }
  if (type === 'all') {
    if (!records.length) return getPeriodRange('day', now)
    const timestamps = records.map((record) => new Date(record.recordedAt).getTime())
    return getPeriodRange('custom', now, {
      start: new Date(Math.min(...timestamps)),
      end: new Date(Math.max(...timestamps)),
    })
  }
  if (type === 'custom') {
    const start = new Date(customStart)
    const selectedEnd = new Date(customEnd)
    if (Number.isNaN(start.getTime()) || Number.isNaN(selectedEnd.getTime())) {
      throw new Error('请选择有效的开始和结束时间')
    }
    if (selectedEnd < start) throw new Error('结束时间不能早于开始时间')

    const end = new Date(selectedEnd)
    end.setSeconds(59, 999)
    return {
      start,
      end,
      label: `${chineseDateTime.format(start)} 至 ${chineseDateTime.format(selectedEnd)}`,
    }
  }
  return getPeriodRange(type, now)
}
