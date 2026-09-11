import type { ActivityRecord } from '../domain/models'
import type { ActivitySummary, DateRange } from './statisticsService'
import { filterRecordsByRange } from './statisticsService'

const localDateTime = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

export function escapeCsv(value: string | number): string {
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function csvRow(values: Array<string | number>): string {
  return values.map(escapeCsv).join(',')
}

export function createRecordsCsv(records: ActivityRecord[], range: DateRange): string {
  const header = csvRow([
    '记录ID',
    '行为ID',
    '行为',
    '数量',
    '单位',
    '发生时间_ISO',
    '发生时间_本地',
    '开始时间_ISO',
    '结束时间_ISO',
    '持续秒数',
    '备注',
  ])
  const rows = filterRecordsByRange(records, range)
    .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt))
    .map((record) =>
      csvRow([
        record.id,
        record.activityId,
        record.activityName,
        record.amount,
        record.unit,
        record.recordedAt,
        localDateTime.format(new Date(record.recordedAt)),
        record.startedAt ?? '',
        record.endedAt ?? '',
        record.durationSeconds ?? '',
        record.note,
      ]),
    )
  return `\uFEFF${[header, ...rows].join('\r\n')}`
}

export function createSummaryCsv(summaries: ActivitySummary[], label: string): string {
  const header = csvRow([
    '统计范围',
    '行为',
    '单位',
    '记录次数',
    '总数量',
    '总时长_秒',
    '日均数量',
  ])
  const rows = summaries.map((summary) =>
    csvRow([
      label,
      summary.activityName,
      summary.unit,
      summary.recordCount,
      summary.totalAmount,
      summary.totalDurationSeconds,
      summary.averagePerDay,
    ]),
  )
  return `\uFEFF${[header, ...rows].join('\r\n')}`
}

export function createPlainText(
  records: ActivityRecord[],
  summaries: ActivitySummary[],
  range: DateRange,
): string {
  const filtered = filterRecordsByRange(records, range).sort((left, right) =>
    left.recordedAt.localeCompare(right.recordedAt),
  )
  const summaryLines = summaries.length
    ? summaries.map((item) => {
        const duration = item.totalDurationSeconds
          ? `，时长 ${formatDuration(item.totalDurationSeconds)}`
          : ''
        return `${item.activityName}：${item.totalAmount} ${item.unit}（${item.recordCount} 条${duration}）`
      })
    : ['暂无记录']
  const recordLines = filtered.length
    ? filtered.map((record) => {
        const duration = record.durationSeconds ? ` | ${formatDuration(record.durationSeconds)}` : ''
        const note = record.note ? ` | ${record.note}` : ''
        return `${localDateTime.format(new Date(record.recordedAt))} | ${record.activityName} | ${record.amount} ${record.unit}${duration}${note}`
      })
    : ['暂无记录']

  return [
    '日迹 · 生活记录',
    `范围：${range.label}`,
    `生成时间：${localDateTime.format(new Date())}`,
    '',
    '汇总',
    ...summaryLines,
    '',
    '明细',
    ...recordLines,
  ].join('\n')
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)
  if (hours) return `${hours}小时${minutes}分`
  if (minutes) return `${minutes}分${seconds ? `${seconds}秒` : ''}`
  return `${seconds}秒`
}

export function downloadTextFile(content: string, fileName: string, type: string): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
