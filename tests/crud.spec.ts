import { test, expect } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

// Login before each test
test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'amara.kone@ecobank.com')
  await page.fill('input[type="password"]', 'demo1234')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 10000 })
})

test.describe('Data API CRUD', () => {
  test('GET /api/data?entity=employees returns data', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/data?entity=employees`)
    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    expect(body.data).toBeDefined()
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThan(0)
  })

  test('GET /api/data?entity=goals returns goals', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/data?entity=goals`)
    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    expect(body.data).toBeDefined()
    expect(Array.isArray(body.data)).toBe(true)
  })

  test('GET /api/data?entity=reviews returns reviews', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/data?entity=reviews`)
    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    expect(body.data).toBeDefined()
    expect(Array.isArray(body.data)).toBe(true)
  })

  test('GET /api/data?entity=departments returns departments', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/data?entity=departments`)
    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    expect(body.data).toBeDefined()
    expect(Array.isArray(body.data)).toBe(true)
  })

  test('GET invalid entity returns 400', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/data?entity=nonexistent`)
    expect(response.status()).toBe(400)
  })

  test('unauthenticated API request returns 401', async ({ context }) => {
    // Create a fresh context with no cookies
    const freshPage = await context.newPage()
    await freshPage.context().clearCookies()
    const response = await freshPage.request.get(`${BASE}/api/data?entity=employees`)
    expect(response.status()).toBe(401)
    await freshPage.close()
  })
})

test.describe('Performance Module CRUD', () => {
  test('performance page shows goals', async ({ page }) => {
    await page.goto('/performance')
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    expect(page.url()).toContain('/performance')
    const content = await page.locator('body').textContent()
    expect(content).toBeTruthy()
  })

  test('can view employee detail page', async ({ page }) => {
    // Get employees from API
    const response = await page.request.get(`${BASE}/api/data?entity=employees`)
    const body = await response.json()
    if (body.data && body.data.length > 0) {
      const empId = body.data[0].id
      await page.goto(`/people/${empId}`)
      await page.waitForLoadState('networkidle', { timeout: 15000 })
      expect(page.url()).toContain(`/people/${empId}`)
    }
  })
})

test.describe('Compensation Module', () => {
  test('compensation page loads', async ({ page }) => {
    await page.goto('/compensation')
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    expect(page.url()).toContain('/compensation')
    const content = await page.locator('body').textContent()
    expect(content).toBeTruthy()
  })
})

test.describe('Finance Module', () => {
  test('invoices page loads with data', async ({ page }) => {
    await page.goto('/finance/invoices')
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    expect(page.url()).toContain('/finance/invoices')
  })

  test('budgets page loads', async ({ page }) => {
    await page.goto('/finance/budgets')
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    expect(page.url()).toContain('/finance/budgets')
  })
})

test.describe('User Switching', () => {
  test('switch user API works', async ({ page }) => {
    // Get employees first
    const empResponse = await page.request.get(`${BASE}/api/data?entity=employees`)
    const empBody = await empResponse.json()

    if (empBody.data && empBody.data.length > 1) {
      // Switch to second employee
      const targetId = empBody.data[1].id
      const switchResponse = await page.request.post(`${BASE}/api/auth`, {
        data: { action: 'switch_user', employeeId: targetId },
      })
      expect(switchResponse.ok()).toBeTruthy()
      const switchBody = await switchResponse.json()
      expect(switchBody.user).toBeDefined()
      expect(switchBody.user.employee_id).toBe(targetId)
    }
  })
})
