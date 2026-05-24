import { expect, type BrowserContext, type Page } from '@playwright/test'

export const demoUser = {
  email: 'amara.kone@ecobank.com',
  password: 'demo1234',
}

type LoginUser = {
  id?: string
  email?: string
  full_name?: string
  role?: string
  employee_id?: string
}

export async function loginByApi(page: Page, credentials = demoUser): Promise<LoginUser> {
  const response = await page.request.post('/api/auth', {
    headers: {
      'x-tempo-e2e': 'true',
    },
    data: {
      action: 'login',
      email: credentials.email,
      password: credentials.password,
    },
  })

  expect(response.ok(), `API login failed with ${response.status()}: ${await response.text()}`).toBe(true)

  const data = await response.json()
  expect(data.requiresMFA, 'Route sweep demo user should not require MFA').not.toBe(true)
  expect(data.user?.email, 'API login should return the authenticated user').toBe(credentials.email)

  await installCurrentUserCache(page.context(), data.user)

  return data.user
}

export async function installCurrentUserCache(context: BrowserContext, user: LoginUser) {
  await context.addInitScript((currentUser) => {
    window.localStorage.setItem('tempo_current_user', JSON.stringify(currentUser))
  }, user)
}
