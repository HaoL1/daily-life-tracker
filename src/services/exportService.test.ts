import { describe, expect, it } from 'vitest'
import type { ActivityRecord } from '../domain/models'
import { createRecordsCsv, escapeCsv } from './exportService'
import { getPeriodRange } from './statisticsService'

describe('CSV export', () => {
  it('escapes commas, quotes and line breaks using RFC 4180 rules', () => {
    expect(escapeCsv('早餐, "很好"\n第二行')).toBe('"早餐, ""很好""\n第二行"')
  })

  it('adds a UTF-8 BOM and preserves Chinese notes', () => {
    const timestamp = new Date(2026, 8, 10, 8, 15).toISOString()
    const record: ActivityRecord = {
      id: 'record-1',
      activityId: 'water',
      activityName: '喝水',
      activityIcon: 'water',
      amount: '250.5',
      unit: 'ml',
      recordedAt: timestamp,
      note: '早餐后, "温水"',
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    const output = createRecordsCsv([record], getPeriodRange('day', new Date(2026, 8, 10, 12)))

    expect(output.startsWith('\uFEFF')).toBe(true)
    expect(output).toContain('喝水')
    expect(output).toContain('"早餐后, ""温水"""')
  })
})
