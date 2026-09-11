import { db } from '../db/database'
import type {
  ActiveSession,
  ActivityDefinition,
  ActivityRecord,
  RecordDraft,
} from '../domain/models'

function createId(): string {
  return crypto.randomUUID()
}

export function normalizeAmount(value: string): string {
  const normalized = value.trim().replace(',', '.')
  const numericValue = Number(normalized)

  if (!normalized || !Number.isFinite(numericValue) || numericValue <= 0) {
    throw new Error('数量必须大于 0')
  }

  return normalized.replace(/^0+(?=\d)/, '')
}

export async function recordInstant(
  activity: ActivityDefinition,
  overrides: Partial<Pick<ActivityRecord, 'amount' | 'recordedAt' | 'note'>> = {},
): Promise<ActivityRecord> {
  const timestamp = new Date().toISOString()
  const record: ActivityRecord = {
    id: createId(),
    activityId: activity.id,
    activityName: activity.name,
    activityIcon: activity.icon,
    activityMode: activity.mode,
    amount: normalizeAmount(overrides.amount ?? activity.defaultAmount),
    unit: activity.unit,
    recordedAt: overrides.recordedAt ?? timestamp,
    note: overrides.note?.trim() ?? '',
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.records.add(record)
  return record
}

export async function startTimer(
  activity: ActivityDefinition,
  options: { startedAt?: string; amount?: string; note?: string } = {},
): Promise<ActiveSession> {
  if (activity.mode !== 'timer') {
    throw new Error('这个行为不是计时行为')
  }

  return db.transaction('rw', db.activeSessions, async () => {
    const existing = await db.activeSessions.where('activityId').equals(activity.id).first()
    if (existing) {
      return existing
    }

    const session: ActiveSession = {
      id: createId(),
      activityId: activity.id,
      activityName: activity.name,
      activityIcon: activity.icon,
      amount: normalizeAmount(options.amount ?? activity.defaultAmount),
      unit: activity.unit,
      note: options.note?.trim() ?? '',
      startedAt: options.startedAt ?? new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    await db.activeSessions.add(session)
    return session
  })
}

export async function stopTimer(
  activityId: string,
  options: { endedAt?: string; amount?: string; note?: string } = {},
): Promise<ActivityRecord> {
  return db.transaction('rw', db.activeSessions, db.records, async () => {
    const session = await db.activeSessions.where('activityId').equals(activityId).first()
    if (!session) {
      throw new Error('没有找到正在进行的计时')
    }

    const endedAt = options.endedAt ?? new Date().toISOString()
    const durationMilliseconds = new Date(endedAt).getTime() - new Date(session.startedAt).getTime()
    if (durationMilliseconds < 0) {
      throw new Error('结束时间不能早于开始时间')
    }

    const timestamp = new Date().toISOString()
    const record: ActivityRecord = {
      id: createId(),
      activityId: session.activityId,
      activityName: session.activityName,
      activityIcon: session.activityIcon,
      activityMode: 'timer',
      amount: normalizeAmount(options.amount ?? session.amount),
      unit: session.unit,
      recordedAt: endedAt,
      startedAt: session.startedAt,
      endedAt,
      durationSeconds: Math.max(1, Math.round(durationMilliseconds / 1000)),
      note: options.note?.trim() ?? session.note?.trim() ?? '',
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    await db.records.add(record)
    await db.activeSessions.delete(session.id)
    return record
  })
}

export async function createRecordFromDraft(draft: RecordDraft): Promise<ActivityRecord> {
  const activity = await db.activities.get(draft.activityId)
  if (!activity) {
    throw new Error('没有找到所选行为')
  }

  const startedAt = draft.startedAt || undefined
  const endedAt = draft.endedAt || undefined
  let durationSeconds: number | undefined

  if (startedAt || endedAt) {
    if (!startedAt || !endedAt) {
      throw new Error('计时记录必须同时填写开始和结束时间')
    }
    const difference = new Date(endedAt).getTime() - new Date(startedAt).getTime()
    if (difference < 0) {
      throw new Error('结束时间不能早于开始时间')
    }
    durationSeconds = Math.max(1, Math.round(difference / 1000))
  }

  const timestamp = new Date().toISOString()
  const record: ActivityRecord = {
    id: createId(),
    activityId: activity.id,
    activityName: activity.name,
    activityIcon: activity.icon,
    activityMode: activity.mode,
    amount: normalizeAmount(draft.amount),
    unit: activity.unit,
    recordedAt: draft.recordedAt,
    startedAt,
    endedAt,
    durationSeconds,
    note: draft.note?.trim() ?? '',
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.records.add(record)
  return record
}

export async function updateRecord(
  id: string,
  changes: Pick<ActivityRecord, 'amount' | 'recordedAt' | 'note' | 'startedAt' | 'endedAt'>,
): Promise<void> {
  let durationSeconds: number | undefined
  if (changes.startedAt || changes.endedAt) {
    if (!changes.startedAt || !changes.endedAt) {
      throw new Error('计时记录必须同时填写开始和结束时间')
    }
    const difference = new Date(changes.endedAt).getTime() - new Date(changes.startedAt).getTime()
    if (difference < 0) {
      throw new Error('结束时间不能早于开始时间')
    }
    durationSeconds = Math.max(1, Math.round(difference / 1000))
  }

  const updated = await db.records.update(id, {
    ...changes,
    amount: normalizeAmount(changes.amount),
    durationSeconds,
    note: changes.note.trim(),
    updatedAt: new Date().toISOString(),
  })

  if (!updated) {
    throw new Error('没有找到要修改的记录')
  }
}

export async function deleteRecord(id: string): Promise<void> {
  await db.records.delete(id)
}

export async function undoRecord(id: string): Promise<void> {
  await db.records.delete(id)
}
