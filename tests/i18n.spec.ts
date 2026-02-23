import { test, expect } from '@playwright/test'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.waitForSelector('input[type="email"]', { timeout: 10000 })
  await page.locator('input[type="email"]').fill('amara.kone@ecobank.com')
  await page.locator('input[type="password"]').fill('demo1234')
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/dashboard/, { timeout: 15000 })
}

test.describe('Internationalization', () => {
  test('defaults to English', async ({ page }) => {
    await login(page)
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=HEADCOUNT')).toBeVisible()
  })

  test('can switch to French', async ({ page }) => {
    await login(page)
    // Set French locale cookie
    await page.context().addCookies([{
      name: 'tempo_locale',
      value: 'fr',
      url: 'http://localhost:3001',
    }])
    await page.reload()

    await expect(page.locator('text=Tableau de bord')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=EFFECTIF')).toBeVisible()
  })

  test('French projects page renders correctly', async ({ page }) => {
    await login(page)
    await page.context().addCookies([{
      name: 'tempo_locale',
      value: 'fr',
      url: 'http://localhost:3001',
    }])
    await page.goto('/projects')

    await expect(page.locator('h1:has-text("Projets")')).toBeVisible({ timeout: 10000 })
  })

  test('French strategy page renders correctly', async ({ page }) => {
    await login(page)
    await page.context().addCookies([{
      name: 'tempo_locale',
      value: 'fr',
      url: 'http://localhost:3001',
    }])
    await page.goto('/strategy')

    await expect(page.locator('text=Execution Strategique')).toBeVisible({ timeout: 10000 })
  })
})
