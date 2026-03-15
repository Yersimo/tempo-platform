/**
 * Journey 1: Joining the Company
 *
 * Persona: New employee (Sarah) + HR Admin
 * Flow: Offer → Contract → Pre-boarding → Documents → Day-1 checklist → Welcome
 *
 * UX targets:
 *  - Complete onboarding in < 20 minutes (simulated)
 *  - Documents uploaded once only
 *  - Step-by-step guided experience
 */
import { test, expect } from '@playwright/test'
import {
  ClickTracker,
  navigateToModule,
  assertPageHasContent,
  clickButton,
  clickTab,
  assertModalOpen,
  assertNoHorizontalOverflow,
  measureTask,
} from '../helpers/ux-rules'

test.describe('Journey: Joining the Company', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToModule(page, '/onboarding')
  })

  test('onboarding page loads with dashboard stats', async ({ page }) => {
    await assertPageHasContent(page, [
      /onboarding|welcome|new hire/i,
    ])
    // Should display stat cards (active onboardings, completion rate, etc.)
    const stats = page.locator('[class*="stat"], [class*="Stat"], [class*="card"]')
    expect(await stats.count()).toBeGreaterThan(0)
  })

  test('can view onboarding pipeline/checklist', async ({ page }) => {
    // Look for pipeline view, kanban, or list of new hires
    const pipeline = page.locator('table, [class*="kanban"], [class*="pipeline"], [class*="card"]')
    expect(await pipeline.count()).toBeGreaterThan(0)
  })

  test('can start a new onboarding within 3 clicks', async ({ page }) => {
    const tracker = new ClickTracker(page)

    // Click 1: "Add" or "New" button
    const addBtn = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Start"), button:has-text("Onboard")')
    if (await addBtn.count() > 0) {
      await tracker.click(addBtn.first(), 'Open new onboarding')
      // Should see form/modal
      const formVisible = await page.locator('input, select, [role="dialog"]').first().isVisible().catch(() => false)
      expect(formVisible).toBe(true)
    }

    tracker.assertWithinLimit('Start new onboarding')
  })

  test('setup wizard provides step-by-step guidance', async ({ page }) => {
    // The onboarding page has a setup wizard with clear steps
    const steps = page.locator('[class*="step"], [class*="wizard"], [class*="progress"]')
    const hasSteps = await steps.count() > 0
    // Or it shows tabs for different phases
    const tabs = page.locator('[role="tab"], button[class*="tab"]')
    const hasTabs = await tabs.count() > 0

    expect(hasSteps || hasTabs, 'Onboarding should have step-by-step navigation').toBe(true)
  })

  test('employee import/bulk upload is available', async ({ page }) => {
    // Should be able to import employees via CSV
    const importBtn = page.locator('button:has-text("Import"), button:has-text("Upload"), button:has-text("CSV"), button:has-text("Bulk")')
    expect(await importBtn.count(), 'Should have import/upload capability').toBeGreaterThan(0)
  })

  test('onboarding checklist items are trackable', async ({ page }) => {
    // Navigate to a checklist/task view if available
    const checklistTab = page.locator('[role="tab"]:has-text("Checklist"), [role="tab"]:has-text("Tasks"), button:has-text("Checklist")')
    if (await checklistTab.count() > 0) {
      await checklistTab.first().click()
      // Should show checklist items with checkboxes or status indicators
      const items = page.locator('input[type="checkbox"], [class*="check"], [class*="Check"]')
      expect(await items.count()).toBeGreaterThan(0)
    }
  })

  test('mobile: no horizontal overflow on onboarding page', async ({ page }) => {
    await assertNoHorizontalOverflow(page)
  })
})
