import { expect, test, type BrowserContextOptions } from '@playwright/test'
import { loginByApi } from './helpers/auth'
import {
  assertUsableRoute,
  capturePageProblems,
  gotoRoute,
  screenshotRoute,
  sweepViewports,
} from './helpers/route-sweep'

const publicRoutes = [
  '/',
  '/pricing',
  '/why-tempo',
  '/solutions',
  '/academy',
  '/academy/diagnostic',
  '/academy/get-started',
  '/security',
  '/privacy',
  '/terms',
  '/cookies',
  '/gdpr',
  '/about',
  '/careers',
  '/contact',
  '/customer-journeys',
  '/newsroom',
  '/social-impact',
  '/trial',
  '/demo-request',
  '/login',
  '/signup',
  '/reset-password',
  '/products/hr',
  '/products/payroll',
  '/products/finance',
  '/products/ai',
  '/products/operations',
  '/products/it',
  '/products/platform',
]

const appRoutes = [
  '/dashboard',
  '/people',
  '/recruiting',
  '/performance',
  '/compensation',
  '/learning',
  '/engagement',
  '/mentoring',
  '/payroll',
  '/time-attendance',
  '/benefits',
  '/expense',
  '/expenses',
  '/it-cloud',
  '/analytics',
  '/settings',
  '/academies',
  '/app-studio',
  '/apps',
  '/chat',
  '/developer',
  '/devices',
  '/workflow-studio',
  '/workflows',
  '/documents',
  '/groups',
  '/global-workforce',
  '/headcount',
  '/compliance',
  '/help',
  '/identity',
  '/journeys',
  '/moments',
  '/offboarding',
  '/onboarding',
  '/password-manager',
  '/payslips',
  '/projects',
  '/sandbox',
  '/strategy',
  '/time',
  '/travel',
  '/workers-comp',
  '/marketplace',
  '/mobile',
]

function chunks<T>(items: T[], size: number) {
  const result: T[][] = []
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size))
  return result
}

test.describe('Nordic overhaul route sweep', () => {
  test.describe.configure({ mode: 'serial' })

  let authenticatedStorageState: BrowserContextOptions['storageState']

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await loginByApi(page)
    await gotoRoute(page, '/dashboard')
    authenticatedStorageState = await context.storageState()

    await context.close()
  })

  for (const [index, routes] of chunks(publicRoutes, 6).entries()) {
    test(`public surfaces load cleanly, group ${index + 1}`, async ({ browser }, testInfo) => {
      test.setTimeout(180_000)

      for (const viewport of sweepViewports) {
        const context = await browser.newContext({ viewport })
        const page = await context.newPage()
        const problems = capturePageProblems(page)

        for (const route of routes) {
          await test.step(`${viewport.name} public ${route}`, async () => {
            await gotoRoute(page, route)
            await assertUsableRoute(page, route)
            await screenshotRoute(page, testInfo, 'public', viewport.name, route)
          })
        }

        expect(problems.slice(0, 5), `${viewport.name} public group ${index + 1} should not throw console/page errors`).toEqual([])
        await context.close()
      }
    })
  }

  for (const [index, routes] of chunks(appRoutes, 5).entries()) {
    test(`authenticated app surfaces load cleanly, group ${index + 1}`, async ({ browser }, testInfo) => {
      test.setTimeout(300_000)

      for (const viewport of sweepViewports) {
        const context = await browser.newContext({ viewport, storageState: authenticatedStorageState })
        const page = await context.newPage()
        const problems = capturePageProblems(page)

        for (const route of routes) {
          await test.step(`${viewport.name} app ${route}`, async () => {
            await gotoRoute(page, route)
            await assertUsableRoute(page, route, { authenticated: true })
            await screenshotRoute(page, testInfo, 'app', viewport.name, route)
          })
        }

        expect(problems.slice(0, 5), `${viewport.name} authenticated group ${index + 1} should not throw console/page errors`).toEqual([])
        await context.close()
      }
    })
  }
})
