import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Clock3, GripVertical, Plus, TimerReset } from 'lucide-react'
import { ActivityIcon } from '../../components/ActivityIcon'
import type { ActiveSession, ActivityDefinition } from '../../domain/models'
import { formatElapsed } from '../../utils/dateTime'

interface SortableQuickCardProps {
  activity: ActivityDefinition
  session?: ActiveSession
  clock: number
  onOpen: () => void
}

export function SortableQuickCard({ activity, session, clock, onOpen }: SortableQuickCardProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: activity.id })
  const isRunning = Boolean(session)

  return (
    <article
      ref={setNodeRef}
      className={`quick-card ${isRunning ? 'is-running' : ''} ${isDragging ? 'is-dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        className="quick-card-main"
        type="button"
        onClick={onOpen}
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
      <button
        className="quick-card-drag"
        type="button"
        aria-label={`拖动调整${activity.name}位置`}
        title="拖动调整位置"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
    </article>
  )
}
