import { expect, test } from '@playwright/test'

test('redirects unauthenticated users from admin routes', async ({ page }) => {
  await page.goto('/admin/invites')
  await expect(page).toHaveURL('/')
  await expect(page.getByLabel('Email or username')).toBeVisible()
})

test('shows an error for invalid login and succeeds with valid credentials', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Email or username').fill('admin')
  await page.getByLabel('Password').fill('wrong-pass')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByText('Invalid username or password')).toBeVisible()
  await expect(page).toHaveURL('/')

  await page.getByLabel('Password').fill('change-me-immediately')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/admin$/)
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
})
