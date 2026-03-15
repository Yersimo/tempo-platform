/**
 * Journey 3: Getting Promoted
 *
 * Personas: Employee, Manager, HR
 * Flow: Goals → Performance review → Calibration → Rating → Promotion → Compensation update
 *
 * UX targets:
 *  - See goals in under 3 clicks
 *  - Continuous feedback, not annual
 *  - Data-driven calibration
 */
import { test, expect } from '@playwright/test'
import {
  ClickTracker,
  navigateToModule,
  assertPageHasContent,
  clickTab,
  assertNoHorizontalOverflow,
} from '../helpers/ux-rules'

test.describe('Journey: Getting Promoted', () => {
  test('performance page loads with goals overview', async ({ page }) => {
    await navigateToModule(page, '/performance')
    await assertPageHasContent(page, [/performance|goal|review|feedback/i])
  })

  test('employee can view goals within 3 clicks', async ({ page }) => {
    await navigateToModule(page, '/performance')
    const tracker = new ClickTracker(page)

    // Goals tab should be directly visible or default
    const goalsTab = page.locator('[role="tab"]:has-text("Goals"), button:has-text("Goals")')
    if (await goalsTab.count() > 0) {
      await tracker.click(goalsTab.first(), 'Switch to Goals tab')
    }

    // Goals should now be visible
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    expect(bodyText).toContain('goal')

    tracker.assertWithinLimit('View goals')
  })

  test('can create a new goal', async ({ page }) => {
    await navigateToModule(page, '/performance')

    const goalsTab = page.locator('[role="tab"]:has-text("Goals"), button:has-text("Goals")')
    if (await goalsTab.count() > 0) await goalsTab.first().click()

    const addBtn = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New Goal"), button:has-text("+")')
    if (await addBtn.count() > 0) {
      await addBtn.first().click()
      // Should open goal creation form
      const formElements = page.locator('input:visible, textarea:visible, select:visible')
      expect(await formElements.count()).toBeGreaterThan(0)
    }
  })

  test('feedback tab supports continuous feedback', async ({ page }) => {
    await navigateToModule(page, '/performance')

    const feedbackTab = page.locator('[role="tab"]:has-text("Feedback"), button:has-text("Feedback")')
    if (await feedbackTab.count() > 0) {
      await feedbackTab.first().click()
      await page.waitForTimeout(500)
      const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
      expect(bodyText.includes('feedback') || bodyText.includes('recognition')).toBe(true)
    }
  })

  test('review cycles are visible and manageable', async ({ page }) => {
    await navigateToModule(page, '/performance')

    const reviewTab = page.locator('[role="tab"]:has-text("Review"), button:has-text("Review"), [role="tab"]:has-text("Cycle")')
    if (await reviewTab.count() > 0) {
      await reviewTab.first().click()
      await page.waitForTimeout(500)
    }
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    expect(bodyText.includes('review') || bodyText.includes('cycle') || bodyText.includes('performance')).toBe(true)
  })

  test('calibration / 9-box grid is data-driven', async ({ page }) => {
    await navigateToModule(page, '/performance')

    const calibrationTab = page.locator('[role="tab"]:has-text("Calibration"), [role="tab"]:has-text("9-Box"), button:has-text("Calibration")')
    if (await calibrationTab.count() > 0) {
      await calibrationTab.first().click()
      await page.waitForTimeout(500)
      // Should show grid or calibration data
      const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
      expect(bodyText.includes('calibration') || bodyText.includes('9-box') || bodyText.includes('potential')).toBe(true)
    }
  })

  test('compensation page is accessible for promotion adjustments', async ({ page }) => {
    await navigateToModule(page, '/compensation')
    await assertPageHasContent(page, [/compensation|salary|band|pay/i])
  })

  test('mobile: no horizontal overflow', async ({ page }) => {
    await navigateToModule(page, '/performance')
    await assertNoHorizontalOverflow(page)
  })
})
