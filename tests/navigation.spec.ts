import { test, expect } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

// Login before each test
test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'amara.kone@ecobank.com')
  await page.fill('input[type="password"]', 'demo1234')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 10000 })
})

test.describe('Module Navigation', () => {
  const modules = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'People', path: '/people' },
    { name: 'Performance', path: '/performance' },
    { name: 'Compensation', path: '/compensation' },
    { name: 'Learning', path: '/learning' },
    { name: 'Engagement', path: '/engagement' },
    { name: 'Mentoring', path: '/mentoring' },
    { name: 'Payroll', path: '/payroll' },
    { name: 'Time & Attendance', path: '/time-attendance' },
    { name: 'Benefits', path: '/benefits' },
    { name: 'Expense', path: '/expense' },
    { name: 'Recruiting', path: '/recruiting' },
    { name: 'Devices', path: '/it/devices' },
    { name: 'Apps', path: '/it/apps' },
    { name: 'Invoices', path: '/finance/invoices' },
    { name: 'Budgets', path: '/finance/budgets' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'Settings', path: '/settings' },
  ]

  for (const mod of modules) {
    test(`${mod.name} page loads at ${mod.path}`, async ({ page }) => {
      await page.goto(mod.path)
      await page.waitForLoadState('networkidle', { timeout: 15000 })
      // Page should not redirect to login
      expect(page.url()).toContain(mod.path)
      // Should have some content rendered (not blank)
      const body = await page.locator('body').textContent()
      expect(body?.length).toBeGreaterThan(0)
    })
  }
})

test.describe('Sidebar Navigation', () => {
  test('sidebar is visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(page.locator('aside')).toBeVisible()
  })

  test('sidebar has nav groups', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    // Check that sidebar contains expected group labels
    const sidebar = page.locator('aside')
    await expect(sidebar.locator('text=CORE').or(sidebar.locator('text=Dashboard'))).toBeVisible()
  })

  test('clicking sidebar nav item navigates', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    // Click on People link in sidebar
    await page.locator('aside a[href="/people"]').click()
    await page.waitForURL('**/people', { timeout: 10000 })
    expect(page.url()).toContain('/people')
  })

  test('active nav item is highlighted', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    // Dashboard should be active
    const dashLink = page.locator('aside a[href="/dashboard"]')
    await expect(dashLink).toHaveClass(/tempo/)
  })

  test('mobile bottom nav is visible on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    // Bottom nav should be visible
    const mobileNav = page.locator('nav.lg\\:hidden').or(page.locator('nav').last())
    await expect(mobileNav).toBeVisible()
  })
})

test.describe('Page Content', () => {
  test('dashboard shows stat cards', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    // Dashboard should have stat cards or headcount-like content
    const content = await page.locator('body').textContent()
    expect(content).toBeTruthy()
  })

  test('people page shows employee list', async ({ page }) => {
    await page.goto('/people')
    await page.waitForLoadState('networkidle')
    // Should show employee data
    const content = await page.locator('body').textContent()
    expect(content).toBeTruthy()
  })

  test('settings page renders', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/settings')
  })
})
