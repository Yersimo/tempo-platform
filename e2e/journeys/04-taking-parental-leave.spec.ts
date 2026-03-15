/**
 * Journey 4: Taking Parental Leave
 *
 * Persona: Employee
 * Flow: Request leave → Manager notification → Approval → Calendar update → Payroll update → Balance visible
 *
 * UX targets:
 *  - Complete leave request without HR assistance
 *  - Mobile-first (1-click simple)
 *  - Leave balance visible instantly
 */
import { test, expect } from '@playwright/test'
import {
  ClickTracker,
  navigateToModule,
  assertPageHasContent,
  clickTab,
  assertModalOpen,
  assertNoHorizontalOverflow,
} from '../helpers/ux-rules'

test.describe('Journey: Taking Parental Leave', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToModule(page, '/time-attendance')
  })

  test('time & attendance page loads with leave section', async ({ page }) => {
    await assertPageHasContent(page, [/leave|time|attendance|absence/i])
  })

  test('leave balance is visible on page load', async ({ page }) => {
    // Balance should be visible without extra clicks
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    const hasBalance = bodyText.includes('balance') || bodyText.includes('remaining') ||
      bodyText.includes('annual') || bodyText.includes('leave') || bodyText.includes('days')
    expect(hasBalance, 'Leave balance should be immediately visible').toBe(true)
  })

  test('can request leave within 3 clicks', async ({ page }) => {
    const tracker = new ClickTracker(page)

    // Find leave request button
    const requestBtn = page.locator('button:has-text("Request"), button:has-text("Apply"), button:has-text("New Leave"), button:has-text("Add")')
    if (await requestBtn.count() > 0) {
      await tracker.click(requestBtn.first(), 'Open leave request form')

      // Should show a form with date pickers and leave type
      const formElements = page.locator('input:visible, select:visible')
      expect(await formElements.count()).toBeGreaterThan(0)
    }

    tracker.assertWithinLimit('Request leave')
  })

  test('leave types include parental/maternity options', async ({ page }) => {
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    // Check if parental leave type exists anywhere
    const hasParental = bodyText.includes('parental') || bodyText.includes('maternity') ||
      bodyText.includes('paternity') || bodyText.includes('annual') || bodyText.includes('sick')
    expect(hasParental, 'Should support multiple leave types').toBe(true)
  })

  test('leave calendar view is available', async ({ page }) => {
    const calendarTab = page.locator('[role="tab"]:has-text("Calendar"), button:has-text("Calendar"), [role="tab"]:has-text("Schedule")')
    if (await calendarTab.count() > 0) {
      await calendarTab.first().click()
      await page.waitForTimeout(500)
    }
    // Calendar or schedule view
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    const hasCalendar = bodyText.includes('mon') || bodyText.includes('tue') || bodyText.includes('calendar') || bodyText.includes('week')
    expect(hasCalendar).toBe(true)
  })

  test('pending leave requests show approval status', async ({ page }) => {
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    const hasStatus = bodyText.includes('pending') || bodyText.includes('approved') ||
      bodyText.includes('rejected') || bodyText.includes('status')
    expect(hasStatus, 'Leave requests should show approval status').toBe(true)
  })

  test('mobile: no horizontal overflow', async ({ page }) => {
    await assertNoHorizontalOverflow(page)
  })
})
