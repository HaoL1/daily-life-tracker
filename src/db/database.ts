import Dexie, { type EntityTable } from 'dexie'
import { createDefaultActivities, createDefaultSettings } from '../domain/defaults'
import type {
  ActiveSession,
  ActivityDefinition,
  ActivityRecord,
  AppSettings,
} from '../domain/models'

class TrackerDatabase extends Dexie {
  activities!: EntityTable<ActivityDefinition, 'id'>
  records!: EntityTable<ActivityRecord, 'id'>
  activeSessions!: EntityTable<ActiveSession, 'id'>
  settings!: EntityTable<AppSettings, 'id'>

  constructor() {
    super('DailyLifeTracker')
    this.version(1).stores({
      activities: 'id, sortOrder, name',
      records: 'id, activityId, recordedAt, createdAt, [activityId+recordedAt]',
      activeSessions: 'id, &activityId, startedAt',
      settings: 'id',
    })
  }
}

export const db = new TrackerDatabase()

export async function initializeDatabase(): Promise<void> {
  await db.transaction('rw', db.activities, db.settings, async () => {
    const defaults = createDefaultActivities()
    const existingActivities = await db.activities.toArray()

    if (existingActivities.length === 0) {
      await db.activities.bulkAdd(defaults)
    } else {
      const legacyToilet = existingActivities.find(
        (activity) => activity.id === 'preset-toilet' && activity.name === '上厕所',
      )
      if (legacyToilet) {
        await db.activities.update(legacyToilet.id, {
          name: '小手',
          updatedAt: new Date().toISOString(),
        })
      }

      const existingIds = new Set(existingActivities.map((activity) => activity.id))
      let nextSortOrder = Math.max(...existingActivities.map((activity) => activity.sortOrder)) + 1
      const missingDefaults = defaults
        .filter((activity) => !existingIds.has(activity.id))
        .map((activity) => ({ ...activity, sortOrder: nextSortOrder++ }))
      if (missingDefaults.length > 0) {
        await db.activities.bulkAdd(missingDefaults)
      }
    }

    if (!(await db.settings.get('app'))) {
      await db.settings.add(createDefaultSettings())
    }
  })
}
