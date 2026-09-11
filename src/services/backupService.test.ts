import { describe, expect, it } from 'vitest'
import { parseBackup } from './backupService'

const timestamp = new Date(2026, 8, 10, 12).toISOString()

function validBackup() {
  return {
    schemaVersion: 1,
    exportedAt: timestamp,
    activities: [{
      id: 'water',
      name: '喝水',
      icon: 'water',
      tone: 'link',
      mode: 'instant',
      defaultAmount: '250',
      unit: 'ml',
      sortOrder: 0,
      isArchived: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    }],
    records: [{
      id: 'record-1',
      activityId: 'water',
      activityName: '喝水',
      activityIcon: 'water',
      amount: '250',
      unit: 'ml',
      recordedAt: timestamp,
      note: '',
      createdAt: timestamp,
      updatedAt: timestamp,
    }],
    activeSessions: [],
    settings: {
      id: 'app',
      weekStartsOn: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  }
}

describe('backup validation', () => {
  it('accepts a complete version 1 backup', () => {
    const backup = parseBackup(JSON.stringify(validBackup()))
    expect(backup.records).toHaveLength(1)
    expect(backup.activities[0].name).toBe('喝水')
  })

  it('rejects malformed JSON and unknown versions', () => {
    expect(() => parseBackup('{bad json')).toThrow('不是有效的 JSON')
    expect(() => parseBackup(JSON.stringify({ ...validBackup(), schemaVersion: 2 }))).toThrow('不支持这个备份版本')
  })

  it('rejects records with invalid timestamps', () => {
    const backup = validBackup()
    backup.records[0].recordedAt = 'not-a-date'
    expect(() => parseBackup(JSON.stringify(backup))).toThrow('记录数据不完整')
  })
})
