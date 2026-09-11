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

export async function setActivityArchived(id: string, isArchived: boolean): Promise<void> {
  if (isArchived) {
    const runningSession = await db.activeSessions.where('activityId').equals(id).first()
    if (runningSession) throw new Error('请先结束正在进行的计时')
  }

  const updated = await db.activities.update(id, {
    isArchived,
    updatedAt: new Date().toISOString(),
  })
  if (!updated) throw new Error('没有找到这个行为')
}

export async function moveActivity(id: string, direction: -1 | 1): Promise<void> {
  const activities = (await db.activities.toArray())
    .filter((item) => !item.isArchived)
    .sort((left, right) => left.sortOrder - right.sortOrder)
  const currentIndex = activities.findIndex((item) => item.id === id)
  const targetIndex = currentIndex + direction
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= activities.length) return

  const current = activities[currentIndex]
  const target = activities[targetIndex]
  await db.transaction('rw', db.activities, async () => {
    await db.activities.update(current.id, { sortOrder: target.sortOrder })
    await db.activities.update(target.id, { sortOrder: current.sortOrder })
  })
}
