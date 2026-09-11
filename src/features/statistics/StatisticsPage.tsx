import { useLiveQuery } from 'dexie-react-hooks'
import { BarChart3, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ActivityIcon } from '../../components/ActivityIcon'
import { db } from '../../db/database'
import { formatDuration } from '../../services/exportService'
import {
  createTrend,
  filterRecordsByRange,
  getPeriodRange,
  shiftPeriod,
  summarizeRecords,
  type PeriodKind,
} from '../../services/statisticsService'
import { toDateInput } from '../../utils/dateTime'

const periods: Array<{ value: PeriodKind; label: string }> = [
  { value: 'day', label: '日' },
  { value: 'week', label: '周' },
  { value: 'month', label: '月' },
  { value: 'year', label: '年' },
  { value: 'custom', label: '自定义' },
]

export function StatisticsPage() {
  const records = useLiveQuery(() => db.records.toArray(), [], [])
  const activities = useLiveQuery(() => db.activities.orderBy('sortOrder').toArray(), [], [])
  const [period, setPeriod] = useState<PeriodKind>('week')
  const [anchor, setAnchor] = useState(new Date())
  const [customStart, setCustomStart] = useState(toDateInput(new Date()))
  const [customEnd, setCustomEnd] = useState(toDateInput(new Date()))
  const [activityFilter, setActivityFilter] = useState('all')

  const custom = {
    start: new Date(`${customStart}T12:00:00`),
    end: new Date(`${customEnd}T12:00:00`),
  }
  const range = getPeriodRange(period, anchor, custom)
  const selectedRecords = activityFilter === 'all'
    ? records
    : records.filter((record) => record.activityId === activityFilter)
  const visibleRecords = filterRecordsByRange(selectedRecords, range)
  const summaries = summarizeRecords(selectedRecords, range)
  const trend = createTrend(selectedRecords, range, period)
  const trackedDays = new Set(visibleRecords.map((record) => toDateInput(new Date(record.recordedAt)))).size

  return (
    <div className="page statistics-page">
      <header className="page-heading stats-heading">
        <div>
          <p className="eyebrow">趋势与汇总</p>
          <h1>看看最近的节奏</h1>
          <p className="heading-support">数量和时长按行为分别统计，不混合不同单位。</p>
        </div>
      </header>

      <div className="segmented period-control" role="group" aria-label="统计周期">
        {periods.map((option) => (
          <button
            type="button"
            key={option.value}
            className={period === option.value ? 'selected' : ''}
            onClick={() => setPeriod(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {period === 'custom' ? (
        <div className="custom-range">
          <label className="compact-field"><span>开始</span><input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></label>
          <label className="compact-field"><span>结束</span><input type="date" min={customStart} value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></label>
        </div>
      ) : (
        <div className="period-navigator">
          <button className="icon-button" type="button" onClick={() => setAnchor(shiftPeriod(period, anchor, -1))} aria-label="上一个周期"><ChevronLeft size={20} /></button>
          <strong>{range.label}</strong>
          <button className="icon-button" type="button" onClick={() => setAnchor(shiftPeriod(period, anchor, 1))} aria-label="下一个周期"><ChevronRight size={20} /></button>
        </div>
      )}

      <label className="stats-filter compact-field">
        <span>查看行为</span>
        <select value={activityFilter} onChange={(event) => setActivityFilter(event.target.value)}>
          <option value="all">全部行为</option>
          {activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.name}</option>)}
        </select>
      </label>

      <div className="metric-band">
        <div><span>记录</span><strong>{visibleRecords.length}</strong><small>条</small></div>
        <div><span>涉及行为</span><strong>{summaries.length}</strong><small>项</small></div>
        <div><span>有记录</span><strong>{trackedDays}</strong><small>天</small></div>
      </div>

      <section className="chart-section" aria-labelledby="trend-title">
        <div className="section-heading">
          <div><p className="section-kicker">记录频次</p><h2 id="trend-title">周期趋势</h2></div>
        </div>
        {visibleRecords.length ? (
          <div className="chart-wrap" aria-label="记录次数柱状图">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 8, right: 4, left: -26, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--cp-border)" strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={18} tick={{ fill: 'var(--cp-text-muted)', fontSize: 11 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--cp-text-muted)', fontSize: 11 }} />
                <Tooltip cursor={{ fill: 'var(--cp-accent-soft)' }} contentStyle={{ background: 'var(--cp-surface)', border: '1px solid var(--cp-border)', borderRadius: '8px', color: 'var(--cp-text)' }} formatter={(value) => [`${value} 条`, '记录']} />
                <Bar dataKey="count" fill="var(--cp-accent)" radius={[5, 5, 1, 1]} maxBarSize={34} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="empty-state chart-empty"><BarChart3 size={28} /><p>这个周期还没有记录</p></div>
        )}
      </section>

      <section className="summary-section" aria-labelledby="summary-title">
        <div className="section-heading"><div><p className="section-kicker">分类合计</p><h2 id="summary-title">行为汇总</h2></div></div>
        {summaries.length ? (
          <div className="summary-list">
            {summaries.map((summary) => {
              const activity = activities.find((item) => item.id === summary.activityId)
              return (
                <article className="summary-row" key={summary.key}>
                  <ActivityIcon icon={summary.activityIcon} tone={activity?.tone} />
                  <div className="summary-name"><strong>{summary.activityName}</strong><span>{summary.recordCount} 条记录</span></div>
                  <div className="summary-values">
                    <strong>{summary.totalAmount} <small>{summary.unit}</small></strong>
                    {summary.totalDurationSeconds > 0 && <span>{formatDuration(summary.totalDurationSeconds)}</span>}
                    <span>日均 {summary.averagePerDay} {summary.unit}</span>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="empty-state quiet-empty"><p>暂无可汇总的数据</p></div>
        )}
      </section>
    </div>
  )
}
