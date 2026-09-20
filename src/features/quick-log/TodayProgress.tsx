const WATER_GOAL_ML = 2500

interface TodayProgressProps {
  waterAmount: number
  exerciseMinutes: number
}

const exerciseLabels = ['今天先躺平', '兴奋起来了', '开始流汗了', '冲劲十足', '能量爆棚']

function getExerciseLevel(minutes: number): number {
  if (minutes >= 60) return 4
  if (minutes >= 30) return 3
  if (minutes >= 10) return 2
  if (minutes >= 1) return 1
  return 0
}

export function TodayProgress({ waterAmount, exerciseMinutes }: TodayProgressProps) {
  const normalizedWater = Math.max(0, waterAmount)
  const waterPercent = Math.min(100, (normalizedWater / WATER_GOAL_ML) * 100)
  const normalizedExerciseMinutes = Math.max(0, exerciseMinutes)
  const exerciseLevel = getExerciseLevel(normalizedExerciseMinutes)

  return (
    <section className="today-progress" aria-label="今日饮水和锻炼进度">
      <div className="water-progress">
        <div
          className="water-cup"
          role="img"
          aria-label={`今日已喝水 ${normalizedWater} 毫升，目标 ${WATER_GOAL_ML} 毫升`}
        >
          <div className="water-fill" style={{ height: `${waterPercent}%` }}>
            <span className="water-wave water-wave-front" />
            <span className="water-wave water-wave-back" />
          </div>
          <span className="cup-shine" />
        </div>
        <div className="progress-copy">
          <span>今日喝水</span>
          <strong>{normalizedWater.toLocaleString()} <small>/ {WATER_GOAL_ML} ml</small></strong>
          <em>{waterPercent >= 100 ? '目标完成，继续保持' : `还差 ${Math.max(0, WATER_GOAL_ML - normalizedWater).toLocaleString()} ml`}</em>
        </div>
      </div>

      <div className="exercise-progress">
        <div
          className={`exercise-person exercise-level-${exerciseLevel}`}
          role="img"
          aria-label={`今日锻炼 ${normalizedExerciseMinutes} 分钟，${exerciseLabels[exerciseLevel]}`}
        >
          <span className="person-spark spark-left">✦</span>
          <span className="person-spark spark-right">✦</span>
          <span className="sweat-drop sweat-one" />
          <span className="sweat-drop sweat-two" />
          <span className="person-head">
            <span className="person-eye eye-left" />
            <span className="person-eye eye-right" />
            <span className="person-mouth" />
          </span>
          <span className="person-body" />
          <span className="person-arm arm-left" />
          <span className="person-arm arm-right" />
          <span className="person-leg leg-left" />
          <span className="person-leg leg-right" />
        </div>
        <div className="progress-copy exercise-copy">
          <span>今日锻炼</span>
          <strong>{normalizedExerciseMinutes} <small>分钟</small></strong>
          <em>{exerciseLabels[exerciseLevel]}</em>
        </div>
      </div>
    </section>
  )
}
