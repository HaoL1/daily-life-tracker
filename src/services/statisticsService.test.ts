import { describe, expect, it } from 'vitest'
import type { ActivityRecord } from '../domain/models'
import {
  filterRecordsByRange,
  getPeriodRange,
  summarizeRecords,
} from './statisticsService'

function makeRecord(overrides: Partial<ActivityRecord> = {}): ActivityRecord {
  const timestamp = new Date(2026, 8, 7, 8, 30).toISOString()
  return {
    id: crypto.randomUUID(),
    activityId: 'water',
    activityName: '喝水',
    activityIcon: 'water',
    amount: '250',
    unit: 'ml',
    recordedAt: timestamp,
    note: '',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  }
}

describe('getPeriodRange', () => {
  it('uses Monday as the first day of a natural week', () => {
    const range = getPeriodRange('week', new Date(2026, 8, 10, 12))

    expect(range.start.getDay()).toBe(1)
    expect(range.start.getDate()).toBe(7)
    expect(range.end.getDay()).toBe(0)
    expect(range.end.getDate()).toBe(13)
  })

  it('includes leap day in a leap-year month', () => {
    const range = getPeriodRange('month', new Date(2028, 1, 12))
    expect(range.end.getDate()).toBe(29)
  })
})

describe('record statistics', () => {
  it('keeps different units in separate summaries', () => {
    const range = getPeriodRange('day', new Date(2026, 8, 7, 12))
    const summaries = summarizeRecords([
      makeRecord(),
      makeRecord({ id: crypto.randomUUID(), amount: '0.5', unit: 'L' }),
    ], range)

    expect(summaries).toHaveLength(2)
    expect(summaries.find((item) => item.unit === 'ml')?.totalAmount).toBe(250)
    expect(summaries.find((item) => item.unit === 'L')?.totalAmount).toBe(0.5)
  })

  it('sums duration while preserving the original amount', () => {
    const range = getPeriodRange('day', new Date(2026, 8, 7, 12))
    const summaries = summarizeRecords([
      makeRecord({
        activityId: 'exercise',
        activityName: '锻炼',
        activityIcon: 'exercise',
        amount: '1',
        unit: '次',
        durationSeconds: 1800,
      }),
      makeRecord({
        id: crypto.randomUUID(),
        activityId: 'exercise',
        activityName: '锻炼',
        activityIcon: 'exercise',
        amount: '1',
        unit: '次',
        durationSeconds: 900,
      }),
    ], range)

    expect(summaries[0].recordCount).toBe(2)
    expect(summaries[0].totalAmount).toBe(2)
    expect(summaries[0].totalDurationSeconds).toBe(2700)
  })

  it('excludes records outside the selected local day', () => {
    const range = getPeriodRange('day', new Date(2026, 8, 7, 12))
    const records = [
      makeRecord(),
      makeRecord({ id: crypto.randomUUID(), recordedAt: new Date(2026, 8, 8, 0, 1).toISOString() }),
    ]
    expect(filterRecordsByRange(records, range)).toHaveLength(1)
  })
})
