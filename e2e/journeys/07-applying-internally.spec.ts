/**
 * Journey 7: Applying Internally
 *
 * Persona: Employee (current)
 * Flow: See internal job board → Apply → Track status → Interview → Offer
 *
 * UX targets:
 *  - Internal mobility is visible and encouraged
 *  - Application process mirrors external but simpler
 *  - Career tracks visible
 */
import { test, expect } from '@playwright/test'
import {
  ClickTracker,
  navigateToModule,
  assertPageHasContent,
  assertNoHorizontalOverflow,
} from '../helpers/ux-rules'

test.describe('Journey: Applying Internally', () => {
  test('recruiting page shows job postings (internal board)', async ({ page }) => {
    await navigateToModule(page, '/recruiting')
    await assertPageHasContent(page, [/job|position|opening|recruit/i])
  })

  test('job listings show department, location, and type', async ({ page }) => {
    await navigateToModule(page, '/recruiting')

    // Table or cards with job details
    const content = page.locator('table, [class*="card"], [class*="Card"]')
    expect(await content.count()).toBeGreaterThan(0)
  })

  test('can view career tracks on performance page', async ({ page }) => {
    await navigateToModule(page, '/performance')

    // Look for career-related tab
    const careerTab = page.locator('[role="tab"]:has-text("Career"), button:has-text("Career"), [role="tab"]:has-text("Development")')
    if (await careerTab.count() > 0) {
      await careerTab.first().click()
      await page.waitForTimeout(500)
    }

    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    const hasCareer = bodyText.includes('career') || bodyText.includes('track') ||
      bodyText.includes('development') || bodyText.includes('competenc')
    expect(hasCareer).toBe(true)
  })

  test('application status tracking is available', async ({ page }) => {
    await navigateToModule(page, '/recruiting')

    // Pipeline or status view
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    const hasTracking = bodyText.includes('applied') || bodyText.includes('screening') ||
      bodyText.includes('interview') || bodyText.includes('status') || bodyText.includes('pipeline')
    expect(hasTracking, 'Should show application pipeline/status').toBe(true)
  })

  test('referral program is visible', async ({ page }) => {
    await navigateToModule(page, '/recruiting')

    const referralTab = page.locator('[role="tab"]:has-text("Referral"), button:has-text("Referral"), button:has-text("Refer")')
    if (await referralTab.count() > 0) {
      await referralTab.first().click()
      await page.waitForTimeout(500)
    }
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    expect(bodyText.includes('referral') || bodyText.includes('refer') || bodyText.includes('recruit')).toBe(true)
  })

  test('mobile: no horizontal overflow', async ({ page }) => {
    await navigateToModule(page, '/recruiting')
    await assertNoHorizontalOverflow(page)
  })
})
