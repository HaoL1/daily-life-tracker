import { useLiveQuery } from 'dexie-react-hooks'
import {
  HardDrive,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { ActivityEditor } from '../../components/ActivityEditor'
import { db } from '../../db/database'
import type { ActivityDefinition } from '../../domain/models'
import type { Notify } from '../../domain/ui'
import {
  deleteActivity,
  permanentlyDeleteActivity,
  restoreActivity,
} from '../../services/activityService'
import { requestPersistentStorage, type StorageStatus } from '../../services/storageService'
import { DataExportPanel } from './DataExportPanel'

interface SettingsPageProps {
  notify: Notify
  initialSection?: 'export' | null
  onInitialSectionHandled?: () => void
}

export function SettingsPage({ notify, initialSection, onInitialSectionHandled }: SettingsPageProps) {
  const activities = useLiveQuery(() => db.activities.orderBy('sortOrder').toArray(), [], [])
  const activeSessions = useLiveQuery(() => db.activeSessions.toArray(), [], [])
  const [editor, setEditor] = useState<ActivityDefinition | 'new' | null>(null)
  const [storage, setStorage] = useState<StorageStatus | null>(null)
  const visible = activities.filter((activity) => !activity.isArchived)
  const deleted = activities.filter((activity) => activity.isArchived)

  useEffect(() => {
    void requestPersistentStorage().then(setStorage).catch(() => {
      setStorage({ supported: false, persistent: false })
    })
  }, [])

  useEffect(() => {
    if (initialSection !== 'export') return
    const frame = window.requestAnimationFrame(() => {
      const exportSection = document.getElementById('export-and-backup')
      exportSection?.focus({ preventScroll: true })
      exportSection?.scrollIntoView({ block: 'start' })
      onInitialSectionHandled?.()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [initialSection, onInitialSectionHandled])

  async function remove(activity: ActivityDefinition) {
    const recordCount = await db.records.where('activityId').equals(activity.id).count()
    const historyMessage = recordCount
      ? `已有 ${recordCount} 条历史记录会继续保留。`
      : '这个行为还没有历史记录。'
    if (!window.confirm(`从首页删除“${activity.name}”？\n\n${historyMessage}\n此操作无法撤销。`)) return

    try {
      await deleteActivity(activity.id)
      notify(`“${activity.name}”已删除，历史记录仍会保留`)
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : '操作失败，请重试')
    }
  }

  async function restore(activity: ActivityDefinition) {
    try {
      await restoreActivity(activity.id)
      notify(`“${activity.name}”已恢复到首页`)
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : '操作失败，请重试')
    }
  }

  async function removeForever(activity: ActivityDefinition) {
    const recordCount = await db.records.where('activityId').equals(activity.id).count()
    const historyMessage = recordCount
      ? `已有 ${recordCount} 条历史记录会继续保留，但这个行为将无法恢复。`
      : '这个行为还没有历史记录，删除后也无法恢复。'
    if (!window.confirm(`永久删除“${activity.name}”？\n\n${historyMessage}`)) return

    try {
      await permanentlyDeleteActivity(activity.id)
      notify(`“${activity.name}”已永久删除`)
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : '操作失败，请重试')
    }
  }

  return (
    <div className="page settings-page">
      <header className="page-heading">
        <div><p className="eyebrow">你的日迹</p><h1>按自己的方式记录</h1><p className="heading-support">调整按钮、备份数据，也可以查看本机存储状态。</p></div>
      </header>

      <section className="privacy-band">
        <ShieldCheck size={24} />
        <div><strong>记录只保存在这台设备</strong><span>本应用没有账号、服务器或数据追踪。</span></div>
        <span className={`status-pill ${storage?.persistent ? 'status-good' : ''}`}>
          {storage === null ? '检查中' : storage.persistent ? '持久存储' : '请定期备份'}
        </span>
      </section>

      <section className="settings-section" aria-labelledby="activities-title">
        <div className="section-heading">
          <div><p className="section-kicker">首页按钮</p><h2 id="activities-title">行为管理</h2></div>
          <button className="secondary-button compact-button" type="button" onClick={() => setEditor('new')}><Plus size={17} />添加</button>
        </div>
        <div className="activity-settings-list">
          {visible.map((activity) => {
            const running = activeSessions.some((session) => session.activityId === activity.id)
            return (
              <article className="activity-setting-row" key={activity.id}>
                <span className={`activity-setting-marker tone-${activity.tone}`} aria-hidden="true" />
                <div className="activity-setting-copy">
                  <strong>{activity.name}{running && <span className="inline-status">计时中</span>}</strong>
                  <span>{activity.mode === 'timer' ? '开始 / 结束计时' : `默认 ${activity.defaultAmount} ${activity.unit}`}</span>
                </div>
                <div className="row-actions settings-row-actions">
                  <button className="icon-button small-icon-button" type="button" onClick={() => setEditor(activity)} aria-label={`编辑${activity.name}`} title="编辑"><Pencil size={17} /></button>
                  <button className="icon-button small-icon-button danger-button" type="button" onClick={() => void remove(activity)} aria-label={`删除${activity.name}`} title="删除"><Trash2 size={17} /></button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="settings-section" aria-labelledby="deleted-activities-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">误删恢复</p>
            <h2 id="deleted-activities-title">已删除</h2>
          </div>
          <span className="section-count">{deleted.length} 项</span>
        </div>
        {deleted.length ? (
          <div className="activity-settings-list">
            {deleted.map((activity) => (
              <article className="activity-setting-row" key={activity.id}>
                <span className={`activity-setting-marker tone-${activity.tone}`} aria-hidden="true" />
                <div className="activity-setting-copy">
                  <strong>{activity.name}</strong>
                  <span>可恢复到首页，也可永久删除</span>
                </div>
                <div className="row-actions settings-row-actions">
                  <button
                    className="icon-button small-icon-button"
                    type="button"
                    onClick={() => void restore(activity)}
                    aria-label={`恢复${activity.name}`}
                    title="恢复"
                  >
                    <RotateCcw size={17} />
                  </button>
                  <button
                    className="icon-button small-icon-button danger-button"
                    type="button"
                    onClick={() => void removeForever(activity)}
                    aria-label={`永久删除${activity.name}`}
                    title="永久删除"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state quiet-empty">
            <p>还没有已删除行为</p>
          </div>
        )}
      </section>

      <DataExportPanel notify={notify} />

      <section className="settings-section install-section" aria-labelledby="install-title">
        <div className="section-heading"><div><p className="section-kicker">iPhone 使用</p><h2 id="install-title">安装与数据安全</h2></div></div>
        <div className="info-list">
          <div><Smartphone size={20} /><span><strong>添加到主屏幕</strong><small>在 Safari 点“分享”，再点“添加到主屏幕”。</small></span></div>
          <div><HardDrive size={20} /><span><strong>不要清除网站数据</strong><small>Safari 清除网站数据会删除本机记录；请定期下载 JSON 备份。</small></span></div>
        </div>
      </section>

      {editor && (
        <ActivityEditor
          activity={editor === 'new' ? undefined : editor}
          onClose={() => setEditor(null)}
          onSaved={notify}
        />
      )}
    </div>
  )
}
