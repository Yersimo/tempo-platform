import { expect, test } from '@playwright/test'
import { loginByApi } from './helpers/auth'
import { capturePageProblems } from './helpers/route-sweep'

test.describe('AI command center', () => {
  test('can understand and execute an operational request from the palette', async ({ page }) => {
    const problems = capturePageProblems(page)

    await loginByApi(page)
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    await page.getByRole('button', { name: /open command palette/i }).click()
    await page.getByRole('textbox', { name: /search people/i }).fill('create leave request for tomorrow')

    const palette = page.locator('.command-palette-portal')
    await palette.getByRole('button', { name: /analyze, create, automate/i }).click()
    await expect(page.getByText(/create a leave request for/i)).toBeVisible()

    await page.getByRole('button', { name: /execute in tempo/i }).click()
    await expect(page.getByText(/leave request created for/i)).toBeVisible()
    await expect(page.getByText(/pending approval/i)).toBeVisible()

    expect(problems, problems.join('\n')).toEqual([])
  })
})
