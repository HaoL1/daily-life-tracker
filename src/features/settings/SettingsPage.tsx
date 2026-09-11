import { useLiveQuery } from 'dexie-react-hooks'
import {
  Archive,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  HardDrive,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { ActivityEditor } from '../../components/ActivityEditor'
import { ActivityIcon } from '../../components/ActivityIcon'
import { db } from '../../db/database'
import type { ActivityDefinition } from '../../domain/models'
import type { Notify } from '../../domain/ui'
import { moveActivity, setActivityArchived } from '../../services/activityService'
import { requestPersistentStorage, type StorageStatus } from '../../services/storageService'
import { DataExportPanel } from './DataExportPanel'

interface SettingsPageProps {
  notify: Notify
}

export function SettingsPage({ notify }: SettingsPageProps) {
  const activities = useLiveQuery(() => db.activities.orderBy('sortOrder').toArray(), [], [])
  const activeSessions = useLiveQuery(() => db.activeSessions.toArray(), [], [])
  const [editor, setEditor] = useState<ActivityDefinition | 'new' | null>(null)
  const [storage, setStorage] = useState<StorageStatus | null>(null)
  const visible = activities.filter((activity) => !activity.isArchived)
  const archived = activities.filter((activity) => activity.isArchived)

  useEffect(() => {
    void requestPersistentStorage().then(setStorage).catch(() => {
      setStorage({ supported: false, persistent: false })
    })
  }, [])

  async function archive(activity: ActivityDefinition, isArchived: boolean) {
    try {
      await setActivityArchived(activity.id, isArchived)
      notify(isArchived ? '行为已归档，历史记录仍会保留' : '行为已恢复到首页')
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
          {visible.map((activity, index) => {
            const running = activeSessions.some((session) => session.activityId === activity.id)
            return (
              <article className="activity-setting-row" key={activity.id}>
                <ActivityIcon icon={activity.icon} tone={activity.tone} />
                <div className="activity-setting-copy">
                  <strong>{activity.name}{running && <span className="inline-status">计时中</span>}</strong>
                  <span>{activity.mode === 'timer' ? '开始 / 结束计时' : `默认 ${activity.defaultAmount} ${activity.unit}`}</span>
                </div>
                <div className="row-actions settings-row-actions">
                  <button className="icon-button small-icon-button" type="button" disabled={index === 0} onClick={() => void moveActivity(activity.id, -1)} aria-label={`上移${activity.name}`} title="上移"><ArrowUp size={17} /></button>
                  <button className="icon-button small-icon-button" type="button" disabled={index === visible.length - 1} onClick={() => void moveActivity(activity.id, 1)} aria-label={`下移${activity.name}`} title="下移"><ArrowDown size={17} /></button>
                  <button className="icon-button small-icon-button" type="button" onClick={() => setEditor(activity)} aria-label={`编辑${activity.name}`} title="编辑"><Pencil size={17} /></button>
                  <button className="icon-button small-icon-button" type="button" onClick={() => void archive(activity, true)} aria-label={`归档${activity.name}`} title="归档"><Archive size={17} /></button>
                </div>
              </article>
            )
          })}
        </div>
        {archived.length > 0 && (
          <details className="archived-list">
            <summary>已归档行为 <span>{archived.length}</span><ChevronRight size={17} /></summary>
            {archived.map((activity) => (
              <div className="archived-row" key={activity.id}>
                <ActivityIcon icon={activity.icon} tone={activity.tone} size={18} />
                <span>{activity.name}</span>
                <button className="text-button" type="button" onClick={() => void archive(activity, false)}><RotateCcw size={15} />恢复</button>
              </div>
            ))}
          </details>
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
