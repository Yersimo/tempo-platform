/**
 * Journey 10: Leaving the Company
 *
 * Personas: Employee (departing), Manager, HR
 * Flow: Resignation → Offboarding initiated → Knowledge transfer → IT access revoked →
 *       Exit interview → Final pay → COBRA/benefits → Documents archived
 *
 * UX targets:
 *  - Offboarding is automated and complete
 *  - No task falls through the cracks
 *  - Dignified, smooth exit experience
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

test.describe('Journey: Leaving the Company', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToModule(page, '/offboarding')
  })

  test('offboarding page loads with task categories', async ({ page }) => {
    await assertPageHasContent(page, [/offboarding|exit|departure|offboard/i])
  })

  test('offboarding has structured categories', async ({ page }) => {
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    // Should have key offboarding categories
    const categories = ['access', 'device', 'knowledge', 'interview', 'pay', 'benefit', 'document']
    const found = categories.filter(c => bodyText.includes(c))
    expect(found.length, 'Should cover multiple offboarding categories').toBeGreaterThanOrEqual(3)
  })

  test('can initiate offboarding within 3 clicks', async ({ page }) => {
    const tracker = new ClickTracker(page)

    const initiateBtn = page.locator('button:has-text("Start"), button:has-text("Initiate"), button:has-text("New"), button:has-text("Add")')
    if (await initiateBtn.count() > 0) {
      await tracker.click(initiateBtn.first(), 'Start offboarding')
      // Should open form/modal
      const formVisible = await page.locator('input, select, [role="dialog"]').first().isVisible().catch(() => false)
      expect(formVisible).toBe(true)
    }

    tracker.assertWithinLimit('Initiate offboarding')
  })

  test('task checklist tracks completion', async ({ page }) => {
    // Should show task items with progress indicators
    const tasks = page.locator('[class*="check"], [class*="task"], [class*="progress"], input[type="checkbox"]')
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    const hasTracking = await tasks.count() > 0 || bodyText.includes('pending') ||
      bodyText.includes('completed') || bodyText.includes('in progress')
    expect(hasTracking, 'Offboarding should track task completion').toBe(true)
  })

  test('exit interview section exists', async ({ page }) => {
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    const hasExit = bodyText.includes('exit') || bodyText.includes('interview') || bodyText.includes('feedback')
    expect(hasExit, 'Exit interview should be part of offboarding').toBe(true)
  })

  test('IT access revocation is tracked', async ({ page }) => {
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    const hasIT = bodyText.includes('access') || bodyText.includes('revoc') ||
      bodyText.includes('device') || bodyText.includes('it ')
    expect(hasIT, 'IT access revocation should be tracked').toBe(true)
  })

  test('final pay and benefits are covered', async ({ page }) => {
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    const hasPay = bodyText.includes('pay') || bodyText.includes('benefit') ||
      bodyText.includes('cobra') || bodyText.includes('final')
    expect(hasPay, 'Final pay and benefits should be part of offboarding').toBe(true)
  })

  test('offboarding reasons are tracked', async ({ page }) => {
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    const hasReasons = bodyText.includes('resignation') || bodyText.includes('termination') ||
      bodyText.includes('retirement') || bodyText.includes('layoff') || bodyText.includes('reason')
    expect(hasReasons, 'Offboarding should track departure reasons').toBe(true)
  })

  test('mobile: no horizontal overflow', async ({ page }) => {
    await assertNoHorizontalOverflow(page)
  })
})
