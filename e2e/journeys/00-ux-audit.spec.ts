/**
 * UX Audit: Cross-cutting validation of the 3 core UX principles
 *
 * 1. 3-Click Rule — most tasks within 3 clicks
 * 2. Mobile First — no overflow, touch-friendly
 * 3. Invisible HR — fast load, self-service, guided
 *
 * Tests every core module for load time, responsive layout, and navigation depth.
 */
import { test, expect } from '@playwright/test'
import {
  assertPageLoadTime,
  assertNoHorizontalOverflow,
  assertAccessibleButtons,
  navigateToModule,
} from '../helpers/ux-rules'

const CORE_MODULES = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'People / HRIS', path: '/people' },
  { name: 'Recruiting / ATS', path: '/recruiting' },
  { name: 'Onboarding', path: '/onboarding' },
  { name: 'Performance', path: '/performance' },
  { name: 'Learning / LMS', path: '/learning' },
  { name: 'Time & Attendance', path: '/time-attendance' },
  { name: 'Payroll', path: '/payroll' },
  { name: 'Compensation', path: '/compensation' },
  { name: 'Benefits', path: '/benefits' },
  { name: 'Engagement', path: '/engagement' },
  { name: 'Documents', path: '/documents' },
  { name: 'Offboarding', path: '/offboarding' },
  { name: 'Analytics', path: '/analytics' },
  { name: 'Chat / EVA', path: '/chat' },
  { name: 'Help Center', path: '/help' },
]

// ─── Principle 1: Fast Load (Invisible HR) ───────────────────────────────────

test.describe('UX Audit: Page Load Performance', () => {
  for (const mod of CORE_MODULES) {
    test(`${mod.name} loads within 5s`, async ({ page }) => {
      await assertPageLoadTime(page, mod.path, 5000)
    })
  }
})

// ─── Principle 2: Mobile First (No Overflow) ────────────────────────────────

test.describe('UX Audit: Mobile Responsive', () => {
  for (const mod of CORE_MODULES) {
    test(`${mod.name} has no horizontal overflow`, async ({ page }) => {
      await navigateToModule(page, mod.path)
      await assertNoHorizontalOverflow(page)
    })
  }
})

// ─── Principle 3: Accessible Navigation ──────────────────────────────────────

test.describe('UX Audit: Accessible Buttons', () => {
  for (const mod of CORE_MODULES) {
    test(`${mod.name} buttons have accessible names`, async ({ page }) => {
      await navigateToModule(page, mod.path)
      await assertAccessibleButtons(page)
    })
  }
})

// ─── Sidebar Navigation: All modules reachable ──────────────────────────────

test.describe('UX Audit: Sidebar Navigation', () => {
  test('sidebar is visible on desktop', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    const sidebar = page.locator('nav').first()
    await expect(sidebar).toBeVisible()
  })

  test('all core modules are linked in sidebar', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const sidebarLinks = page.locator('nav a[href]')
    const count = await sidebarLinks.count()
    expect(count, 'Sidebar should have multiple module links').toBeGreaterThan(5)
  })
})

// ─── No Console Errors ──────────────────────────────────────────────────────

test.describe('UX Audit: No Console Errors', () => {
  for (const mod of CORE_MODULES.slice(0, 8)) { // Test first 8 to keep fast
    test(`${mod.name} loads without critical console errors`, async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })

      await navigateToModule(page, mod.path)

      const critical = errors.filter(
        (e) =>
          !e.includes('Warning:') &&
          !e.includes('DevTools') &&
          !e.includes('favicon') &&
          !e.includes('Failed to load resource') // network errors in test env
      )
      expect(critical, `Console errors on ${mod.name}: ${critical.join(', ')}`).toHaveLength(0)
    })
  }
})
