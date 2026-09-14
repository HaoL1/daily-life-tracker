import { describe, expect, it } from 'vitest'
import { resolveRange } from './exportRange'

describe('resolveRange', () => {
  it('uses today as the default export range baseline and supports yesterday', () => {
    const now = new Date(2026, 8, 12, 15, 30)
    const range = resolveRange('yesterday', [], '2026-09-01', '2026-09-12', now)

    expect(range.start.getFullYear()).toBe(2026)
    expect(range.start.getMonth()).toBe(8)
    expect(range.start.getDate()).toBe(11)
    expect(range.end.getDate()).toBe(11)
  })

  it('includes all of yesterday and today in the combined range', () => {
    const now = new Date(2026, 8, 12, 15, 30)
    const range = resolveRange('yesterdayAndToday', [], '2026-09-01', '2026-09-12', now)

    expect(range.start).toEqual(new Date(2026, 8, 11, 0, 0, 0, 0))
    expect(range.end).toEqual(new Date(2026, 8, 12, 23, 59, 59, 999))
    expect(range.label).toContain('2026年9月11日')
    expect(range.label).toContain('2026年9月12日')
  })

  it('uses custom start and end times with minute precision', () => {
    const range = resolveRange(
      'custom',
      [],
      '2026-09-11T08:15',
      '2026-09-12T17:42',
      new Date(2026, 8, 12, 18, 0),
    )

    expect(range.start).toEqual(new Date(2026, 8, 11, 8, 15, 0, 0))
    expect(range.end).toEqual(new Date(2026, 8, 12, 17, 42, 59, 999))
    expect(range.label).toContain('08:15')
    expect(range.label).toContain('17:42')
  })

  it('rejects a custom end time before the start time', () => {
    expect(() => resolveRange(
      'custom',
      [],
      '2026-09-12T17:43',
      '2026-09-12T17:42',
    )).toThrow('结束时间不能早于开始时间')
  })
})
