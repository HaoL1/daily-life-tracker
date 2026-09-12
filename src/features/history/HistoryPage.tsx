import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDown, ArrowUp, CalendarDays, ChevronRight, Plus } from 'lucide-react'
import { useState } from 'react'
import { RecordEditor } from '../../components/RecordEditor'
import { db } from '../../db/database'
import type { ActivityRecord } from '../../domain/models'
import type { Notify } from '../../domain/ui'
import { deleteRecord } from '../../services/recordService'
import { formatDuration } from '../../services/exportService'
import { formatDateHeading, formatTime, toDateInput } from '../../utils/dateTime'

const iconToneFallback: Partial<Record<ActivityRecord['activityIcon'], string>> = {
  water: 'link',
  soda: 'link',
  toilet: 'success',
  meal: 'danger',
  snack: 'warning',
  fruit: 'success',
  exercise: 'danger',
  drive: 'warning',
  coffee: 'warning',
}

interface HistoryPageProps {
  notify: Notify
}

type HistorySortOrder = 'ascending' | 'descending'

export function HistoryPage({ notify }: HistoryPageProps) {
  const records = useLiveQuery(() => db.records.orderBy('recordedAt').reverse().toArray(), [], [])
  const activities = useLiveQuery(() => db.activities.orderBy('sortOrder').toArray(), [], [])
  const [activityFilter, setActivityFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [sortOrder, setSortOrder] = useState<HistorySortOrder>('ascending')
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
    await deleteRecord(record.id)
    notify('记录已删除')
  }

  return (
    <div className="page history-page">
      <header className="page-heading history-heading">
        <div>
          <p className="eyebrow">时间线</p>
          <h1>历史记录</h1>
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
                <div className="history-day-actions">
                  <span>{dayRecords.length} 条</span>
                  <button
                    className="history-sort-button"
                    type="button"
                    onClick={() => setSortOrder((current) => current === 'ascending' ? 'descending' : 'ascending')}
                    aria-label={sortOrder === 'ascending' ? '当前早到晚，切换为晚到早' : '当前晚到早，切换为早到晚'}
                    title={sortOrder === 'ascending' ? '切换为晚到早' : '切换为早到晚'}
                  >
                    {sortOrder === 'ascending' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                    {sortOrder === 'ascending' ? '早→晚' : '晚→早'}
                  </button>
                </div>
              </header>
              <div className="record-list">
                {[...dayRecords]
                  .sort((left, right) => sortOrder === 'ascending'
                    ? left.recordedAt.localeCompare(right.recordedAt)
                    : right.recordedAt.localeCompare(left.recordedAt))
                  .map((record) => {
                  const activity = activities.find((item) => item.id === record.activityId)
                  const tone = activity?.tone ?? iconToneFallback[record.activityIcon] ?? 'neutral'
                  const detail = [
                    record.durationSeconds ? formatDuration(record.durationSeconds) : `${record.amount}${record.unit}`,
                    record.note,
                  ].filter(Boolean).join(' · ')
                  return (
                    <button
                      className="history-row"
                      type="button"
                      key={record.id}
                      onClick={() => setEditor({ record })}
                      aria-label={`编辑${record.activityName}，${formatTime(record.recordedAt)}，${detail}`}
                    >
                      <time dateTime={record.recordedAt}>{formatTime(record.recordedAt)}</time>
                      <span className={`history-marker tone-${tone}`} aria-hidden="true" />
                      <strong>{record.activityName}</strong>
                      <span className="history-detail">{detail}</span>
                      <ChevronRight className="history-chevron" size={15} aria-hidden="true" />
                    </button>
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
          onDelete={editor.record ? () => handleDelete(editor.record!) : undefined}
        />
      )}
    </div>
  )
}
