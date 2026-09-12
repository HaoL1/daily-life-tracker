import {
  closestCenter,
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
} from '@dnd-kit/sortable'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { QuickEntryModal } from '../../components/QuickEntryModal'
import { RecordEditor } from '../../components/RecordEditor'
import { db } from '../../db/database'
import type { ActiveSession, ActivityDefinition } from '../../domain/models'
import type { Notify } from '../../domain/ui'
import { formatDuration } from '../../services/exportService'
import { reorderActivities } from '../../services/activityService'
import { recordInstant, startTimer, stopTimer, undoRecord } from '../../services/recordService'
import { getPeriodRange } from '../../services/statisticsService'
import { currentTimestamp, formatFullDate } from '../../utils/dateTime'
import { SortableQuickCard } from './SortableQuickCard'

interface QuickLogPageProps {
  notify: Notify
}

export function QuickLogPage({ notify }: QuickLogPageProps) {
  const activities =
    useLiveQuery(() => db.activities.orderBy('sortOrder').toArray(), [], [])
      .filter((activity) => !activity.isArchived)
  const activeSessions = useLiveQuery(() => db.activeSessions.toArray(), [], [])
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
  const todayRecordCounts = todayRecords.reduce<Record<string, number>>((counts, record) => {
    counts[record.activityId] = (counts[record.activityId] ?? 0) + 1
    return counts
  }, {})
  const [quickEntryActivity, setQuickEntryActivity] = useState<ActivityDefinition | null>(null)
  const [showGeneralEditor, setShowGeneralEditor] = useState(false)
  const [clock, setClock] = useState(currentTimestamp)
  const suppressCardOpenUntil = useRef(0)
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 350, tolerance: 8 } }),
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

      <section aria-label="记录项目">
        {activities.length ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={() => {
              suppressCardOpenUntil.current = Number.POSITIVE_INFINITY
              navigator.vibrate?.(18)
            }}
            onDragCancel={() => {
              suppressCardOpenUntil.current = currentTimestamp() + 350
            }}
            onDragEnd={(event) => {
              suppressCardOpenUntil.current = currentTimestamp() + 350
              void handleDragEnd(event)
            }}
          >
            <SortableContext items={activities.map((activity) => activity.id)} strategy={rectSortingStrategy}>
              <div className="quick-grid">
                {activities.map((activity) => (
                  <SortableQuickCard
                    key={activity.id}
                    activity={activity}
                    session={activeSessions.find((item) => item.activityId === activity.id)}
                    clock={clock}
                    todayCount={todayRecordCounts[activity.id] ?? 0}
                    onOpen={() => setQuickEntryActivity(activity)}
                    canOpen={() => currentTimestamp() >= suppressCardOpenUntil.current}
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
