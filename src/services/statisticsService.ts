import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  eachDayOfInterval,
  eachHourOfInterval,
  eachMonthOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns'
import type { ActivityIcon, ActivityRecord } from '../domain/models'

export type PeriodKind = 'day' | 'week' | 'month' | 'year' | 'custom'

export interface DateRange {
  start: Date
  end: Date
  label: string
}

export interface ActivitySummary {
  key: string
  activityId: string
  activityName: string
  activityIcon: ActivityIcon
  unit: string
  recordCount: number
  totalAmount: number
  totalDurationSeconds: number
  averagePerDay: number
}

export interface TrendPoint {
  key: string
  label: string
  count: number
}

const chineseDate = new Intl.DateTimeFormat('zh-CN', {
  month: 'short',
  day: 'numeric',
})

const chineseFullDate = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

export function getPeriodRange(
  period: PeriodKind,
  anchor: Date,
  custom?: { start: Date; end: Date },
): DateRange {
  if (period === 'custom') {
    const start = startOfDay(custom?.start ?? anchor)
    const end = endOfDay(custom?.end ?? anchor)
    if (end < start) throw new Error('结束日期不能早于开始日期')
    return {
      start,
      end,
      label: `${chineseFullDate.format(start)} 至 ${chineseFullDate.format(end)}`,
    }
  }

  if (period === 'day') {
    return {
      start: startOfDay(anchor),
      end: endOfDay(anchor),
      label: chineseFullDate.format(anchor),
    }
  }

  if (period === 'week') {
    const start = startOfWeek(anchor, { weekStartsOn: 1 })
    const end = endOfWeek(anchor, { weekStartsOn: 1 })
    return {
      start,
      end,
      label: `${chineseDate.format(start)} 至 ${chineseDate.format(end)}`,
    }
  }

  if (period === 'month') {
    return {
      start: startOfMonth(anchor),
      end: endOfMonth(anchor),
      label: `${anchor.getFullYear()}年${anchor.getMonth() + 1}月`,
    }
  }

  return {
    start: startOfYear(anchor),
    end: endOfYear(anchor),
    label: `${anchor.getFullYear()}年`,
  }
}

export function shiftPeriod(period: PeriodKind, anchor: Date, amount: number): Date {
  if (period === 'day') return addDays(anchor, amount)
  if (period === 'week') return addWeeks(anchor, amount)
  if (period === 'month') return addMonths(anchor, amount)
  if (period === 'year') return addYears(anchor, amount)
  return anchor
}

export function filterRecordsByRange(
  records: ActivityRecord[],
  range: DateRange,
): ActivityRecord[] {
  const start = range.start.getTime()
  const end = range.end.getTime()
  return records.filter((record) => {
    const timestamp = new Date(record.recordedAt).getTime()
    return timestamp >= start && timestamp <= end
  })
}

function roundAmount(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000
}

export function summarizeRecords(
  records: ActivityRecord[],
  range: DateRange,
): ActivitySummary[] {
  const summaries = new Map<string, ActivitySummary>()
  const dayCount = Math.max(1, differenceInCalendarDays(range.end, range.start) + 1)

  for (const record of filterRecordsByRange(records, range)) {
    const key = `${record.activityId}\u0000${record.unit}`
    const existing = summaries.get(key) ?? {
      key,
      activityId: record.activityId,
      activityName: record.activityName,
      activityIcon: record.activityIcon,
      unit: record.unit,
      recordCount: 0,
      totalAmount: 0,
      totalDurationSeconds: 0,
      averagePerDay: 0,
    }
    existing.recordCount += 1
    existing.totalAmount = roundAmount(existing.totalAmount + Number(record.amount))
    existing.totalDurationSeconds += record.durationSeconds ?? 0
    summaries.set(key, existing)
  }

  return [...summaries.values()]
    .map((summary) => ({
      ...summary,
      averagePerDay: roundAmount(summary.totalAmount / dayCount),
    }))
    .sort((left, right) => left.activityName.localeCompare(right.activityName, 'zh-CN'))
}

export function createTrend(
  records: ActivityRecord[],
  range: DateRange,
  period: PeriodKind,
): TrendPoint[] {
  const filtered = filterRecordsByRange(records, range)
  const customDays = differenceInCalendarDays(range.end, range.start) + 1
  const useMonths = period === 'year' || (period === 'custom' && customDays > 62)

  if (useMonths) {
    return eachMonthOfInterval({ start: range.start, end: range.end }).map((date) => {
      const key = format(date, 'yyyy-MM')
      return {
        key,
        label: `${date.getMonth() + 1}月`,
        count: filtered.filter((record) => format(new Date(record.recordedAt), 'yyyy-MM') === key)
          .length,
      }
    })
  }

  if (period === 'day') {
    return eachHourOfInterval({ start: range.start, end: range.end }).map((date) => {
      const key = format(date, 'yyyy-MM-dd-HH')
      return {
        key,
        label: format(date, 'HH'),
        count: filtered.filter(
          (record) => format(new Date(record.recordedAt), 'yyyy-MM-dd-HH') === key,
        ).length,
      }
    })
  }

  return eachDayOfInterval({ start: range.start, end: range.end }).map((date) => {
    const key = format(date, 'yyyy-MM-dd')
    return {
      key,
      label: period === 'week' ? ['日', '一', '二', '三', '四', '五', '六'][date.getDay()] : format(date, 'M/d'),
      count: filtered.filter((record) => format(new Date(record.recordedAt), 'yyyy-MM-dd') === key)
        .length,
    }
  })
}
