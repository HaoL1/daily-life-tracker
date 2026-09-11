import { useLiveQuery } from 'dexie-react-hooks'
import { Clock3, Plus, TimerReset } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ActivityIcon } from '../../components/ActivityIcon'
import { QuickEntryModal } from '../../components/QuickEntryModal'
import { RecordEditor } from '../../components/RecordEditor'
import { db } from '../../db/database'
import type { ActiveSession, ActivityDefinition } from '../../domain/models'
import type { Notify } from '../../domain/ui'
import { formatDuration } from '../../services/exportService'
import { recordInstant, startTimer, stopTimer, undoRecord } from '../../services/recordService'
import { getPeriodRange } from '../../services/statisticsService'
import { currentTimestamp, formatElapsed, formatFullDate, formatTime } from '../../utils/dateTime'

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
          <div className="quick-grid">
            {activities.map((activity) => {
              const session = activeSessions.find((item) => item.activityId === activity.id)
              const isRunning = Boolean(session)
              return (
                <article className={`quick-card ${isRunning ? 'is-running' : ''}`} key={activity.id}>
                  <button
                    className="quick-card-main"
                    type="button"
                    onClick={() => setQuickEntryActivity(activity)}
                    aria-label={isRunning ? `结束${activity.name}` : `记录${activity.name}`}
                  >
                    <ActivityIcon icon={activity.icon} tone={activity.tone} size={25} />
                    <span className="quick-card-copy">
                      <strong className={activity.name.length > 7 ? 'long-name' : undefined}>{activity.name}</strong>
                      <small>
                        {session
                          ? formatElapsed(session.startedAt, clock)
                          : activity.mode === 'timer'
                            ? '开始计时'
                            : `+ ${activity.defaultAmount} ${activity.unit}`}
                      </small>
                    </span>
                    {isRunning ? <TimerReset size={20} /> : activity.mode === 'timer' ? <Clock3 size={20} /> : <Plus size={20} />}
                  </button>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>还没有可用行为</p>
            <span>前往“设置”添加或恢复一个行为。</span>
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
