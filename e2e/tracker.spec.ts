import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '今天，记一下' })).toBeVisible()
})

test('long-presses and glides across the glass navigation', async ({ page }, testInfo) => {
  const nav = page.getByRole('navigation', { name: '主要导航' })
  const start = await nav.getByRole('button', { name: '记录', exact: true }).boundingBox()
  const target = await nav.getByRole('button', { name: '统计', exact: true }).boundingBox()
  if (!start || !target) throw new Error('没有找到导航标签')

  const startX = start.x + start.width / 2
  const startY = start.y + start.height / 2
  const endX = target.x + target.width / 2
  const endY = target.y + target.height / 2

  if (testInfo.project.name === 'iphone-viewport') {
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: startX, y: startY, id: 1 }],
    })
    await page.waitForTimeout(360)
    await expect(nav).toHaveClass(/is-gliding/)
    for (let step = 1; step <= 12; step += 1) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{
          x: startX + (endX - startX) * step / 12,
          y: startY + (endY - startY) * step / 12,
          id: 1,
        }],
      })
    }
    await expect(nav.getByRole('button', { name: '统计', exact: true })).toHaveClass(/active/)
    await expect(page.getByRole('heading', { name: '看看最近的节奏' })).toBeVisible()
    await expect(nav.locator('button[aria-current=page] span')).toHaveText('记录')
    const glass = await nav.evaluate((element) => ({
      background: getComputedStyle(element, '::before').backgroundImage,
      blur: getComputedStyle(element, '::before').backdropFilter,
    }))
    expect(glass.background).toContain('gradient')
    expect(glass.blur).toContain('blur')
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  } else {
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.waitForTimeout(360)
    await expect(nav).toHaveClass(/is-gliding/)
    await page.mouse.move(endX, endY, { steps: 12 })
    await expect(page.getByRole('heading', { name: '看看最近的节奏' })).toBeVisible()
    await page.mouse.up()
  }

  await expect(page.getByRole('heading', { name: '看看最近的节奏' })).toBeVisible()
  expect(await page.evaluate(() => window.getSelection()?.toString() ?? '')).toBe('')
  await expect(nav).not.toHaveClass(/is-gliding/)
})

test('keeps the backfill note visible above the mobile keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: '补录' }).click()

  const dialog = page.getByRole('dialog')
  const initialDialogBox = await dialog.boundingBox()
  expect(initialDialogBox?.y).toBeLessThanOrEqual(32)

  await page.setViewportSize({ width: 390, height: 430 })
  const note = page.getByLabel('备注（可选）')
  await note.focus()
  await expect(note).toBeFocused()

  await expect.poll(async () => {
    const noteBox = await note.boundingBox()
    const contentBox = await page.locator('.modal-content').boundingBox()
    if (!noteBox || !contentBox) return false
    return noteBox.y >= contentBox.y && noteBox.y + noteBox.height <= contentBox.y + contentBox.height
  }).toBe(true)

  const compactDialogBox = await dialog.boundingBox()
  expect(compactDialogBox?.y).toBeLessThanOrEqual(16)
  expect((compactDialogBox?.y ?? 0) + (compactDialogBox?.height ?? 0)).toBeLessThanOrEqual(430)
})

