/**
 * UX validation helpers for Tempo HR platform
 *
 * Enforces three core UX principles:
 * 1. 3-Click Rule — employees complete most HR tasks within 3 clicks
 * 2. Mobile First — all flows work on phone viewports
 * 3. Invisible HR — fast, guided, self-service
 */
import { type Page, type Locator, expect } from '@playwright/test'

// ─── Click Tracker ───────────────────────────────────────────────────────────

export class ClickTracker {
  private clicks = 0

  constructor(private page: Page, private maxClicks = 3) {}

  async click(locator: Locator, description?: string) {
    await locator.click()
    this.clicks++
    if (description) {
      console.log(`  Click ${this.clicks}/${this.maxClicks}: ${description}`)
    }
  }

  assertWithinLimit(taskName: string) {
    expect(
      this.clicks,
      `"${taskName}" took ${this.clicks} clicks, exceeds ${this.maxClicks}-click rule`,
    ).toBeLessThanOrEqual(this.maxClicks)
  }

  get count() {
    return this.clicks
  }
}

// ─── Timing helpers ──────────────────────────────────────────────────────────

/** Assert a page loads within a time budget (ms) */
export async function assertPageLoadTime(page: Page, url: string, maxMs = 3000) {
  const start = Date.now()
  await page.goto(url)
  await page.waitForLoadState('domcontentloaded')
  const elapsed = Date.now() - start
  expect(elapsed, `Page ${url} took ${elapsed}ms, over ${maxMs}ms budget`).toBeLessThanOrEqual(maxMs)
}

/** Measure and return the time a task takes */
export async function measureTask(fn: () => Promise<void>): Promise<number> {
  const start = Date.now()
  await fn()
  return Date.now() - start
}

// ─── Responsive / Mobile helpers ─────────────────────────────────────────────

/** Check that a key element is visible at the current viewport */
export async function assertVisibleOnViewport(page: Page, selector: string) {
  const el = page.locator(selector).first()
  await expect(el).toBeVisible()
  const box = await el.boundingBox()
  expect(box, `Element ${selector} has no bounding box`).toBeTruthy()
  const viewport = page.viewportSize()
  if (viewport && box) {
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 2) // 2px tolerance
  }
}

/** Check that no horizontal scroll exists (mobile-first rule) */
export async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth
  })
  expect(overflow, 'Page has horizontal overflow — violates mobile-first rule').toBe(false)
}

// ─── Navigation helpers ──────────────────────────────────────────────────────

/** Navigate to a module via sidebar or direct URL, wait for content */
export async function navigateToModule(page: Page, path: string) {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
  // Wait for skeleton to disappear (pages use PageSkeleton)
  const skeleton = page.locator('[class*="skeleton"], [class*="Skeleton"], [data-testid="page-skeleton"]')
  if (await skeleton.count() > 0) {
    await skeleton.first().waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {})
  }
}

/** Find and click a button by text (case-insensitive) */
export async function clickButton(page: Page, text: string) {
  const btn = page.locator(`button:has-text("${text}")`).first()
  await expect(btn).toBeVisible({ timeout: 5000 })
  await btn.click()
}

/** Find and click a tab by text */
export async function clickTab(page: Page, text: string) {
  const tab = page.locator(`[role="tab"]:has-text("${text}"), button:has-text("${text}")`).first()
  await expect(tab).toBeVisible({ timeout: 5000 })
  await tab.click()
}

/** Check that page contains expected content patterns */
export async function assertPageHasContent(page: Page, patterns: RegExp[]) {
  for (const pattern of patterns) {
    await expect(page.locator('body')).toContainText(pattern, { timeout: 8000 })
  }
}

/** Fill an input field inside a modal or form */
export async function fillField(page: Page, labelOrPlaceholder: string, value: string) {
  const input = page.locator(
    `input[placeholder*="${labelOrPlaceholder}" i], ` +
    `textarea[placeholder*="${labelOrPlaceholder}" i], ` +
    `label:has-text("${labelOrPlaceholder}") + input, ` +
    `label:has-text("${labelOrPlaceholder}") + textarea`
  ).first()
  if (await input.count() > 0) {
    await input.fill(value)
  }
}

/** Check that a modal/dialog opened */
export async function assertModalOpen(page: Page) {
  const modal = page.locator('[role="dialog"], [class*="modal"], [class*="Modal"]').first()
  await expect(modal).toBeVisible({ timeout: 5000 })
}

/** Count interactive elements to measure task complexity */
export async function countStepsToComplete(page: Page): Promise<number> {
  return page.locator('input:visible, select:visible, textarea:visible, button[type="submit"]:visible').count()
}

// ─── Accessibility quick checks ──────────────────────────────────────────────

/** Check that interactive elements have accessible names */
export async function assertAccessibleButtons(page: Page) {
  const buttons = page.locator('button:visible')
  const count = await buttons.count()
  for (let i = 0; i < Math.min(count, 20); i++) {
    const btn = buttons.nth(i)
    const text = await btn.textContent()
    const ariaLabel = await btn.getAttribute('aria-label')
    const title = await btn.getAttribute('title')
    expect(
      (text?.trim() || ariaLabel || title),
      `Button at index ${i} has no accessible name`,
    ).toBeTruthy()
  }
}
