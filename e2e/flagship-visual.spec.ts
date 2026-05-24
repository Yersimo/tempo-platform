import { expect, test } from '@playwright/test'
import { loginByApi } from './helpers/auth'
import { assertNoHorizontalOverflow } from './helpers/ux-rules'
import { capturePageProblems, gotoRoute } from './helpers/route-sweep'

const flagshipRoutes = [
  '/dashboard',
  '/people',
  '/payroll',
  '/learning',
  '/expense',
  '/it-cloud',
  '/recruiting',
  '/performance',
  '/analytics',
  '/settings',
]

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
]

for (const viewport of viewports) {
  test.describe(`flagship visual QA - ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const route of flagshipRoutes) {
      test(`${route} is stable, responsive, and screenshot-ready`, async ({ page }, testInfo) => {
        const problems = capturePageProblems(page)

        await loginByApi(page)
        await gotoRoute(page, route)

        await expect(page.locator('body')).not.toContainText(/Application error|Unhandled Runtime Error|Internal Server Error/i)
        await expect(page.locator('main, [data-app-shell], body').first()).toBeVisible()
        await assertNoHorizontalOverflow(page)

        await page.screenshot({
          path: testInfo.outputPath(`${viewport.name}-${route.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'home'}.png`),
          fullPage: false,
          caret: 'initial',
        })

        expect(problems, problems.join('\n')).toEqual([])
      })
    }
  })
}