test('confirms measurements and notes before saving records', async ({ page }, testInfo) => {
  const recentSection = page.locator('section[aria-labelledby="recent-title"]')
  const waterCard = page.getByRole('button', { name: '记录喝水', exact: true })
  const exerciseCard = page.getByRole('button', { name: '记录锻炼', exact: true })

  await expect(waterCard.getByText(/今日\s*0次/)).toBeVisible()
  await page.getByRole('button', { name: '记录喝水', exact: true }).click()
  await expect(page.getByRole('heading', { name: '记录喝水' })).toBeVisible()
  await expect(page.getByLabel('计量')).toHaveValue('250')
  await expect(page.getByLabel('计量')).not.toBeFocused()
  await expect(recentSection.getByText('喝水', { exact: true })).toHaveCount(0)
  await page.getByLabel('计量').fill('300')
  await page.getByLabel('备注（可选）').fill('早餐后喝的温水')
  await page.getByRole('button', { name: '确认记录' }).click()
  await expect(page.getByText('已记录 喝水 300 ml')).toBeVisible()
  await expect(waterCard.getByText(/今日\s*1次/)).toBeVisible()
  await expect(recentSection.getByText('喝水', { exact: true })).toBeVisible()
  await expect(recentSection.getByText('早餐后喝的温水')).toBeVisible()

  await expect(exerciseCard.getByText(/今日\s*0次/)).toBeVisible()
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
  await expect(exerciseCard.getByText(/今日\s*1次/)).toBeVisible()

  await page.getByRole('button', { name: '历史', exact: true }).click()
  await expect(page.getByRole('heading', { name: '历史记录' })).toBeVisible()
  await expect(page.locator('.history-groups').getByText('喝水', { exact: true })).toBeVisible()
  await expect(page.locator('.history-groups').getByText('锻炼', { exact: true })).toBeVisible()
  await expect(page.locator('.history-groups').getByText('早餐后喝的温水')).toBeVisible()
  await expect(page.locator('.history-groups').getByText('跑步 5 公里和拉伸')).toBeVisible()
  const historyNames = page.locator('.history-row strong')
  await expect(historyNames).toHaveText(['锻炼', '喝水'])
  await page.getByRole('button', { name: '当前晚到早，切换为早到晚' }).click()
  await expect(historyNames).toHaveText(['喝水', '锻炼'])
  await expect(page.getByRole('button', { name: '当前早到晚，切换为晚到早' })).toBeVisible()
  const historyRowHeight = await page.locator('.history-row').first().evaluate((row) => row.getBoundingClientRect().height)
  expect(historyRowHeight).toBeLessThanOrEqual(48)
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-history-notes.png`,
    fullPage: true,
  })
})

test('deletes an activity permanently while preserving its history', async ({ page }) => {
  await page.getByRole('button', { name: '记录咖啡', exact: true }).click()
  await page.getByLabel('备注（可选）').fill('上午美式')
  await page.getByRole('button', { name: '确认记录' }).click()
  await expect(page.getByText('已记录 咖啡 1 次')).toBeVisible()

  await page.getByRole('button', { name: '设置', exact: true }).click()
  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('已有 1 条历史记录会继续保留')
    expect(dialog.message()).toContain('此操作无法撤销')
    await dialog.accept()
  })
  await page.getByRole('button', { name: '删除咖啡', exact: true }).click()
  await expect(page.getByText('“咖啡”已删除，历史记录仍会保留')).toBeVisible()

  await page.getByRole('button', { name: '记录', exact: true }).click()
  await expect(page.getByRole('button', { name: '记录咖啡', exact: true })).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('heading', { name: '今天，记一下' })).toBeVisible()
  await expect(page.getByRole('button', { name: '记录咖啡', exact: true })).toHaveCount(0)

  await page.getByRole('button', { name: '历史', exact: true }).click()
  await page.locator('.history-row').filter({ hasText: '咖啡' }).click()
  const editor = page.getByRole('dialog')
  await expect(editor.getByRole('heading', { name: '编辑记录' })).toBeVisible()
  await expect(editor.getByLabel('行为')).toHaveValue('preset-coffee')
  await expect(editor.getByLabel('行为')).toContainText('咖啡（已删除）')
  await expect(editor.getByLabel('备注（可选）')).toHaveValue('上午美式')
})

test('prevents deleting an activity while its timer is running', async ({ page }) => {
  await page.getByRole('button', { name: '记录开车', exact: true }).click()
  await page.getByRole('button', { name: '开始计时' }).click()
  await expect(page.getByRole('status').getByText('开车开始计时')).toBeVisible()

  await page.getByRole('button', { name: '设置', exact: true }).click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: '删除开车', exact: true }).click()
  await expect(page.getByText('请先结束正在进行的计时')).toBeVisible()

  await page.getByRole('button', { name: '记录', exact: true }).click()
  await expect(page.getByRole('button', { name: '结束开车', exact: true })).toBeVisible()
})

test('reorders quick actions and keeps settings controls compact', async ({ page }, testInfo) => {
  const names = page.locator('.quick-card-copy strong')
  await expect(names).toHaveText([
    '喝水', '小便', '大便', '吃饭', '零食', '水果', '屈臣氏苏打汽水饮料', '咖啡', '锻炼', '开车',
  ])

  await expect(page.locator('.quick-card-drag')).toHaveCount(0)
  const sourceCard = page.getByRole('button', { name: '记录喝水', exact: true })
  await expect(sourceCard).toHaveCSS('user-select', 'none')
  const source = await sourceCard.boundingBox()
  const target = await page.getByRole('button', { name: '记录咖啡', exact: true }).boundingBox()
  if (!source || !target) throw new Error('没有找到行为卡片')

  const startX = source.x + source.width / 2
  const startY = source.y + source.height / 2
  const endX = target.x + target.width / 2
  const endY = target.y + target.height / 2

  if (testInfo.project.name === 'iphone-viewport') {
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: startX, y: startY, id: 1 }],
    })
    await page.waitForTimeout(400)
    for (let step = 1; step <= 16; step += 1) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{
          x: startX + (endX - startX) * step / 16,
          y: startY + (endY - startY) * step / 16,
          id: 1,
        }],
      })
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  } else {
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(endX, endY, { steps: 20 })
    await page.mouse.up()
  }

  await expect(page.getByRole('heading', { name: '记录喝水' })).toHaveCount(0)
  expect(await page.evaluate(() => window.getSelection()?.toString() ?? '')).toBe('')
  await expect(names).toHaveText([
    '小便', '大便', '吃饭', '零食', '水果', '屈臣氏苏打汽水饮料', '咖啡', '喝水', '锻炼', '开车',
  ])
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: '记录喝水', exact: true }).click()
  await expect(page.getByRole('heading', { name: '记录喝水' })).toBeVisible()
  await page.getByRole('button', { name: '关闭' }).click()

  await page.reload()
  await expect(page.getByRole('heading', { name: '今天，记一下' })).toBeVisible()
  await expect(page.locator('.quick-card-copy strong')).toHaveText([
    '小便', '大便', '吃饭', '零食', '水果', '屈臣氏苏打汽水饮料', '咖啡', '喝水', '锻炼', '开车',
  ])

  await page.getByRole('button', { name: '设置', exact: true }).click()
  await expect(page.getByRole('button', { name: /上移|下移/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '编辑喝水', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '删除喝水', exact: true })).toBeVisible()
  const settingRowHeights = await page.locator('.activity-setting-row').evaluateAll((rows) =>
    rows.map((row) => row.getBoundingClientRect().height),
  )
  expect(Math.max(...settingRowHeights)).toBeLessThanOrEqual(52)
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-compact-settings.png`,
    fullPage: true,
  })
})

test('shows all presets, adds a custom action and renders statistics', async ({ page }, testInfo) => {
  await expect(page.getByRole('button', { name: '记录小便', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '记录大便', exact: true })).toBeVisible()
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
  await expect(page.getByLabel('图标')).toContainText('散步')
  await page.getByLabel('名称').fill('阅读')
  await page.getByLabel('图标').selectOption('walk')
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
