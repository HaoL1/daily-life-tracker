import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Clock3, Plus, TimerReset } from 'lucide-react'
import { ActivityIcon } from '../../components/ActivityIcon'
import type { ActiveSession, ActivityDefinition } from '../../domain/models'
import { formatElapsed } from '../../utils/dateTime'

interface SortableQuickCardProps {
  activity: ActivityDefinition
  session?: ActiveSession
  clock: number
  onOpen: () => void
  canOpen: () => boolean
}

export function SortableQuickCard({ activity, session, clock, onOpen, canOpen }: SortableQuickCardProps) {
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
        onClick={() => {
          if (canOpen()) onOpen()
        }}
        aria-label={isRunning ? `结束${activity.name}` : `记录${activity.name}`}
        title="点按记录，长按拖动排序"
        {...attributes}
        {...listeners}
        draggable={false}
        onContextMenu={(event) => event.preventDefault()}
        onDragStart={(event) => event.preventDefault()}
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
    </article>
  )
}
