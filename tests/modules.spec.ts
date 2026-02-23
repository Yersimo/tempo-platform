import { test, expect } from '@playwright/test'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.waitForSelector('input[type="email"]', { timeout: 10000 })
  await page.locator('input[type="email"]').fill('amara.kone@ecobank.com')
  await page.locator('input[type="password"]').fill('demo1234')
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/dashboard/, { timeout: 15000 })
}

test.describe('Core Modules', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('Performance page loads with goals', async ({ page }) => {
    await page.goto('/performance')
    await expect(page.locator('text=ACTIVE GOALS')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Goals')).toBeVisible()
    await expect(page.locator('text=Reviews')).toBeVisible()
    await expect(page.locator('text=Calibration')).toBeVisible()
    await expect(page.locator('text=Feedback')).toBeVisible()
  })

  test('Compensation page loads', async ({ page }) => {
    await page.goto('/compensation')
    await expect(page.locator('h1:has-text("Compensation")')).toBeVisible({ timeout: 10000 })
  })

  test('Learning page loads', async ({ page }) => {
    await page.goto('/learning')
    await expect(page.locator('h1:has-text("Learning")')).toBeVisible({ timeout: 10000 })
  })

  test('Analytics page loads with board narrative', async ({ page }) => {
    await page.goto('/analytics')
    await expect(page.locator('text=Board-Ready Narrative')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=HEADCOUNT')).toBeVisible()
  })

  test('People page loads', async ({ page }) => {
    await page.goto('/people')
    await expect(page.locator('h1:has-text("People")')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Phase 3 Modules', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('Projects page loads with tabs', async ({ page }) => {
    await page.goto('/projects')
    await expect(page.locator('h1:has-text("Projects")')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=TOTAL PROJECTS')).toBeVisible()
    // Check tabs
    await expect(page.locator('text=Projects').first()).toBeVisible()
    await expect(page.locator('text=Kanban')).toBeVisible()
    await expect(page.locator('text=Timeline')).toBeVisible()
    await expect(page.locator('text=My Tasks')).toBeVisible()
  })

  test('Projects Kanban tab shows columns', async ({ page }) => {
    await page.goto('/projects')
    await page.locator('text=Kanban').click()
    await expect(page.locator('text=TO DO')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=IN PROGRESS')).toBeVisible()
    await expect(page.locator('text=REVIEW')).toBeVisible()
    await expect(page.locator('text=DONE')).toBeVisible()
  })

  test('Strategy page loads with OKRs', async ({ page }) => {
    await page.goto('/strategy')
    await expect(page.locator('h1:has-text("Strategy Execution")')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=STRATEGIC OBJECTIVES')).toBeVisible()
    // Check tabs
    await expect(page.locator('text=Strategy Map')).toBeVisible()
    await expect(page.locator('text=OKRs')).toBeVisible()
    await expect(page.locator('text=Initiatives')).toBeVisible()
    await expect(page.locator('text=KPI Dashboard')).toBeVisible()
  })

  test('Workflow Studio page loads', async ({ page }) => {
    await page.goto('/workflow-studio')
    await expect(page.locator('h1:has-text("Workflow Studio")')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=TOTAL WORKFLOWS')).toBeVisible()
    // Check tabs
    await expect(page.locator('text=Workflows').first()).toBeVisible()
    await expect(page.locator('text=Builder')).toBeVisible()
    await expect(page.locator('text=Run History')).toBeVisible()
    await expect(page.locator('text=Templates')).toBeVisible()
  })
})
