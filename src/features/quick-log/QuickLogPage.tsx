import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ActivityIcon } from '../../components/ActivityIcon'
import { QuickEntryModal } from '../../components/QuickEntryModal'
import { RecordEditor } from '../../components/RecordEditor'
import { db } from '../../db/database'
import type { ActiveSession, ActivityDefinition } from '../../domain/models'
import type { Notify } from '../../domain/ui'
import { formatDuration } from '../../services/exportService'
import { reorderActivities } from '../../services/activityService'
import { recordInstant, startTimer, stopTimer, undoRecord } from '../../services/recordService'
import { getPeriodRange } from '../../services/statisticsService'
import { currentTimestamp, formatFullDate, formatTime } from '../../utils/dateTime'
import { SortableQuickCard } from './SortableQuickCard'

interface QuickLogPageProps {
  notify: Notify
}

export function QuickLogPage({ notify }: QuickLogPageProps) {
  const activities =
    useLiveQuery(() => db.activities.orderBy('sortOrder').toArray(), [], [])
      .filter((activity) => !activity.isArchived)
  const activeSessions = useLiveQuery(() => db.activeSessions.toArray(), [], [])
  const recentRecords = useLiveQuery(
    () => db.records.orderBy('recordedAt').reverse().limit(5).toArray(),
    [],
    [],
  )
  const todayRange = getPeriodRange('day', new Date())
  const todayRecords = useLiveQuery(
    () =>
      db.records
        .where('recordedAt')
        .between(todayRange.start.toISOString(), todayRange.end.toISOString(), true, true)
        .toArray(),
    [todayRange.start.toISOString(), todayRange.end.toISOString()],
    [],
  )
  const [quickEntryActivity, setQuickEntryActivity] = useState<ActivityDefinition | null>(null)
  const [showGeneralEditor, setShowGeneralEditor] = useState(false)
  const [clock, setClock] = useState(currentTimestamp)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    if (!activeSessions.length) return
    const timer = window.setInterval(() => setClock(currentTimestamp()), 1000)
    return () => window.clearInterval(timer)
  }, [activeSessions.length])

  async function confirmQuickEntry(
    activity: ActivityDefinition,
    session: ActiveSession | undefined,
    amount: string,
    note: string,
  ) {
    if (activity.mode === 'timer') {
      if (session) {
        const record = await stopTimer(activity.id, { amount, note })
        notify(`${activity.name}已结束 · ${formatDuration(record.durationSeconds ?? 0)}`, {
          label: '撤销',
          run: () => undoRecord(record.id),
        })
      } else {
        await startTimer(activity, { amount, note })
        notify(`${activity.name}开始计时`)
      }
    } else {
      const record = await recordInstant(activity, { amount, note })
      notify(`已记录 ${activity.name} ${record.amount} ${record.unit}`, {
        label: '撤销',
        run: () => undoRecord(record.id),
      })
    }
    navigator.vibrate?.(12)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = activities.findIndex((activity) => activity.id === active.id)
    const newIndex = activities.findIndex((activity) => activity.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    try {
      const reordered = arrayMove(activities, oldIndex, newIndex)
      await reorderActivities(reordered.map((activity) => activity.id))
      navigator.vibrate?.(10)
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : '排序保存失败，请重试')
    }
  }

  return (
    <div className="page quick-page">
      <header className="page-heading quick-heading">
        <div>
          <p className="eyebrow">{formatFullDate()}</p>
          <h1>今天，记一下</h1>
          <p className="heading-support">
            {todayRecords.length ? `已经留下 ${todayRecords.length} 条记录` : '第一次点击，会从这一刻开始。'}
          </p>
        </div>
        <button className="secondary-button compact-button" type="button" onClick={() => setShowGeneralEditor(true)}>
          <Plus size={18} />
          补录
        </button>
      </header>

      {activeSessions.length > 0 && (
        <section className="running-strip" aria-label="正在计时">
          <span className="pulse-dot" />
          <div>
            <strong>{activeSessions.map((session) => session.activityName).join('、')}正在进行</strong>
            <span>点击对应按钮，确认后结束并保存</span>
          </div>
        </section>
      )}

      <section aria-labelledby="quick-actions-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">快速记录</p>
            <h2 id="quick-actions-title">点一下，确认后记录</h2>
          </div>
          <span className="section-count">{activities.length} 项</span>
        </div>

        {activities.length ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void handleDragEnd(event)}>
            <SortableContext items={activities.map((activity) => activity.id)} strategy={rectSortingStrategy}>
              <div className="quick-grid">
                {activities.map((activity) => (
                  <SortableQuickCard
                    key={activity.id}
                    activity={activity}
                    session={activeSessions.find((item) => item.activityId === activity.id)}
                    clock={clock}
                    onOpen={() => setQuickEntryActivity(activity)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="empty-state">
            <p>还没有可用行为</p>
            <span>前往“设置”添加一个行为。</span>
          </div>
        )}
      </section>

      <section className="recent-section" aria-labelledby="recent-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">刚刚发生</p>
            <h2 id="recent-title">最近记录</h2>
          </div>
        </div>
        {recentRecords.length ? (
          <div className="record-list compact-list">
            {recentRecords.map((record) => {
              const activity = activities.find((item) => item.id === record.activityId)
              return (
                <div className="record-row" key={record.id}>
                  <ActivityIcon icon={record.activityIcon} tone={activity?.tone} />
                  <div className="record-row-main">
                    <strong>{record.activityName}</strong>
                    <span>{formatTime(record.recordedAt)}{record.durationSeconds ? ` · ${formatDuration(record.durationSeconds)}` : ''}</span>
                    {record.note && <small className="record-note recent-note">{record.note}</small>}
                  </div>
                  <span className="record-amount">{record.amount} <small>{record.unit}</small></span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-state quiet-empty"><p>今天还没有记录</p></div>
        )}
      </section>

      {quickEntryActivity && (
        <QuickEntryModal
          activity={quickEntryActivity}
          session={activeSessions.find((session) => session.activityId === quickEntryActivity.id)}
          now={clock}
          onClose={() => setQuickEntryActivity(null)}
          onConfirm={({ amount, note }) =>
            confirmQuickEntry(
              quickEntryActivity,
              activeSessions.find((session) => session.activityId === quickEntryActivity.id),
              amount,
              note,
            )
          }
        />
      )}
      {showGeneralEditor && activities.length > 0 && (
        <RecordEditor
          activities={activities}
          onClose={() => setShowGeneralEditor(false)}
          onSaved={notify}
        />
      )}
    </div>
  )
}
