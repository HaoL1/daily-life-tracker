import { db } from '../db/database'
import type {
  ActivityDefinition,
  ActivityIcon,
  ActivityMode,
  ActivityTone,
} from '../domain/models'
import { normalizeAmount } from './recordService'

export interface ActivityDraft {
  name: string
  icon: ActivityIcon
  tone: ActivityTone
  mode: ActivityMode
  defaultAmount: string
  unit: string
}

function validateDraft(draft: ActivityDraft): ActivityDraft {
  const name = draft.name.trim()
  const unit = draft.unit.trim()
  if (!name) throw new Error('请输入行为名称')
  if (!unit) throw new Error('请输入计量单位')

  return {
    ...draft,
    name,
    unit,
    defaultAmount: normalizeAmount(draft.defaultAmount),
  }
}

export async function saveActivity(
  draft: ActivityDraft,
  existing?: ActivityDefinition,
): Promise<ActivityDefinition> {
  const validated = validateDraft(draft)
  const timestamp = new Date().toISOString()

  if (existing) {
    const updated: ActivityDefinition = {
      ...existing,
      ...validated,
      updatedAt: timestamp,
    }
    await db.activities.put(updated)
    return updated
  }

  const activities = await db.activities.toArray()
  const activity: ActivityDefinition = {
    id: crypto.randomUUID(),
    ...validated,
    sortOrder: activities.length
      ? Math.max(...activities.map((item) => item.sortOrder)) + 1
      : 0,
    isArchived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await db.activities.add(activity)
  return activity
}

export async function deleteActivity(id: string): Promise<void> {
  const runningSession = await db.activeSessions.where('activityId').equals(id).first()
  if (runningSession) throw new Error('请先结束正在进行的计时')

  await db.transaction('rw', db.activities, db.settings, async () => {
    const activity = await db.activities.get(id)
    if (!activity) throw new Error('没有找到这个行为')

    const settings = await db.settings.get('app')
    const deletedActivityIds = new Set(settings?.deletedActivityIds ?? [])
    deletedActivityIds.add(id)
    await db.activities.delete(id)
    await db.settings.put({
      ...(settings ?? {
        id: 'app' as const,
        weekStartsOn: 1 as const,
        createdAt: new Date().toISOString(),
      }),
      deletedActivityIds: [...deletedActivityIds],
      updatedAt: new Date().toISOString(),
    })
  })
}

export async function reorderActivities(orderedIds: string[]): Promise<void> {
  const timestamp = new Date().toISOString()
  await db.transaction('rw', db.activities, async () => {
    await Promise.all(orderedIds.map((id, sortOrder) =>
      db.activities.update(id, { sortOrder, updatedAt: timestamp }),
    ))
  })
}
