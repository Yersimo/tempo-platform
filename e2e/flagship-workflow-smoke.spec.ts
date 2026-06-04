import { expect, test, type Page } from '@playwright/test'
import { loginByApi } from './helpers/auth'
import { assertUsableRoute, capturePageProblems, gotoRoute } from './helpers/route-sweep'

type FlagshipWorkflow = {
  route: string
  engine: RegExp
  action: RegExp
  expectedAfterAction: RegExp
}

const flagshipWorkflows: FlagshipWorkflow[] = [
  {
    route: '/expense',
    engine: /live approval-route engine/i,
    action: /review approvals|inspect pending reports/i,
    expectedAfterAction: /approver cockpit|expense work that still needs a human decision|pending reports/i,
  },
  {
    route: '/learning',
    engine: /live skills graph engine/i,
    action: /^continue$/i,
    expectedAfterAction: /skills|catalog|learner home|learning mission control/i,
  },
  {
    route: '/onboarding',
    engine: /live lifecycle planner/i,
    action: /open related workspace/i,
    expectedAfterAction: /lifecycle control room|onboarding tasks|buddy|training/i,
  },
  {
    route: '/performance',
    engine: /live manager mission engine/i,
    action: /open related workspace/i,
    expectedAfterAction: /redwood manager decision cockpit|calibration|one-on-ones|career paths/i,
  },
]

test.describe('flagship workflow smoke', () => {
  test('keeps flagship live engines and safe actions usable across modules', async ({ page }) => {
    test.setTimeout(90_000)

    const problems = capturePageProblems(page)

    await loginByApi(page)

    for (const workflow of flagshipWorkflows) {
      await gotoRoute(page, workflow.route)
      await assertUsableRoute(page, workflow.route, { authenticated: true })

      await expect(page.getByText(workflow.engine).first()).toBeVisible()

      await clickFirstVisibleButton(page, workflow.action)
      await expect(page.locator('body')).toContainText(workflow.expectedAfterAction)
      await assertUsableRoute(page, workflow.route, { authenticated: true })

      expect(problems, problems.join('\n')).toEqual([])
    }
  })
})

async function clickFirstVisibleButton(page: Page, name: RegExp) {
  const buttons = page.getByRole('button', { name })
  const count = await buttons.count()
  expect(count, `Expected a button matching ${name}`).toBeGreaterThan(0)

  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index)
    if (await button.isVisible()) {
      await button.click()
      return
    }
  }

  throw new Error(`No visible button matching ${name}`)
}
