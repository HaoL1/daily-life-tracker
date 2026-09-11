import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '今天，记一下' })).toBeVisible()
})

test('confirms measurements and notes before saving records', async ({ page }, testInfo) => {
  const recentSection = page.locator('section[aria-labelledby="recent-title"]')

  await page.getByRole('button', { name: '记录喝水', exact: true }).click()
  await expect(page.getByRole('heading', { name: '记录喝水' })).toBeVisible()
  await expect(page.getByLabel('计量')).toHaveValue('250')
  await expect(page.getByLabel('计量')).not.toBeFocused()
  await expect(recentSection.getByText('喝水', { exact: true })).toHaveCount(0)
  await page.getByLabel('计量').fill('300')
  await page.getByLabel('备注（可选）').fill('早餐后喝的温水')
  await page.getByRole('button', { name: '确认记录' }).click()
  await expect(page.getByText('已记录 喝水 300 ml')).toBeVisible()
  await expect(recentSection.getByText('喝水', { exact: true })).toBeVisible()
  await expect(recentSection.getByText('早餐后喝的温水')).toBeVisible()

  await page.getByRole('button', { name: '记录锻炼', exact: true }).click()
  await expect(page.getByRole('heading', { name: '开始锻炼' })).toBeVisible()
  await page.getByLabel('备注（可选）').fill('跑步 5 公里和拉伸')
  await page.getByRole('button', { name: '开始计时' }).click()
  await expect(page.getByRole('status').getByText('锻炼开始计时')).toBeVisible()
  await expect(page.getByRole('button', { name: '结束锻炼' })).toBeVisible()
  await page.waitForTimeout(1100)
  await page.getByRole('button', { name: '结束锻炼' }).click()
  await expect(page.getByRole('heading', { name: '结束锻炼' })).toBeVisible()
  await expect(page.getByLabel('备注（可选）')).toHaveValue('跑步 5 公里和拉伸')
  await page.getByRole('button', { name: '结束并保存' }).click()
  await expect(page.getByText(/锻炼已结束/)).toBeVisible()

  await page.getByRole('button', { name: '历史', exact: true }).click()
  await expect(page.getByRole('heading', { name: '每一天，都有迹可循' })).toBeVisible()
  await expect(page.locator('.history-groups').getByText('喝水', { exact: true })).toBeVisible()
  await expect(page.locator('.history-groups').getByText('锻炼', { exact: true })).toBeVisible()
  await expect(page.locator('.history-groups').getByText('早餐后喝的温水')).toBeVisible()
  await expect(page.locator('.history-groups').getByText('跑步 5 公里和拉伸')).toBeVisible()
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-history-notes.png`,
    fullPage: true,
  })
})

test('shows all presets, adds a custom action and renders statistics', async ({ page }, testInfo) => {
  await expect(page.getByRole('button', { name: '记录小手', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '记录大手', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '记录屈臣氏苏打汽水饮料', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '记录咖啡', exact: true })).toBeVisible()

  await page.getByRole('button', { name: '记录屈臣氏苏打汽水饮料', exact: true }).click()
  await expect(page.getByLabel('计量')).toHaveValue('330')
  await expect(page.getByLabel('单位')).toHaveValue('ml')
  await page.getByRole('button', { name: '关闭' }).click()

  await page.getByRole('button', { name: '记录咖啡', exact: true }).click()
  await expect(page.getByLabel('计量')).toHaveValue('1')
  await expect(page.getByLabel('单位')).toHaveValue('次')
  await page.getByRole('button', { name: '关闭' }).click()

  await page.getByRole('button', { name: '记录喝水', exact: true }).click()
  await page.getByRole('button', { name: '确认记录' }).click()
  await page.getByRole('button', { name: '设置', exact: true }).click()
  await expect(page.getByRole('heading', { name: '按自己的方式记录' })).toBeVisible()
  await page.getByRole('button', { name: '添加' }).click()
  await page.getByLabel('名称').fill('阅读')
  await page.getByLabel('默认数量').fill('30')
  await page.getByLabel('单位').fill('分钟')
  await page.getByRole('button', { name: '保存行为' }).click()
  await expect(page.getByText('新行为已添加')).toBeVisible()

  await page.getByRole('button', { name: '记录', exact: true }).click()
  await expect(page.getByRole('button', { name: '记录阅读', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '统计', exact: true }).click()
  await expect(page.getByRole('heading', { name: '看看最近的节奏' })).toBeVisible()
  await expect(page.locator('.summary-list').getByText('喝水', { exact: true })).toBeVisible()

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasHorizontalOverflow).toBe(false)
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-statistics.png`,
    fullPage: true,
  })
})
