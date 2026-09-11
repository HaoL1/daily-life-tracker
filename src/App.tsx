import { BarChart3, Clock3, History, Settings } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { UpdatePrompt } from './components/UpdatePrompt'
import { initializeDatabase } from './db/database'
import type { NoticeAction, Notify } from './domain/ui'
import { HistoryPage } from './features/history/HistoryPage'
import { QuickLogPage } from './features/quick-log/QuickLogPage'

const SettingsPage = lazy(() =>
  import('./features/settings/SettingsPage').then((module) => ({ default: module.SettingsPage })),
)
const StatisticsPage = lazy(() =>
  import('./features/statistics/StatisticsPage').then((module) => ({ default: module.StatisticsPage })),
)

type Tab = 'log' | 'history' | 'statistics' | 'settings'

interface Notice {
  id: number
  message: string
  action?: NoticeAction
}

const navigation = [
  { id: 'log' as const, label: '记录', icon: Clock3 },
  { id: 'history' as const, label: '历史', icon: History },
  { id: 'statistics' as const, label: '统计', icon: BarChart3 },
  { id: 'settings' as const, label: '设置', icon: Settings },
]

function App() {
  const [ready, setReady] = useState(false)
  const [startupError, setStartupError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('log')
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => {
    void initializeDatabase()
      .then(() => setReady(true))
      .catch((caught) => setStartupError(caught instanceof Error ? caught.message : '本地数据库无法打开'))
  }, [])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(null), notice.action ? 5000 : 3200)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const notify: Notify = (message, action) => {
    setNotice({ id: Date.now(), message, action })
  }

  if (startupError) {
    return (
      <main className="startup-state">
        <div className="brand-mark">日</div>
        <h1>暂时无法打开记录</h1>
        <p>{startupError}</p>
        <button className="primary-button" type="button" onClick={() => window.location.reload()}>重新尝试</button>
      </main>
    )
  }

  if (!ready) {
    return (
      <main className="startup-state">
        <div className="brand-mark loading-mark">日</div>
        <p>正在打开你的记录…</p>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="brand-button" type="button" onClick={() => setActiveTab('log')} aria-label="返回记录首页">
          <span className="brand-mark">日</span>
          <span><strong>日迹</strong><small>仅保存在本机</small></span>
        </button>
      </header>

      <main className="app-main">
        <Suspense fallback={<div className="lazy-state">正在打开…</div>}>
          {activeTab === 'log' && <QuickLogPage notify={notify} />}
          {activeTab === 'history' && <HistoryPage notify={notify} />}
          {activeTab === 'statistics' && <StatisticsPage />}
          {activeTab === 'settings' && <SettingsPage notify={notify} />}
        </Suspense>
      </main>

      <nav className="bottom-nav" aria-label="主要导航">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <button
              type="button"
              key={item.id}
              className={activeTab === item.id ? 'active' : ''}
              onClick={() => setActiveTab(item.id)}
              aria-current={activeTab === item.id ? 'page' : undefined}
            >
              <Icon size={21} strokeWidth={activeTab === item.id ? 2.4 : 2} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {notice && (
        <div className="toast" role="status" key={notice.id}>
          <span>{notice.message}</span>
          {notice.action && (
            <button type="button" onClick={async () => {
              await notice.action?.run()
              setNotice(null)
            }}>{notice.action.label}</button>
          )}
        </div>
      )}
      <UpdatePrompt />
    </div>
  )
}

export default App
