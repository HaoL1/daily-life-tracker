import { useState, type FormEvent } from 'react'
import type { ActivityDefinition, ActivityRecord } from '../domain/models'
import { createRecordFromDraft, updateRecord } from '../services/recordService'
import { inputToIso, minutesAgoIso, toDateTimeInput } from '../utils/dateTime'
import { Modal } from './Modal'

interface RecordEditorProps {
  activities: ActivityDefinition[]
  record?: ActivityRecord
  initialActivityId?: string
  onClose: () => void
  onSaved: (message: string) => void
  onDelete?: () => Promise<void>
}

export function RecordEditor({
  activities,
  record,
  initialActivityId,
  onClose,
  onSaved,
  onDelete,
}: RecordEditorProps) {
  const initialActivity =
    activities.find((item) => item.id === (record?.activityId ?? initialActivityId)) ?? activities[0]
  const [activityId, setActivityId] = useState(record?.activityId ?? initialActivity?.id ?? '')
  const [amount, setAmount] = useState(record?.amount ?? initialActivity?.defaultAmount ?? '1')
  const [recordedAt, setRecordedAt] = useState(toDateTimeInput(record?.recordedAt))
  const [startedAt, setStartedAt] = useState(
    toDateTimeInput(record?.startedAt ?? minutesAgoIso(30)),
  )
  const [endedAt, setEndedAt] = useState(toDateTimeInput(record?.endedAt))
  const [note, setNote] = useState(record?.note ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const selectedActivity = activities.find((item) => item.id === activityId) ?? (record ? {
    id: record.activityId,
    name: record.activityName,
    icon: record.activityIcon,
    tone: 'neutral' as const,
    mode: record.activityMode ?? (record.startedAt ? 'timer' as const : 'instant' as const),
    defaultAmount: record.amount,
    unit: record.unit,
    sortOrder: -1,
    isArchived: false,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  } : undefined)
  const recordMode = record?.activityMode ?? selectedActivity?.mode
  const displayUnit = record?.unit ?? selectedActivity?.unit ?? ''

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedActivity) return
    setSaving(true)
    setError('')

    try {
      if (record) {
        await updateRecord(record.id, {
          amount,
          recordedAt:
            recordMode === 'timer' ? inputToIso(endedAt) : inputToIso(recordedAt),
          note,
          startedAt: recordMode === 'timer' ? inputToIso(startedAt) : undefined,
          endedAt: recordMode === 'timer' ? inputToIso(endedAt) : undefined,
        })
      } else {
        await createRecordFromDraft({
          activityId,
          amount,
          recordedAt:
            recordMode === 'timer' ? inputToIso(endedAt) : inputToIso(recordedAt),
          note,
          startedAt: recordMode === 'timer' ? inputToIso(startedAt) : undefined,
          endedAt: recordMode === 'timer' ? inputToIso(endedAt) : undefined,
        })
      }
      onSaved(record ? '记录已更新' : '补录成功')
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!record || !onDelete || !window.confirm(`删除“${record.activityName}”这条记录？`)) return
    setDeleting(true)
    setError('')
    try {
      await onDelete()
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '删除失败，请重试')
      setDeleting(false)
    }
  }

  return (
    <Modal
      title={record ? '编辑记录' : '补记一条'}
      description={record ? '修改后，统计会自动重新计算。' : '可以补录过去的时间和数量。'}
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={handleSubmit}>
        <label className="field">
          <span>行为</span>
          <select
            value={activityId}
            disabled={Boolean(record)}
            onChange={(event) => {
              const nextId = event.target.value
              const nextActivity = activities.find((item) => item.id === nextId)
              setActivityId(nextId)
              if (nextActivity) setAmount(nextActivity.defaultAmount)
            }}
          >
            {record && !activities.some((activity) => activity.id === record.activityId) && (
              <option value={record.activityId}>{record.activityName}（已删除）</option>
            )}
            {activities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activity.name}
              </option>
            ))}
          </select>
        </label>

        <div className="field-row">
          <label className="field field-grow">
            <span>数量</span>
            <input
              inputMode="decimal"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <label className="field field-unit">
            <span>单位</span>
            <input value={displayUnit} disabled />
          </label>
        </div>

        {recordMode === 'timer' ? (
          <>
            <label className="field">
              <span>开始时间</span>
              <input
                type="datetime-local"
                required
                value={startedAt}
                onChange={(event) => setStartedAt(event.target.value)}
              />
            </label>
            <label className="field">
              <span>结束时间</span>
              <input
                type="datetime-local"
                required
                value={endedAt}
                onChange={(event) => setEndedAt(event.target.value)}
              />
            </label>
          </>
        ) : (
          <label className="field">
            <span>发生时间</span>
            <input
              type="datetime-local"
              required
              value={recordedAt}
              onChange={(event) => setRecordedAt(event.target.value)}
            />
          </label>
        )}

        <label className="field">
          <span>备注（可选）</span>
          <textarea
            rows={3}
            maxLength={300}
            placeholder="例如：早餐后、户外跑步"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions">
          {record && onDelete && (
            <button className="danger-text-button" type="button" disabled={saving || deleting} onClick={() => void handleDelete()}>
              {deleting ? '正在删除…' : '删除记录'}
            </button>
          )}
          <button className="primary-button form-submit" type="submit" disabled={saving || deleting || !selectedActivity}>
            {saving ? '正在保存…' : '保存记录'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
