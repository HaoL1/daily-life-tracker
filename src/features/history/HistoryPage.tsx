import { useLiveQuery } from 'dexie-react-hooks'
import { CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ActivityIcon } from '../../components/ActivityIcon'
import { RecordEditor } from '../../components/RecordEditor'
import { db } from '../../db/database'
import type { ActivityRecord } from '../../domain/models'
import type { Notify } from '../../domain/ui'
import { deleteRecord } from '../../services/recordService'
import { formatDuration } from '../../services/exportService'
import { formatDateHeading, formatTime, toDateInput } from '../../utils/dateTime'

interface HistoryPageProps {
  notify: Notify
}

export function HistoryPage({ notify }: HistoryPageProps) {
  const records = useLiveQuery(() => db.records.orderBy('recordedAt').reverse().toArray(), [], [])
  const activities = useLiveQuery(() => db.activities.orderBy('sortOrder').toArray(), [], [])
  const [activityFilter, setActivityFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [editor, setEditor] = useState<{ record?: ActivityRecord } | null>(null)

  const filteredRecords = records.filter((record) => {
    if (activityFilter !== 'all' && record.activityId !== activityFilter) return false
    if (dateFilter && toDateInput(new Date(record.recordedAt)) !== dateFilter) return false
    return true
  })
  const grouped = new Map<string, ActivityRecord[]>()
  for (const record of filteredRecords) {
    const key = toDateInput(new Date(record.recordedAt))
    grouped.set(key, [...(grouped.get(key) ?? []), record])
  }

  async function handleDelete(record: ActivityRecord) {
    if (!window.confirm(`删除“${record.activityName}”这条记录？`)) return
    await deleteRecord(record.id)
    notify('记录已删除')
  }

  return (
    <div className="page history-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">时间线</p>
          <h1>每一天，都有迹可循</h1>
          <p className="heading-support">筛选、补记或修正历史记录。</p>
        </div>
        <button className="primary-button compact-button" type="button" onClick={() => setEditor({})} disabled={!activities.length}>
          <Plus size={18} />
          补录
        </button>
      </header>

      <div className="filter-bar">
        <label className="compact-field">
          <span>行为</span>
          <select value={activityFilter} onChange={(event) => setActivityFilter(event.target.value)}>
            <option value="all">全部行为</option>
            {activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.name}</option>)}
          </select>
        </label>
        <label className="compact-field date-filter">
          <span>日期</span>
          <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
        </label>
        {(activityFilter !== 'all' || dateFilter) && (
          <button className="text-button clear-filter" type="button" onClick={() => { setActivityFilter('all'); setDateFilter('') }}>
            清除
          </button>
        )}
      </div>

      {grouped.size ? (
        <div className="history-groups">
          {[...grouped.entries()].map(([date, dayRecords]) => (
            <section className="history-day" key={date}>
              <header>
                <h2>{formatDateHeading(dayRecords[0].recordedAt)}</h2>
                <span>{dayRecords.length} 条</span>
              </header>
              <div className="record-list">
                {dayRecords.map((record) => {
                  const activity = activities.find((item) => item.id === record.activityId)
                  return (
                    <article className="record-row history-row" key={record.id}>
                      <ActivityIcon icon={record.activityIcon} tone={activity?.tone} />
                      <div className="record-row-main">
                        <strong>{record.activityName}</strong>
                        <span>
                          {formatTime(record.recordedAt)}
                          {record.durationSeconds ? ` · ${formatDuration(record.durationSeconds)}` : ''}
                        </span>
                        {record.note && <small className="record-note">{record.note}</small>}
                      </div>
                      <span className="record-amount">{record.amount} <small>{record.unit}</small></span>
                      <div className="row-actions">
                        <button className="icon-button small-icon-button" type="button" onClick={() => setEditor({ record })} aria-label={`编辑${record.activityName}`} title="编辑">
                          <Pencil size={17} />
                        </button>
                        <button className="icon-button small-icon-button danger-button" type="button" onClick={() => void handleDelete(record)} aria-label={`删除${record.activityName}`} title="删除">
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="empty-state large-empty">
          <CalendarDays size={30} />
          <p>{records.length ? '没有符合筛选条件的记录' : '还没有历史记录'}</p>
          <span>{records.length ? '换个日期或行为看看。' : '从“记录”页点一下行为按钮开始。'}</span>
        </div>
      )}

      {editor && activities.length > 0 && (
        <RecordEditor
          activities={activities}
          record={editor.record}
          onClose={() => setEditor(null)}
          onSaved={notify}
        />
      )}
    </div>
  )
}
