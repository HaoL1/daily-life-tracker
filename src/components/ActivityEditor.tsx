import { useState, type FormEvent } from 'react'
import type {
  ActivityDefinition,
  ActivityIcon,
  ActivityMode,
  ActivityTone,
} from '../domain/models'
import { saveActivity } from '../services/activityService'
import { Modal } from './Modal'

const iconOptions: Array<{ value: ActivityIcon; label: string }> = [
  { value: 'water', label: '水滴' },
  { value: 'toilet', label: '如厕' },
  { value: 'soda', label: '汽水' },
  { value: 'coffee', label: '咖啡' },
  { value: 'meal', label: '餐具' },
  { value: 'snack', label: '零食' },
  { value: 'fruit', label: '水果' },
  { value: 'exercise', label: '锻炼' },
  { value: 'drive', label: '汽车' },
  { value: 'custom', label: '其他' },
]

const toneOptions: Array<{ value: ActivityTone; label: string }> = [
  { value: 'accent', label: '玫红' },
  { value: 'link', label: '蓝色' },
  { value: 'success', label: '绿色' },
  { value: 'warning', label: '黄色' },
  { value: 'danger', label: '红色' },
  { value: 'neutral', label: '灰色' },
]

interface ActivityEditorProps {
  activity?: ActivityDefinition
  onClose: () => void
  onSaved: (message: string) => void
}

export function ActivityEditor({ activity, onClose, onSaved }: ActivityEditorProps) {
  const [name, setName] = useState(activity?.name ?? '')
  const [icon, setIcon] = useState<ActivityIcon>(activity?.icon ?? 'custom')
  const [tone, setTone] = useState<ActivityTone>(activity?.tone ?? 'accent')
  const [mode, setMode] = useState<ActivityMode>(activity?.mode ?? 'instant')
  const [defaultAmount, setDefaultAmount] = useState(activity?.defaultAmount ?? '1')
  const [unit, setUnit] = useState(activity?.unit ?? '次')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await saveActivity({ name, icon, tone, mode, defaultAmount, unit }, activity)
      onSaved(activity ? '行为已更新' : '新行为已添加')
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={activity ? '编辑行为' : '添加行为'}
      description="设置首页按钮的默认记录方式。"
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={handleSubmit}>
        <label className="field">
          <span>名称</span>
          <input autoFocus required maxLength={20} value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <div className="field-row">
          <label className="field field-grow">
            <span>图标</span>
            <select value={icon} onChange={(event) => setIcon(event.target.value as ActivityIcon)}>
              {iconOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="field field-grow">
            <span>颜色</span>
            <select value={tone} onChange={(event) => setTone(event.target.value as ActivityTone)}>
              {toneOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
        <fieldset className="field-group">
          <legend>记录方式</legend>
          <div className="segmented two-options">
            <button type="button" className={mode === 'instant' ? 'selected' : ''} onClick={() => setMode('instant')}>点一下记录</button>
            <button type="button" className={mode === 'timer' ? 'selected' : ''} onClick={() => setMode('timer')}>开始 / 结束</button>
          </div>
        </fieldset>
        <div className="field-row">
          <label className="field field-grow">
            <span>默认数量</span>
            <input inputMode="decimal" required value={defaultAmount} onChange={(event) => setDefaultAmount(event.target.value)} />
          </label>
          <label className="field field-grow">
            <span>单位</span>
            <input required maxLength={10} value={unit} onChange={(event) => setUnit(event.target.value)} />
          </label>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button full-width" type="submit" disabled={saving}>
          {saving ? '正在保存…' : '保存行为'}
        </button>
      </form>
    </Modal>
  )
}
