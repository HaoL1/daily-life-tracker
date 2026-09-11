import { Clock3 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { ActiveSession, ActivityDefinition } from '../domain/models'
import { formatElapsed, formatTime } from '../utils/dateTime'
import { ActivityIcon } from './ActivityIcon'
import { Modal } from './Modal'

interface QuickEntryValues {
  amount: string
  note: string
}

interface QuickEntryModalProps {
  activity: ActivityDefinition
  session?: ActiveSession
  now: number
  onClose: () => void
  onConfirm: (values: QuickEntryValues) => Promise<void>
}

function notePlaceholder(activity: ActivityDefinition): string {
  if (activity.icon === 'meal') return '例如：米饭、鸡胸肉和蔬菜'
  if (activity.icon === 'exercise') return '例如：跑步 5 公里、力量训练'
  if (activity.icon === 'drive') return '例如：开车去公司'
  if (activity.icon === 'snack') return '例如：薯片、巧克力'
  if (activity.icon === 'fruit') return '例如：苹果、蓝莓'
  return `补充这次${activity.name}的具体内容`
}

export function QuickEntryModal({
  activity,
  session,
  now,
  onClose,
  onConfirm,
}: QuickEntryModalProps) {
  const [amount, setAmount] = useState(session?.amount ?? activity.defaultAmount)
  const [note, setNote] = useState(session?.note ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isStartingTimer = activity.mode === 'timer' && !session
  const isStoppingTimer = Boolean(session)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onConfirm({ amount, note })
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isStoppingTimer ? `结束${activity.name}` : isStartingTimer ? `开始${activity.name}` : `记录${activity.name}`}
      description={isStoppingTimer ? '确认本次计量和备注后保存。' : '确认计量，也可以补充具体内容。'}
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={handleSubmit}>
        <div className="quick-entry-summary">
          <ActivityIcon icon={activity.icon} tone={activity.tone} size={24} />
          <span>
            <strong>{activity.name}</strong>
            {session ? (
              <small><Clock3 size={14} />{formatTime(session.startedAt)} 开始 · {formatElapsed(session.startedAt, now)}</small>
            ) : (
              <small>记录时间为现在</small>
            )}
          </span>
        </div>

        <div className="field-row">
          <label className="field field-grow">
            <span>计量</span>
            <input
              inputMode="decimal"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <label className="field field-unit">
            <span>单位</span>
            <input value={activity.unit} disabled />
          </label>
        </div>

        <label className="field">
          <span>备注（可选）</span>
          <textarea
            rows={3}
            maxLength={300}
            placeholder={notePlaceholder(activity)}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button full-width" type="submit" disabled={saving}>
          {saving
            ? '正在保存…'
            : isStoppingTimer
              ? '结束并保存'
              : isStartingTimer
                ? '开始计时'
                : '确认记录'}
        </button>
      </form>
    </Modal>
  )
}
