import { test, expect } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

// Helper: Login via API and set cookie on browser context
async function loginAs(page: import('@playwright/test').Page, email = 'amara.kone@ecobank.com') {
  // Use the credentials API to get the demo password
  const response = await page.request.post(`${BASE}/api/auth`, {
    data: { action: 'login', email, password: 'demo1234' },
  })
  expect(response.ok()).toBeTruthy()
  const body = await response.json()
  expect(body.user).toBeTruthy()
  expect(body.user.email).toBe(email)
  return body.user
}

test.describe('Authentication', () => {
  test('login page renders with form fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'bad@bad.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    // Should show error message
    await expect(page.locator('text=Invalid credentials').or(page.locator('[class*="red"]'))).toBeVisible({ timeout: 5000 })
  })

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'amara.kone@ecobank.com')
    await page.fill('input[type="password"]', 'demo1234')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    expect(page.url()).toContain('/dashboard')
  })

  test('unauthenticated user is redirected to login', async ({ page }) => {
    // Clear all cookies
    await page.context().clearCookies()
    await page.goto('/dashboard')
    await page.waitForURL('**/login**', { timeout: 10000 })
    expect(page.url()).toContain('/login')
  })

  test('login via API sets session cookie', async ({ page }) => {
    await page.goto('/login') // Need to visit domain first for cookies
    const user = await loginAs(page)
    expect(user.role).toBeTruthy()

    // Now navigate to dashboard - session cookie should work
    await page.goto('/dashboard')
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    expect(page.url()).toContain('/dashboard')
  })

  test('logout clears session and redirects to login', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'amara.kone@ecobank.com')
    await page.fill('input[type="password"]', 'demo1234')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard', { timeout: 10000 })

    // Click logout button
    await page.click('button[title="Sign out"]')
    await page.waitForURL('**/login**', { timeout: 10000 })
    expect(page.url()).toContain('/login')
  })

  test('signup page renders with two steps', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.locator('text=Create your account')).toBeVisible()
    await expect(page.locator('input[type="text"]').first()).toBeVisible() // Full Name
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('session persists across page navigation', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'amara.kone@ecobank.com')
    await page.fill('input[type="password"]', 'demo1234')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard', { timeout: 10000 })

    // Navigate to people page
    await page.goto('/people')
    await page.waitForURL('**/people', { timeout: 10000 })
    expect(page.url()).toContain('/people')
    // Should still be logged in (not redirected to login)
  })

  test('credentials API returns demo users', async ({ page }) => {
    const response = await page.request.post(`${BASE}/api/auth`, {
      data: { action: 'credentials' },
    })
    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    expect(body.credentials).toBeDefined()
    expect(body.credentials.length).toBeGreaterThan(0)
    expect(body.credentials[0].email).toBeTruthy()
  })
})
