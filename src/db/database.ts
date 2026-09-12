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
    const permanentlyDeletedActivityIds = new Set(settings.permanentlyDeletedActivityIds ?? [])
    const archivedIds = existingActivities
      .filter((activity) => activity.isArchived)
      .map((activity) => activity.id)

    if (archivedIds.length > 0) {
      archivedIds.forEach((id) => deletedActivityIds.add(id))
      settings = {
        ...settings,
        deletedActivityIds: [...deletedActivityIds],
        permanentlyDeletedActivityIds: [...permanentlyDeletedActivityIds],
        updatedAt: new Date().toISOString(),
      }
      await db.settings.put(settings)
    }

    if (existingActivities.length === 0) {
      const deletedDefaults = defaults
        .filter((activity) => deletedActivityIds.has(activity.id) && !permanentlyDeletedActivityIds.has(activity.id))
        .map((activity, index) => ({ ...activity, isArchived: true, sortOrder: index }))
      if (deletedDefaults.length > 0) await db.activities.bulkAdd(deletedDefaults)
      const availableDefaults = defaults.filter(
        (activity) =>
          !deletedActivityIds.has(activity.id) && !permanentlyDeletedActivityIds.has(activity.id),
      )
      if (availableDefaults.length > 0) {
        await db.activities.bulkAdd(
          availableDefaults.map((activity, index) => ({
            ...activity,
            sortOrder: deletedDefaults.length + index,
          })),
        )
      }
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
      const missingDeletedDefaults = defaults
        .filter(
          (activity) =>
            deletedActivityIds.has(activity.id) &&
            !permanentlyDeletedActivityIds.has(activity.id) &&
            !existingIds.has(activity.id),
        )
        .map((activity) => ({
          ...activity,
          isArchived: true,
          sortOrder: nextSortOrder++,
        }))
      if (missingDeletedDefaults.length > 0) {
        await db.activities.bulkAdd(missingDeletedDefaults)
      }
      const missingDefaults = defaults
        .filter(
          (activity) =>
            !existingIds.has(activity.id) &&
            !deletedActivityIds.has(activity.id) &&
            !permanentlyDeletedActivityIds.has(activity.id),
        )
        .map((activity) => ({ ...activity, sortOrder: nextSortOrder++ }))
      if (missingDefaults.length > 0) {
        await db.activities.bulkAdd(missingDefaults)
      }
    }

  })
}
