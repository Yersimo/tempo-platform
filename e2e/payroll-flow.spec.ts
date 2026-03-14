import { test, expect } from '@playwright/test'

test.describe('Payroll Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/payroll')
    await page.waitForLoadState('networkidle')
  })

  test('payroll page loads with expected content', async ({ page }) => {
    // Verify the payroll page renders
    await expect(page.locator('body')).toContainText(/payroll|pay run|salary/i)
  })

  test('can initiate create pay run flow', async ({ page }) => {
    // Look for a "Create Pay Run" or similar button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New Pay Run"), button:has-text("Run Payroll")')
    if (await createButton.count() > 0) {
      await createButton.first().click()
      // Should show some form or modal
      await expect(page.locator('body')).toContainText(/period|month|frequency/i)
    }
  })

  test('displays employee list or pay run history', async ({ page }) => {
    // Payroll page should show some tabular data or cards
    const hasTable = await page.locator('table, [role="grid"]').count()
    const hasCards = await page.locator('[class*="card"], [class*="Card"]').count()
    expect(hasTable + hasCards).toBeGreaterThan(0)
  })
})
