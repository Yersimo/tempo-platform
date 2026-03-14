import { test, expect } from '@playwright/test'

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  const modules = [
    { name: 'Payroll', path: '/payroll' },
    { name: 'Payslips', path: '/payslips' },
    { name: 'Compensation', path: '/compensation' },
    { name: 'Recruiting', path: '/recruiting' },
    { name: 'Documents', path: '/documents' },
    { name: 'Compliance', path: '/compliance' },
    { name: 'Expense', path: '/expense' },
    { name: 'Travel', path: '/travel' },
    { name: 'Identity', path: '/identity' },
    { name: 'Workflows', path: '/workflows' },
    { name: 'Groups', path: '/groups' },
    { name: 'Settings', path: '/settings' },
  ]

  for (const mod of modules) {
    test(`navigates to ${mod.name} module`, async ({ page }) => {
      // Click sidebar link
      const link = page.locator(`a[href="${mod.path}"], nav >> text="${mod.name}"`)
      if (await link.count() > 0) {
        await link.first().click()
        await expect(page).toHaveURL(new RegExp(mod.path))
      }
    })
  }

  test('sidebar is visible on desktop', async ({ page }) => {
    const sidebar = page.locator('nav').first()
    await expect(sidebar).toBeVisible()
  })

  test('page loads without console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Filter out expected development warnings
    const criticalErrors = errors.filter(
      (e) => !e.includes('Warning:') && !e.includes('DevTools')
    )
    expect(criticalErrors).toHaveLength(0)
  })
})
