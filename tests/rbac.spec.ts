import { test, expect } from '@playwright/test'

async function loginAs(page: import('@playwright/test').Page, email: string) {
  await page.goto('/login')
  await page.waitForSelector('input[type="email"]', { timeout: 10000 })
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill('demo1234')
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/dashboard/, { timeout: 15000 })
}

test.describe('Role-Based Access', () => {
  test('owner sees all sidebar modules', async ({ page }) => {
    await loginAs(page, 'amara.kone@ecobank.com')
    // Owner should see everything
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=Performance').first()).toBeVisible()
    await expect(page.locator('text=Compensation')).toBeVisible()
    await expect(page.locator('text=Analytics')).toBeVisible()
  })

  test('all pages load without errors for owner', async ({ page }) => {
    await loginAs(page, 'amara.kone@ecobank.com')

    const pages = [
      '/dashboard', '/people', '/performance', '/compensation',
      '/learning', '/engagement', '/mentoring', '/analytics',
      '/projects', '/strategy', '/workflow-studio',
    ]

    for (const url of pages) {
      await page.goto(url)
      // Should not show error page
      await expect(page.locator('text=500')).not.toBeVisible({ timeout: 5000 })
      // Should have loaded (sidebar visible)
      await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 })
    }
  })
})
