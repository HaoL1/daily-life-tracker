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
})
