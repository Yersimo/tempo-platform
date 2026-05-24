import { expect, type Page, type TestInfo } from '@playwright/test'

export type SweepViewport = {
  name: string
  width: number
  height: number
}

export const sweepViewports: SweepViewport[] = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
]

const ignoredConsolePatterns = [
  /favicon/i,
  /Failed to load resource: the server responded with a status of 404.*favicon/i,
  /Failed to load resource: the server responded with a status of 401 \(Unauthorized\)/i,
  /Failed to load resource: net::ERR_FAILED[\s\S]*\/_next\/static\//i,
  /Failed to load resource: net::ERR_CONNECTION_REFUSED[\s\S]*\/sw\.js/i,
  /A tree hydrated but some attributes of the server rendered HTML didn't match the client properties/i,
  /The resource .* was preloaded using link preload but not used/i,
  /ResizeObserver loop completed/i,
]

export function capturePageProblems(page: Page) {
  const problems: string[] = []

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    const location = msg.location()
    const source = location.url ? ` (${location.url}:${location.lineNumber})` : ''
    const problem = `console: ${text}${source}`
    if (ignoredConsolePatterns.some((pattern) => pattern.test(problem))) return
    problems.push(problem)
  })

  page.on('pageerror', (error) => {
    problems.push(`pageerror: ${error.message}`)
  })

  return problems
}

export async function gotoRoute(page: Page, route: string) {
  let response = null

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 60_000 })
      break
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('net::ERR_ABORTED')) {
        await page.waitForLoadState('domcontentloaded', { timeout: 10_000 }).catch(() => undefined)
        break
      }
      if (attempt === 2) {
        throw new Error(`${route} did not finish initial navigation after retry: ${message}`, { cause: error })
      }
      await page.waitForTimeout(1_000)
    }
  }

  if (response) {
    expect(response.status(), `${route} responded below 500`).toBeLessThan(500)
  }

  await expect(page.locator('body'), `${route} rendered body content`).not.toBeEmpty({ timeout: 10_000 })
  await waitForAppSettled(page)
}

export async function assertUsableRoute(page: Page, route: string, options?: { authenticated?: boolean }) {
  const pathname = new URL(page.url()).pathname
  expect(pathname, `${route} should not render the Next.js not-found route`).not.toBe('/_not-found')
  await expect(page.locator('body')).not.toContainText(/Application error|Unhandled Runtime Error|Internal Server Error/i)

  if (options?.authenticated) {
    expect(pathname, `${route} should stay inside the authenticated app`).not.toMatch(/^\/login|^\/signup/)
  }
}

export async function screenshotRoute(page: Page, testInfo: TestInfo, prefix: string, viewport: string, route: string) {
  if (process.env.ROUTE_SWEEP_SCREENSHOTS !== '1') return

  await page.screenshot({
    path: testInfo.outputPath(`${prefix}-${viewport}-${slugRoute(route)}.png`),
    fullPage: false,
    caret: 'initial',
  })
}

async function waitForAppSettled(page: Page) {
  const skeleton = page.locator('[data-testid="page-skeleton"], [class*="skeleton"], [class*="Skeleton"]')
  await skeleton.first().waitFor({ state: 'hidden', timeout: 1_500 }).catch(() => undefined)
}

function slugRoute(route: string) {
  return route.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'home'
}
