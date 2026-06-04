import { expect, test, type Page } from '@playwright/test'
import { loginByApi } from './helpers/auth'
import { assertUsableRoute, capturePageProblems, gotoRoute } from './helpers/route-sweep'

type FlagshipWorkflow = {
  route: string
  finalSurface: RegExp
  action: RegExp
  expectedAfterAction: RegExp
}

const flagshipWorkflows: FlagshipWorkflow[] = [
  {
    route: '/expense',
    finalSurface: /ramp-grade flow queue|live approval-route engine/i,
    action: /review approvals|inspect pending reports/i,
    expectedAfterAction: /approver cockpit|expense work that still needs a human decision|pending reports/i,
  },
  {
    route: '/learning',
    finalSurface: /learning mission control|live skills graph engine/i,
    action: /^continue$/i,
    expectedAfterAction: /skills|catalog|learner home|learning mission control/i,
  },
  {
    route: '/onboarding',
    finalSurface: /lifecycle control room/i,
    action: /review preboarding/i,
    expectedAfterAction: /lifecycle control room|onboarding tasks|buddy|training/i,
  },
  {
    route: '/performance',
    finalSurface: /redwood manager decision cockpit|connect performance gaps to learning paths/i,
    action: /review calibration|open career paths/i,
    expectedAfterAction: /redwood manager decision cockpit|calibration|one-on-ones|career paths/i,
  },
]

const hiddenExperimentCopy = /benchmark-led|target experience|next best moves|quality focus|trust layer|evidence to trust|experiment bench|review mode|feature-review mode|selected direction|compare .* directions/i

test.describe('flagship workflow smoke', () => {
  test('keeps flagship live engines and safe actions usable across modules', async ({ page }) => {
    test.setTimeout(90_000)

    const problems = capturePageProblems(page)

    await loginByApi(page)

    for (const workflow of flagshipWorkflows) {
      await gotoRoute(page, workflow.route)
      await assertUsableRoute(page, workflow.route, { authenticated: true })

      await expectFirstVisibleText(page, workflow.finalSurface)
      await expectNoVisibleText(page, hiddenExperimentCopy)

      await clickFirstVisibleButton(page, workflow.action)
      await expect(page.locator('body')).toContainText(workflow.expectedAfterAction)
      await assertUsableRoute(page, workflow.route, { authenticated: true })
      await expectNoVisibleText(page, hiddenExperimentCopy)

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

async function expectFirstVisibleText(page: Page, text: RegExp) {
  const deadline = Date.now() + 10_000

  while (Date.now() < deadline) {
    const matches = page.getByText(text)
    const count = await matches.count()

    for (let index = 0; index < count; index += 1) {
      const match = matches.nth(index)
      if (await match.isVisible()) {
        await expect(match).toBeVisible()
        return
      }
    }

    await page.waitForTimeout(250)
  }

  throw new Error(`No visible text matching ${text}`)
}

async function expectNoVisibleText(page: Page, text: RegExp) {
  const matches = page.getByText(text)
  const count = await matches.count()

  for (let index = 0; index < count; index += 1) {
    await expect(matches.nth(index), `Expected ${text} match #${index + 1} to stay hidden`).not.toBeVisible()
  }
}
