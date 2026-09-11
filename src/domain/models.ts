export type ActivityMode = 'instant' | 'timer'

export type ActivityIcon =
  | 'water'
  | 'toilet'
  | 'soda'
  | 'coffee'
  | 'meal'
  | 'snack'
  | 'fruit'
  | 'exercise'
  | 'drive'
  | 'custom'

export type ActivityTone =
  | 'accent'
  | 'link'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'

export interface ActivityDefinition {
  id: string
  name: string
  icon: ActivityIcon
  tone: ActivityTone
  mode: ActivityMode
  defaultAmount: string
  unit: string
  sortOrder: number
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

export interface ActivityRecord {
  id: string
  activityId: string
  activityName: string
  activityIcon: ActivityIcon
  activityMode?: ActivityMode
  amount: string
  unit: string
  recordedAt: string
  startedAt?: string
  endedAt?: string
  durationSeconds?: number
  note: string
  createdAt: string
  updatedAt: string
}

export interface ActiveSession {
  id: string
  activityId: string
  activityName: string
  activityIcon: ActivityIcon
  amount: string
  unit: string
  note?: string
  startedAt: string
  createdAt: string
}

export interface AppSettings {
  id: 'app'
  weekStartsOn: 1
  lastBackupAt?: string
  createdAt: string
  updatedAt: string
}

export interface TrackerBackup {
  schemaVersion: 1
  exportedAt: string
  activities: ActivityDefinition[]
  records: ActivityRecord[]
  activeSessions: ActiveSession[]
  settings: AppSettings
}

export interface RecordDraft {
  activityId: string
  amount: string
  recordedAt: string
  note?: string
  startedAt?: string
  endedAt?: string
}
