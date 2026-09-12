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
    let settings = await db.settings.get('app')
    if (!settings) {
      settings = createDefaultSettings()
      await db.settings.add(settings)
    }

    const existingActivities = await db.activities.toArray()
    const deletedActivityIds = new Set(settings.deletedActivityIds ?? [])
    const previouslyArchivedIds = existingActivities
      .filter((activity) => activity.isArchived)
      .map((activity) => activity.id)

    if (previouslyArchivedIds.length > 0) {
      previouslyArchivedIds.forEach((id) => deletedActivityIds.add(id))
      await db.activities.bulkDelete(previouslyArchivedIds)
      settings = {
        ...settings,
        deletedActivityIds: [...deletedActivityIds],
        updatedAt: new Date().toISOString(),
      }
      await db.settings.put(settings)
    }

    if (existingActivities.length === 0) {
      const availableDefaults = defaults.filter((activity) => !deletedActivityIds.has(activity.id))
      if (availableDefaults.length > 0) await db.activities.bulkAdd(availableDefaults)
    } else {
      const defaultRenames = [
        { id: 'preset-toilet', previousNames: ['上厕所', '小手'], name: '小便' },
        { id: 'preset-toilet-large', previousNames: ['大手'], name: '大便' },
      ]
      for (const rename of defaultRenames) {
        const activity = existingActivities.find((item) => item.id === rename.id)
        if (activity && rename.previousNames.includes(activity.name)) {
          await db.activities.update(activity.id, {
            name: rename.name,
            updatedAt: new Date().toISOString(),
          })
        }
      }

      const existingIds = new Set(existingActivities.map((activity) => activity.id))
      let nextSortOrder = Math.max(...existingActivities.map((activity) => activity.sortOrder)) + 1
      const missingDefaults = defaults
        .filter((activity) => !existingIds.has(activity.id) && !deletedActivityIds.has(activity.id))
        .map((activity) => ({ ...activity, sortOrder: nextSortOrder++ }))
      if (missingDefaults.length > 0) {
        await db.activities.bulkAdd(missingDefaults)
      }
    }

  })
}
