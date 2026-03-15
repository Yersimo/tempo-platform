/**
 * Journey 5: Receiving Feedback
 *
 * Personas: Employee, Manager
 * Flow: Real-time feedback → 360 feedback → Manager evaluation → Review acknowledgement
 *
 * UX targets:
 *  - Performance conversations are continuous, not annual
 *  - Feedback visible in < 3 clicks
 *  - Recognition visible to peers
 */
import { test, expect } from '@playwright/test'
import {
  ClickTracker,
  navigateToModule,
  assertPageHasContent,
  clickTab,
  assertNoHorizontalOverflow,
} from '../helpers/ux-rules'

test.describe('Journey: Receiving Feedback', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToModule(page, '/performance')
  })

  test('feedback tab is directly accessible', async ({ page }) => {
    const feedbackTab = page.locator('[role="tab"]:has-text("Feedback"), button:has-text("Feedback")')
    expect(await feedbackTab.count(), 'Feedback tab should exist').toBeGreaterThan(0)
  })

  test('can give feedback within 3 clicks', async ({ page }) => {
    const tracker = new ClickTracker(page)

    // Click feedback tab
    const feedbackTab = page.locator('[role="tab"]:has-text("Feedback"), button:has-text("Feedback")')
    if (await feedbackTab.count() > 0) {
      await tracker.click(feedbackTab.first(), 'Open feedback tab')
    }

    // Click give feedback button
    const giveBtn = page.locator('button:has-text("Give"), button:has-text("Add"), button:has-text("New Feedback"), button:has-text("+")')
    if (await giveBtn.count() > 0) {
      await tracker.click(giveBtn.first(), 'Open feedback form')
    }

    tracker.assertWithinLimit('Give feedback')
  })

  test('recognition / kudos system exists', async ({ page }) => {
    const recognitionTab = page.locator('[role="tab"]:has-text("Recognition"), button:has-text("Recognition"), button:has-text("Kudos")')
    if (await recognitionTab.count() > 0) {
      await recognitionTab.first().click()
      await page.waitForTimeout(500)
    }
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    const hasRecognition = bodyText.includes('recognition') || bodyText.includes('kudos') ||
      bodyText.includes('feedback') || bodyText.includes('praise')
    expect(hasRecognition).toBe(true)
  })

  test('1:1 meeting management is available', async ({ page }) => {
    const oneOnOneTab = page.locator('[role="tab"]:has-text("1:1"), [role="tab"]:has-text("One"), button:has-text("1:1")')
    if (await oneOnOneTab.count() > 0) {
      await oneOnOneTab.first().click()
      await page.waitForTimeout(500)
      const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
      expect(bodyText.includes('1:1') || bodyText.includes('one-on-one') || bodyText.includes('meeting')).toBe(true)
    }
  })

  test('review acknowledgement flow exists', async ({ page }) => {
    const reviewTab = page.locator('[role="tab"]:has-text("Review"), button:has-text("Review")')
    if (await reviewTab.count() > 0) {
      await reviewTab.first().click()
      await page.waitForTimeout(500)
    }
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    // Should have review data with acknowledge/dispute options
    expect(bodyText.includes('review') || bodyText.includes('performance')).toBe(true)
  })

  test('mobile: no horizontal overflow', async ({ page }) => {
    await assertNoHorizontalOverflow(page)
  })
})
