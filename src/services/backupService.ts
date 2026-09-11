import { db } from '../db/database'
import { createDefaultSettings } from '../domain/defaults'
import type { TrackerBackup } from '../domain/models'

export async function createBackup(): Promise<TrackerBackup> {
  const exportedAt = new Date().toISOString()
  const [activities, records, activeSessions, storedSettings] = await Promise.all([
    db.activities.toArray(),
    db.records.toArray(),
    db.activeSessions.toArray(),
    db.settings.get('app'),
  ])
  const settings = storedSettings ?? createDefaultSettings()

  await db.settings.put({ ...settings, lastBackupAt: exportedAt, updatedAt: exportedAt })
  return {
    schemaVersion: 1,
    exportedAt,
    activities,
    records,
    activeSessions,
    settings: { ...settings, lastBackupAt: exportedAt, updatedAt: exportedAt },
  }
}

export function parseBackup(contents: string): TrackerBackup {
  let candidate: unknown
  try {
    candidate = JSON.parse(contents)
  } catch {
    throw new Error('这个文件不是有效的 JSON 备份')
  }

  if (!candidate || typeof candidate !== 'object') throw new Error('备份内容为空')
  const backup = candidate as Partial<TrackerBackup>
  if (backup.schemaVersion !== 1) throw new Error('暂不支持这个备份版本')
  if (!isIsoDate(backup.exportedAt)) throw new Error('备份时间格式不正确')
  if (!Array.isArray(backup.activities) || !backup.activities.every(isActivity)) {
    throw new Error('备份中的行为数据不完整')
  }
  if (!Array.isArray(backup.records) || !backup.records.every(isRecord)) {
    throw new Error('备份中的记录数据不完整')
  }
  if (!Array.isArray(backup.activeSessions)) throw new Error('备份中的计时数据不完整')
  if (!backup.settings || backup.settings.id !== 'app') throw new Error('备份中的设置不完整')
  return backup as TrackerBackup
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function isActivity(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    (item.mode === 'instant' || item.mode === 'timer') &&
    typeof item.defaultAmount === 'string' &&
    typeof item.unit === 'string'
  )
}

function isRecord(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.activityId === 'string' &&
    typeof item.activityName === 'string' &&
    typeof item.amount === 'string' &&
    typeof item.unit === 'string' &&
    isIsoDate(item.recordedAt)
  )
}

export async function restoreBackup(backup: TrackerBackup): Promise<void> {
  await db.transaction(
    'rw',
    db.activities,
    db.records,
    db.activeSessions,
    db.settings,
    async () => {
      await Promise.all([
        db.activities.clear(),
        db.records.clear(),
        db.activeSessions.clear(),
        db.settings.clear(),
      ])
      await db.activities.bulkAdd(backup.activities)
      await db.records.bulkAdd(backup.records)
      await db.activeSessions.bulkAdd(backup.activeSessions)
      await db.settings.put(backup.settings)
    },
  )
}
