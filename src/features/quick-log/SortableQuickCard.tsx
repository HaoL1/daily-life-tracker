import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Clock3, Plus, TimerReset } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { ActivityIcon } from '../../components/ActivityIcon'
import type { ActiveSession, ActivityDefinition } from '../../domain/models'
import { formatElapsed } from '../../utils/dateTime'

interface SortableQuickCardProps {
  activity: ActivityDefinition
  session?: ActiveSession
  clock: number
  todayCount: number
  isSelected: boolean
  onOpen: () => void
  onSelect: () => void
  onDelete: () => void
  canOpen: () => boolean
}

export function SortableQuickCard({
  activity,
  session,
  clock,
  todayCount,
  isSelected,
  onOpen,
  onSelect,
  onDelete,
  canOpen,
}: SortableQuickCardProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: activity.id })
  const isRunning = Boolean(session)
  const longPressTimerRef = useRef<number | null>(null)
  const suppressClickUntilRef = useRef(0)
  const statusLabel = isRunning ? '进行中' : activity.mode === 'timer' ? '计时' : '即时'
  const helperText = session
    ? `${formatElapsed(session.startedAt, clock)} · 点按结束并保存`
    : activity.mode === 'timer'
      ? '点按开始计时'
      : `默认 +${activity.defaultAmount} ${activity.unit}`
  const actionIcon = isRunning ? <TimerReset size={20} /> : activity.mode === 'timer' ? <Clock3 size={20} /> : <Plus size={20} />
  const showDeleteAction = isSelected && !isDragging

  useEffect(() => () => {
    if (longPressTimerRef.current !== null) window.clearTimeout(longPressTimerRef.current)
  }, [])

  useEffect(() => {
    if (isDragging) clearLongPressTimer()
  }, [isDragging])

  function clearLongPressTimer() {
    if (longPressTimerRef.current === null) return
    window.clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = null
  }

  function scheduleLongPress() {
    clearLongPressTimer()
    longPressTimerRef.current = window.setTimeout(() => {
      suppressClickUntilRef.current = Date.now() + 250
      onSelect()
      longPressTimerRef.current = null
    }, 420)
  }

  return (
    <article
      ref={setNodeRef}
      className={`quick-card ${isRunning ? 'is-running' : ''} ${isDragging ? 'is-dragging' : ''} ${isSelected ? 'is-selected' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        className="quick-card-main"
        type="button"
        onClick={() => {
          if (Date.now() < suppressClickUntilRef.current) {
            return
          }
          if (canOpen()) onOpen()
        }}
        onPointerDown={scheduleLongPress}
        onPointerUp={clearLongPressTimer}
        onPointerCancel={clearLongPressTimer}
        onPointerLeave={clearLongPressTimer}
        aria-label={isRunning ? `结束${activity.name}` : `记录${activity.name}`}
        title="点按记录，长按拖动排序"
        {...attributes}
        {...listeners}
        draggable={false}
        onContextMenu={(event) => event.preventDefault()}
        onDragStart={(event) => event.preventDefault()}
      >
        <span className="quick-card-header">
          <span className={`quick-card-chip quick-card-status ${isRunning ? 'is-running' : ''}`}>
            {statusLabel}
          </span>
          <span className="quick-card-chip quick-card-count" aria-label={`${activity.name}今天已完成${todayCount}次`}>
            今日 {todayCount}次
          </span>
        </span>
        <span className="quick-card-body">
          <ActivityIcon icon={activity.icon} tone={activity.tone} size={25} />
          <span className="quick-card-copy">
            <strong className={activity.name.length > 7 ? 'long-name' : undefined}>{activity.name}</strong>
            <small>{helperText}</small>
          </span>
          <span className="quick-card-action" aria-hidden="true">{actionIcon}</span>
        </span>
      </button>
      {showDeleteAction && (
        <button
          className="quick-card-delete"
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
          aria-label={`删除${activity.name}`}
        >
          删除
        </button>
      )}
    </article>
  )
}
