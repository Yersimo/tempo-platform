import { expect, test } from '@playwright/test'
import { loginByApi } from './helpers/auth'

test.describe('action deep links', () => {
  test('dashboard and learning actions open the promised work surface', async ({ page }) => {
    test.setTimeout(60_000)

    await loginByApi(page)

    await page.goto('/dashboard')
    const requestLeave = page.getByRole('button', { name: /request leave/i }).first()
    await expect(requestLeave).toBeVisible()
    await requestLeave.click()
    await expect(page).toHaveURL(/\/time-attendance\?action=request-leave/)
    await expect(page.getByRole('heading', { name: /request leave/i })).toBeVisible()

    await page.goto('/dashboard')
    await page.getByRole('button', { name: /review \d+ expense report/i }).first().click()
    await expect(page).toHaveURL(/\/expense\?action=review-expenses/)
    await expect(page.getByText(/pending reports are sorted|live approval-route engine/i).first()).toBeVisible()

    await page.goto('/performance?action=reviews')
    await expect(page).toHaveURL(/\/performance\?action=reviews/)
    await expect(page.getByText(/Review cycle command center|Performance Reviews|Launch Review Cycle/i).first()).toBeVisible()

    await page.goto('/learning')
    await expect(page.getByText(/learning mission control/i)).toBeVisible()
    await page.getByRole('button', { name: /^continue$/i }).first().click()
    await expect(page.getByText(/AI Tutor/i).first()).toBeVisible()
    await expect(page.getByText(/Module 1/i).first()).toBeVisible()
  })
})
