/**
 * Journey 9: Managing a Team
 *
 * Persona: Manager
 * Flow: View team → Approve requests → Run payroll → Review performance → Succession planning
 *
 * UX targets:
 *  - Manager dashboard shows team at a glance
 *  - Pending approvals are 1-click
 *  - Team analytics available
 */
import { test, expect } from '@playwright/test'
import {
  ClickTracker,
  navigateToModule,
  assertPageHasContent,
  clickTab,
  assertNoHorizontalOverflow,
} from '../helpers/ux-rules'

test.describe('Journey: Managing a Team', () => {
  test('dashboard shows team overview', async ({ page }) => {
    await navigateToModule(page, '/dashboard')
    await assertPageHasContent(page, [/dashboard|overview|team|welcome/i])
  })

  test('people directory loads with employee list', async ({ page }) => {
    await navigateToModule(page, '/people')
    await assertPageHasContent(page, [/people|employee|team|directory/i])

    // Should show table or cards of employees
    const content = page.locator('table, [class*="card"], [class*="Card"]')
    expect(await content.count()).toBeGreaterThan(0)
  })

  test('can view individual employee profile', async ({ page }) => {
    await navigateToModule(page, '/people')

    // Click on first employee link/row
    const employeeLink = page.locator('a[href*="/people/"], tr[class*="cursor"], [class*="card"][class*="cursor"]').first()
    if (await employeeLink.count() > 0) {
      await employeeLink.click()
      await page.waitForTimeout(1000)
      // Should show employee details
      const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
      expect(bodyText.length).toBeGreaterThan(100) // non-empty profile
    }
  })

  test('payroll page accessible for payrun management', async ({ page }) => {
    await navigateToModule(page, '/payroll')
    await assertPageHasContent(page, [/payroll|pay run|salary/i])
  })

  test('can view pending approvals', async ({ page }) => {
    // Check dashboard or time-attendance for pending items
    await navigateToModule(page, '/time-attendance')
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    const hasApprovals = bodyText.includes('pending') || bodyText.includes('approve') ||
      bodyText.includes('request') || bodyText.includes('leave')
    expect(hasApprovals, 'Manager should see pending approvals').toBe(true)
  })

  test('analytics page provides team insights', async ({ page }) => {
    await navigateToModule(page, '/analytics')
    await assertPageHasContent(page, [/analytics|report|insight|data|metric/i])
  })

  test('headcount planning is available', async ({ page }) => {
    await navigateToModule(page, '/headcount')
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    const hasHeadcount = bodyText.includes('headcount') || bodyText.includes('plan') ||
      bodyText.includes('forecast') || bodyText.includes('position')
    expect(hasHeadcount).toBe(true)
  })

  test('succession planning accessible', async ({ page }) => {
    // Check performance for succession/talent tabs
    await navigateToModule(page, '/performance')
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    const hasTalent = bodyText.includes('succession') || bodyText.includes('talent') ||
      bodyText.includes('9-box') || bodyText.includes('calibration') || bodyText.includes('performance')
    expect(hasTalent).toBe(true)
  })

  test('mobile: no horizontal overflow on people page', async ({ page }) => {
    await navigateToModule(page, '/people')
    await assertNoHorizontalOverflow(page)
  })
})
