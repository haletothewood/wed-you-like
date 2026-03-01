import { expect, test } from '@playwright/test'
import { loginAsAdmin } from './helpers'

test('admin can create an individual invite with plus one', async ({ page }) => {
  await loginAsAdmin(page)

  await page.goto('/admin/invites')
  await page.getByRole('button', { name: 'Create Invite' }).click()

  await page.getByLabel(/Guest Name/i).fill('Solo Guest')
  await page.getByLabel(/^Email/i).fill('solo@example.com')
  await page.getByLabel('Allow Plus One').click()

  await page.getByRole('button', { name: 'Create Individual Invite' }).click()

  const row = page.locator('tr', { hasText: 'Solo Guest' }).first()
  await expect(row).toBeVisible()
  await expect(row.getByText('+1')).toBeVisible()
})
