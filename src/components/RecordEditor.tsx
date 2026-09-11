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
}

export function RecordEditor({
  activities,
  record,
  initialActivityId,
  onClose,
  onSaved,
}: RecordEditorProps) {
  const initialActivity =
    activities.find((item) => item.id === (record?.activityId ?? initialActivityId)) ?? activities[0]
  const [activityId, setActivityId] = useState(initialActivity?.id ?? '')
  const [amount, setAmount] = useState(record?.amount ?? initialActivity?.defaultAmount ?? '1')
  const [recordedAt, setRecordedAt] = useState(toDateTimeInput(record?.recordedAt))
  const [startedAt, setStartedAt] = useState(
    toDateTimeInput(record?.startedAt ?? minutesAgoIso(30)),
  )
  const [endedAt, setEndedAt] = useState(toDateTimeInput(record?.endedAt))
  const [note, setNote] = useState(record?.note ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const selectedActivity = activities.find((item) => item.id === activityId)
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
            {activities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activity.name}{activity.isArchived ? '（已归档）' : ''}
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
        <button className="primary-button full-width" type="submit" disabled={saving || !selectedActivity}>
          {saving ? '正在保存…' : '保存记录'}
        </button>
      </form>
    </Modal>
  )
}
