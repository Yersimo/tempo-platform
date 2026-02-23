import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login page loads and shows credentials', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('text=Sign in to tempo')).toBeVisible()
    // Should show demo credentials
    await expect(page.locator('text=demo1234')).toBeVisible({ timeout: 10000 })
  })

  test('can log in with demo credentials', async ({ page }) => {
    await page.goto('/login')
    // Wait for credentials to load
    await page.waitForSelector('text=demo1234', { timeout: 10000 })

    // Fill in email and password
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')

    await emailInput.fill('amara.kone@ecobank.com')
    await passwordInput.fill('demo1234')

    // Submit
    await page.locator('button[type="submit"]').click()

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/login')

    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')

    await emailInput.fill('invalid@test.com')
    await passwordInput.fill('wrongpassword')

    await page.locator('button[type="submit"]').click()

    // Should show error, not redirect
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 5000 })
  })

  test('unauthenticated access redirects to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})
