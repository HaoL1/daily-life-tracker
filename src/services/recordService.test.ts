import { describe, expect, it } from 'vitest'
import { normalizeAmount } from './recordService'

describe('normalizeAmount', () => {
  it('accepts decimal comma and strips redundant leading zeroes', () => {
    expect(normalizeAmount('1,5')).toBe('1.5')
    expect(normalizeAmount('000250')).toBe('250')
  })

  it('rejects empty, zero, negative and non-numeric quantities', () => {
    expect(() => normalizeAmount('')).toThrow('必须大于 0')
    expect(() => normalizeAmount('0')).toThrow('必须大于 0')
    expect(() => normalizeAmount('-1')).toThrow('必须大于 0')
    expect(() => normalizeAmount('一杯')).toThrow('必须大于 0')
  })
})
