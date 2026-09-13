import { BarChart3, Clock3, History, Settings } from 'lucide-react'
import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { UpdatePrompt } from './components/UpdatePrompt'
import { initializeDatabase } from './db/database'
import type { NoticeAction, Notify } from './domain/ui'
import { HistoryPage } from './features/history/HistoryPage'
import { QuickLogPage } from './features/quick-log/QuickLogPage'
import { currentTimestamp } from './utils/dateTime'

const loadSettingsPage = () =>
  import('./features/settings/SettingsPage').then((module) => ({ default: module.SettingsPage }))
const loadStatisticsPage = () =>
  import('./features/statistics/StatisticsPage').then((module) => ({ default: module.StatisticsPage }))

const SettingsPage = lazy(loadSettingsPage)
const StatisticsPage = lazy(loadStatisticsPage)

type Tab = 'log' | 'history' | 'statistics' | 'settings'
type SettingsSection = 'export'

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

const NAV_LONG_PRESS_MS = 320
const NAV_GESTURE_TOLERANCE = 10

interface NavPointerState {
  pointerId: number
  startX: number
  startY: number
  lastX: number
  startTab: Tab
}

function App() {
  const [ready, setReady] = useState(false)
  const [startupError, setStartupError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('log')
  const [settingsSection, setSettingsSection] = useState<SettingsSection | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [navGliding, setNavGliding] = useState(false)
  const [navPreviewTab, setNavPreviewTab] = useState<Tab>('log')
  const [navGlideOffset, setNavGlideOffset] = useState(0)
  const navRef = useRef<HTMLElement>(null)
  const navPressTimerRef = useRef<number | null>(null)
  const navPointerRef = useRef<NavPointerState | null>(null)
  const navGestureActiveRef = useRef(false)
  const navPreviewRef = useRef<Tab>('log')
  const suppressNavClickUntilRef = useRef(0)

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

  useEffect(() => () => {
    if (navPressTimerRef.current !== null) window.clearTimeout(navPressTimerRef.current)
  }, [])

  const notify: Notify = (message, action) => {
    setNotice({ id: Date.now(), message, action })
  }

  function selectTab(tab: Tab) {
    setSettingsSection(null)
    setActiveTab(tab)
  }

  function openExportSettings() {
    void loadSettingsPage()
    setSettingsSection('export')
    setActiveTab('settings')
  }

  function clearNavPressTimer() {
    if (navPressTimerRef.current === null) return
    window.clearTimeout(navPressTimerRef.current)
    navPressTimerRef.current = null
  }

  function getNavGesturePosition(clientX: number) {
    const nav = navRef.current
    if (!nav) return null
    const bounds = nav.getBoundingClientRect()
    const inset = 6
    const usableWidth = Math.max(1, bounds.width - inset * 2)
    const segmentWidth = usableWidth / navigation.length
    const localX = Math.max(0, Math.min(clientX - bounds.left - inset, usableWidth - 0.01))
    const index = Math.max(0, Math.min(Math.floor(localX / segmentWidth), navigation.length - 1))
    const offset = Math.max(0, Math.min(localX - segmentWidth / 2, usableWidth - segmentWidth))
    return { tab: navigation[index].id, offset }
  }

  function updateNavGesture(clientX: number) {
    const position = getNavGesturePosition(clientX)
    if (!position) return
    navPreviewRef.current = position.tab
    setNavPreviewTab(position.tab)
    setNavGlideOffset(position.offset)
  }

  function handleNavPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0) return
    const target = event.target as HTMLElement
    const button = target.closest<HTMLButtonElement>('button[data-tab]')
    if (!button || !event.currentTarget.contains(button)) return
    const startTab = button.dataset.tab as Tab

    void loadSettingsPage()
    void loadStatisticsPage()

    clearNavPressTimer()
    navGestureActiveRef.current = false
    navPreviewRef.current = startTab
    navPointerRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      startTab,
    }

    navPressTimerRef.current = window.setTimeout(() => {
      const pointer = navPointerRef.current
      if (!pointer) return
      navPressTimerRef.current = null
      navGestureActiveRef.current = true
      setNavGliding(true)
      updateNavGesture(pointer.lastX)
      navRef.current?.setPointerCapture(pointer.pointerId)
      navigator.vibrate?.(18)
    }, NAV_LONG_PRESS_MS)
  }

  function handleNavPointerMove(event: ReactPointerEvent<HTMLElement>) {
    const pointer = navPointerRef.current
    if (!pointer || pointer.pointerId !== event.pointerId) return
    pointer.lastX = event.clientX

    if (!navGestureActiveRef.current) {
      const distance = Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY)
      if (distance > NAV_GESTURE_TOLERANCE) {
        clearNavPressTimer()
        navPointerRef.current = null
      }
      return
    }

    event.preventDefault()
    updateNavGesture(event.clientX)
  }

  function finishNavGesture(event: ReactPointerEvent<HTMLElement>) {
    const pointer = navPointerRef.current
    if (!pointer || pointer.pointerId !== event.pointerId) return
    clearNavPressTimer()

    if (navGestureActiveRef.current) {
      event.preventDefault()
      selectTab(navPreviewRef.current)
      suppressNavClickUntilRef.current = currentTimestamp() + 350
      navigator.vibrate?.(10)
    }

    if (navRef.current?.hasPointerCapture(event.pointerId)) {
      navRef.current.releasePointerCapture(event.pointerId)
    }
    navGestureActiveRef.current = false
    navPointerRef.current = null
    setNavGliding(false)
  }

  function cancelNavGesture(event: ReactPointerEvent<HTMLElement>) {
    const pointer = navPointerRef.current
    if (!pointer || pointer.pointerId !== event.pointerId) return
    clearNavPressTimer()
    suppressNavClickUntilRef.current = currentTimestamp() + 350
    if (navRef.current?.hasPointerCapture(event.pointerId)) {
      navRef.current.releasePointerCapture(event.pointerId)
    }
    navGestureActiveRef.current = false
    navPointerRef.current = null
    setNavGliding(false)
  }

  const selectedNavTab = navGliding ? navPreviewTab : activeTab
  const selectedNavIndex = navigation.findIndex((item) => item.id === selectedNavTab)
  const navStyle = {
    '--nav-selection-index': String(selectedNavIndex),
    '--nav-glide-offset': `${navGlideOffset}px`,
  } as CSSProperties

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
    <div className={`app-shell ${navGliding ? 'is-nav-gliding' : ''}`}>
      <header className="app-header">
        <button className="brand-button" type="button" onClick={() => selectTab('log')} aria-label="返回记录首页">
          <span className="brand-mark">日</span>
          <span><strong>日迹</strong><small>仅保存在本机</small></span>
        </button>
      </header>

      <main className="app-main">
        <Suspense fallback={<div className="lazy-state">正在打开…</div>}>
          {selectedNavTab === 'log' && <QuickLogPage notify={notify} />}
          {selectedNavTab === 'history' && <HistoryPage notify={notify} onOpenExport={openExportSettings} />}
          {selectedNavTab === 'statistics' && <StatisticsPage />}
          {selectedNavTab === 'settings' && (
            <SettingsPage
              notify={notify}
              initialSection={settingsSection}
            />
          )}
        </Suspense>
      </main>

      <nav
        ref={navRef}
        className={`bottom-nav ${navGliding ? 'is-gliding' : ''}`}
        aria-label="主要导航"
        style={navStyle}
        onPointerDown={handleNavPointerDown}
        onPointerMove={handleNavPointerMove}
        onPointerUp={finishNavGesture}
        onPointerCancel={cancelNavGesture}
        onContextMenu={(event) => event.preventDefault()}
      >
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <button
              type="button"
              key={item.id}
              data-tab={item.id}
              className={selectedNavTab === item.id ? 'active' : ''}
              onClick={() => {
                if (currentTimestamp() < suppressNavClickUntilRef.current) return
                selectTab(item.id)
              }}
              aria-current={activeTab === item.id ? 'page' : undefined}
            >
              <Icon size={21} strokeWidth={selectedNavTab === item.id ? 2.4 : 2} />
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
