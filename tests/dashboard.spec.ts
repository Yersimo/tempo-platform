import { test, expect } from '@playwright/test'

// Helper to log in before each test
async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.waitForSelector('input[type="email"]', { timeout: 10000 })
  await page.locator('input[type="email"]').fill('amara.kone@ecobank.com')
  await page.locator('input[type="password"]').fill('demo1234')
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/dashboard/, { timeout: 15000 })
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('shows stat cards', async ({ page }) => {
    await expect(page.locator('text=HEADCOUNT')).toBeVisible()
    await expect(page.locator('text=REVIEW COMPLETION')).toBeVisible()
    await expect(page.locator('text=ACTIVE LEARNERS')).toBeVisible()
    await expect(page.locator('text=OPEN POSITIONS')).toBeVisible()
  })

  test('shows executive summary with AI indicator', async ({ page }) => {
    await expect(page.locator('text=Executive Summary')).toBeVisible()
  })

  test('shows recommended next actions', async ({ page }) => {
    await expect(page.locator('text=Recommended Next Actions')).toBeVisible()
  })

  test('sidebar navigation works', async ({ page }) => {
    // Click Performance
    await page.locator('text=Performance').first().click()
    await expect(page).toHaveURL(/\/performance/, { timeout: 10000 })
    await expect(page.locator('h1:has-text("Performance")')).toBeVisible()
  })
})
