import { expect, test } from '@playwright/test'
import { loginByApi } from './helpers/auth'

test.describe('action deep links', () => {
  test.beforeEach(async ({ page }) => {
    await loginByApi(page)
  })

  test('dashboard stat cards route to promised work surfaces', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('link', { name: /active goals/i }).click()
    await expect(page).toHaveURL(/\/performance\?action=goals/)

    await page.goto('/dashboard')
    await page.getByRole('link', { name: /pending reviews/i }).click()
    await expect(page).toHaveURL(/\/performance\?action=reviews/)

    await page.goto('/dashboard')
    await page.getByRole('button', { name: /view pay stubs/i }).click()
    await expect(page).toHaveURL(/\/payroll\?action=payslips/)
  })

  test('organization quick actions route to promised work surfaces', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('tab', { name: /organization/i }).click()
    await page.getByRole('button', { name: /submit pto/i }).click()
    await expect(page).toHaveURL(/\/time-attendance\?action=request-leave/)

    await page.goto('/dashboard')
    await page.getByRole('tab', { name: /organization/i }).click()
    await page.getByRole('button', { name: /file expense/i }).click()
    await expect(page).toHaveURL(/\/expense\?action=submit-expense/)

    await page.goto('/dashboard')
    await page.getByRole('tab', { name: /organization/i }).click()
    await page.getByRole('button', { name: /run payroll/i }).click()
    await expect(page).toHaveURL(/\/payroll\?action=run-payroll/)
    await expect(page.getByText(/create pay run|new pay run/i).first()).toBeVisible()
  })

  test('dashboard task actions open exact workflow surfaces', async ({ page }) => {
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
  })

  test('module action urls select the requested surfaces', async ({ page }) => {
    await page.goto('/performance?action=reviews')
    await expect(page).toHaveURL(/\/performance\?action=reviews/)
    await expect(page.getByText(/Review cycle command center|Performance Reviews|Launch Review Cycle/i).first()).toBeVisible()

    await page.goto('/onboarding?action=preboarding')
    await expect(page).toHaveURL(/\/onboarding\?action=preboarding/)
    await expect(page.getByText(/Task Progress|No preboarding tasks|Create Template/i).first()).toBeVisible()

    await page.goto('/onboarding?action=buddy')
    await expect(page).toHaveURL(/\/onboarding\?action=buddy/)
    await expect(page.getByRole('button', { name: /assign buddy/i })).toBeVisible()

    await page.goto('/compensation?action=salary-reviews')
    await expect(page).toHaveURL(/\/compensation\?action=salary-reviews/)
    await expect(page.getByText(/salary review proposals|no salary reviews/i).first()).toBeVisible()

    await page.goto('/payroll?action=payslips')
    await expect(page).toHaveURL(/\/payroll\?action=payslips/)
    await expect(page.getByText(/employee payroll|pay stub|total labor cost/i).first()).toBeVisible()
  })

  test('learning continue opens the course player', async ({ page }) => {
    await page.goto('/learning')
    await expect(page.getByText(/learning mission control/i)).toBeVisible()
    await page.getByRole('button', { name: /^continue$/i }).first().click()
    await expect(page.getByText(/AI Tutor/i).first()).toBeVisible()
    await expect(page.getByText(/Module 1/i).first()).toBeVisible()
  })
})
