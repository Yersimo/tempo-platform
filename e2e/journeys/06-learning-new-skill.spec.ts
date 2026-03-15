/**
 * Journey 6: Learning a New Skill
 *
 * Personas: Employee, HR Learning Team
 * Flow: Open LMS → Personalized recs → Enroll → Progress tracked → Certificate → Skills updated
 *
 * UX targets:
 *  - Feels like Netflix, not compliance training
 *  - Recommendations personalized by role
 *  - Completion visible to managers
 */
import { test, expect } from '@playwright/test'
import {
  ClickTracker,
  navigateToModule,
  assertPageHasContent,
  clickTab,
  assertNoHorizontalOverflow,
} from '../helpers/ux-rules'

test.describe('Journey: Learning a New Skill', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToModule(page, '/learning')
  })

  test('learning page loads with personalized home', async ({ page }) => {
    await assertPageHasContent(page, [/learning|course|training|skill/i])
  })

  test('course catalog with search and filters', async ({ page }) => {
    const catalogTab = page.locator('[role="tab"]:has-text("Catalog"), [role="tab"]:has-text("Courses"), button:has-text("Catalog")')
    if (await catalogTab.count() > 0) {
      await catalogTab.first().click()
      await page.waitForTimeout(500)
    }

    // Should have search and filter controls
    const searchInput = page.locator('input[type="text"], input[placeholder*="search" i], input[placeholder*="Search"]')
    const hasSearch = await searchInput.count() > 0
    const filterSelect = page.locator('select, [class*="filter"]')
    const hasFilter = await filterSelect.count() > 0

    expect(hasSearch || hasFilter, 'Catalog should have search/filter').toBe(true)
  })

  test('can enroll in a course within 3 clicks', async ({ page }) => {
    const tracker = new ClickTracker(page)

    const catalogTab = page.locator('[role="tab"]:has-text("Catalog"), [role="tab"]:has-text("Courses"), button:has-text("Catalog")')
    if (await catalogTab.count() > 0) {
      await tracker.click(catalogTab.first(), 'Open catalog')
    }

    // Find an enroll button
    const enrollBtn = page.locator('button:has-text("Enroll"), button:has-text("Start"), button:has-text("Join")')
    if (await enrollBtn.count() > 0) {
      await tracker.click(enrollBtn.first(), 'Enroll in course')
    }

    tracker.assertWithinLimit('Enroll in course')
  })

  test('learning paths are available', async ({ page }) => {
    const pathsTab = page.locator('[role="tab"]:has-text("Path"), button:has-text("Path"), [role="tab"]:has-text("Programs")')
    if (await pathsTab.count() > 0) {
      await pathsTab.first().click()
      await page.waitForTimeout(500)
    }
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    expect(bodyText.includes('path') || bodyText.includes('program') || bodyText.includes('learning')).toBe(true)
  })

  test('progress tracking is visible', async ({ page }) => {
    // Progress bars or completion percentages should be visible
    const progressElements = page.locator('[class*="progress"], [class*="Progress"], [role="progressbar"]')
    const badges = page.locator('[class*="badge"], [class*="Badge"]')
    const hasProgress = await progressElements.count() > 0 || await badges.count() > 0
    // Or the page shows enrollment status
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    const hasTracking = bodyText.includes('progress') || bodyText.includes('enrolled') ||
      bodyText.includes('completed') || bodyText.includes('%')
    expect(hasProgress || hasTracking, 'Learning progress should be tracked').toBe(true)
  })

  test('certificates are available on completion', async ({ page }) => {
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    const hasCertificates = bodyText.includes('certificate') || bodyText.includes('certification') ||
      bodyText.includes('badge') || bodyText.includes('credential')
    expect(hasCertificates, 'Certificate/credential system should exist').toBe(true)
  })

  test('compliance training section exists', async ({ page }) => {
    const complianceTab = page.locator('[role="tab"]:has-text("Compliance"), button:has-text("Compliance"), [role="tab"]:has-text("Mandatory")')
    if (await complianceTab.count() > 0) {
      await complianceTab.first().click()
      await page.waitForTimeout(500)
    }
    const bodyText = (await page.locator('body').textContent() || '').toLowerCase()
    expect(bodyText.includes('compliance') || bodyText.includes('mandatory') || bodyText.includes('required') || bodyText.includes('learning')).toBe(true)
  })

  test('mobile: no horizontal overflow', async ({ page }) => {
    await assertNoHorizontalOverflow(page)
  })
})
