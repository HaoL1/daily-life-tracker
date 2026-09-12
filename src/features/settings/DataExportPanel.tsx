import { useLiveQuery } from 'dexie-react-hooks'
import { Clipboard, Download, FileJson, FileSpreadsheet, Share2, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { db } from '../../db/database'
import type { Notify } from '../../domain/ui'
import { createBackup, parseBackup, restoreBackup } from '../../services/backupService'
import {
  createPlainText,
  createRecordsCsv,
  createSummaryCsv,
  downloadTextFile,
} from '../../services/exportService'
import {
  summarizeRecords,
} from '../../services/statisticsService'
import { toDateInput } from '../../utils/dateTime'
import { resolveRange, type ExportRange } from './exportRange'

interface DataExportPanelProps {
  notify: Notify
}

export function DataExportPanel({ notify }: DataExportPanelProps) {
  const records = useLiveQuery(() => db.records.toArray(), [], [])
  const activities = useLiveQuery(() => db.activities.orderBy('sortOrder').toArray(), [], [])
  const settings = useLiveQuery(() => db.settings.get('app'), [], undefined)
  const [rangeType, setRangeType] = useState<ExportRange>('day')
  const [activityId, setActivityId] = useState('all')
  const [customStart, setCustomStart] = useState(toDateInput(new Date()))
  const [customEnd, setCustomEnd] = useState(toDateInput(new Date()))
  const [working, setWorking] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  const selectedRecords = activityId === 'all'
    ? records
    : records.filter((record) => record.activityId === activityId)
  const range = resolveRange(rangeType, selectedRecords, customStart, customEnd)
  const summaries = summarizeRecords(selectedRecords, range)
  const dateStamp = toDateInput(new Date())

  async function copyText() {
    const text = createPlainText(selectedRecords, summaries, range)
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = text
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        textarea.remove()
      }
      notify('文字已复制，可以直接粘贴')
    } catch {
      notify('复制失败，请改用下载文字文件')
    }
  }

  async function shareText() {
    const text = createPlainText(selectedRecords, summaries, range)
    if (!navigator.share) {
      await copyText()
      return
    }
    try {
      await navigator.share({ title: '日迹 · 生活记录', text })
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return
      notify('分享失败，请改用复制或下载')
    }
  }

  async function downloadBackup(label = 'backup') {
    const backup = await createBackup()
    downloadTextFile(
      JSON.stringify(backup, null, 2),
      `日迹-${label}-${dateStamp}.json`,
      'application/json;charset=utf-8',
    )
    notify('完整备份已下载，请保存到“文件”中')
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return
    setWorking(true)
    try {
      const backup = parseBackup(await file.text())
      const confirmed = window.confirm(
        `备份包含 ${backup.activities.length} 个行为、${backup.records.length} 条记录。\n\n恢复会替换当前所有数据，继续吗？`,
      )
      if (!confirmed) return

      const currentBackup = await createBackup()
      downloadTextFile(
        JSON.stringify(currentBackup, null, 2),
        `日迹-恢复前自动备份-${dateStamp}.json`,
        'application/json;charset=utf-8',
      )
      await restoreBackup(backup)
      notify('恢复完成，当前数据已替换')
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : '恢复失败，当前数据没有改动')
    } finally {
      setWorking(false)
      input.value = ''
    }
  }

  return (
    <section className="settings-section" aria-labelledby="export-title">
      <div className="section-heading">
        <div><p className="section-kicker">带走你的数据</p><h2 id="export-title">导出与备份</h2></div>
      </div>

      <div className="export-controls">
        <label className="compact-field">
          <span>范围</span>
          <select value={rangeType} onChange={(event) => setRangeType(event.target.value as ExportRange)}>
            <option value="yesterday">昨天</option>
            <option value="day">今天</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
            <option value="year">今年</option>
            <option value="all">全部记录</option>
            <option value="custom">自定义</option>
          </select>
        </label>
        <label className="compact-field">
          <span>行为</span>
          <select value={activityId} onChange={(event) => setActivityId(event.target.value)}>
            <option value="all">全部行为</option>
            {activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.name}</option>)}
          </select>
        </label>
      </div>
      {rangeType === 'custom' && (
        <div className="custom-range export-custom-range">
          <label className="compact-field"><span>开始</span><input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></label>
          <label className="compact-field"><span>结束</span><input type="date" min={customStart} value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></label>
        </div>
      )}
      <p className="selection-summary">{range.label} · {selectedRecords.filter((record) => {
        const time = new Date(record.recordedAt).getTime()
        return time >= range.start.getTime() && time <= range.end.getTime()
      }).length} 条记录</p>

      <div className="action-grid">
        <button className="action-button" type="button" onClick={() => void copyText()}>
          <Clipboard size={20} /><span><strong>复制文字</strong><small>粘贴到备忘录或聊天</small></span>
        </button>
        <button className="action-button" type="button" onClick={() => void shareText()}>
          <Share2 size={20} /><span><strong>系统分享</strong><small>发送完整文字记录</small></span>
        </button>
        <button className="action-button" type="button" onClick={() => {
          downloadTextFile(createRecordsCsv(selectedRecords, range), `日迹-明细-${dateStamp}.csv`, 'text/csv;charset=utf-8')
          notify('记录明细 CSV 已下载')
        }}>
          <FileSpreadsheet size={20} /><span><strong>明细表格</strong><small>CSV，可用 Excel 打开</small></span>
        </button>
        <button className="action-button" type="button" onClick={() => {
          downloadTextFile(createSummaryCsv(summaries, range.label), `日迹-汇总-${dateStamp}.csv`, 'text/csv;charset=utf-8')
          notify('统计汇总 CSV 已下载')
        }}>
          <Download size={20} /><span><strong>汇总表格</strong><small>按行为和单位汇总</small></span>
        </button>
      </div>

      <div className="backup-band">
        <div>
          <FileJson size={22} />
          <span><strong>完整 JSON 备份</strong><small>{settings?.lastBackupAt ? `上次备份：${new Date(settings.lastBackupAt).toLocaleDateString('zh-CN')}` : '尚未备份'}</small></span>
        </div>
        <div className="backup-actions">
          <button className="secondary-button" type="button" onClick={() => void downloadBackup()} disabled={working}><Download size={17} />备份</button>
          <button className="secondary-button" type="button" onClick={() => importRef.current?.click()} disabled={working}><Upload size={17} />恢复</button>
          <input ref={importRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => void handleImport(event)} />
        </div>
      </div>
    </section>
  )
}
