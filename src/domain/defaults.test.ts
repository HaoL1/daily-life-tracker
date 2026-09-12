import { describe, expect, it } from 'vitest'
import { createDefaultActivities } from './defaults'

describe('default activities', () => {
  it('includes the ten requested presets with expected measurements', () => {
    const activities = createDefaultActivities()

    expect(activities).toHaveLength(10)
    expect(activities.find((activity) => activity.name === '上厕所')).toBeUndefined()
    expect(activities.find((activity) => activity.name === '小手')).toBeUndefined()
    expect(activities.find((activity) => activity.name === '大手')).toBeUndefined()
    expect(activities.find((activity) => activity.name === '小便')).toMatchObject({
      defaultAmount: '1',
      unit: '次',
    })
    expect(activities.find((activity) => activity.name === '大便')).toMatchObject({
      defaultAmount: '1',
      unit: '次',
    })
    expect(activities.find((activity) => activity.name === '屈臣氏苏打汽水饮料')).toMatchObject({
      defaultAmount: '330',
      unit: 'ml',
    })
    expect(activities.find((activity) => activity.name === '咖啡')).toMatchObject({
      defaultAmount: '1',
      unit: '次',
    })
  })
})
