import { getPeriodRange, type DateRange, type PeriodKind } from '../../services/statisticsService'

export type ExportRange = PeriodKind | 'all' | 'yesterday' | 'yesterdayAndToday'

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
    return getPeriodRange('custom', now, {
      start: new Date(`${customStart}T12:00:00`),
      end: new Date(`${customEnd}T12:00:00`),
    })
  }
  return getPeriodRange(type, now)
}
