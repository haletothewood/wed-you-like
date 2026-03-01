import { expect, test } from '@playwright/test'
import { loginAsAdmin } from './helpers'

test('bulk reminder count only includes sent non-responders', async ({ page }) => {
  await loginAsAdmin(page)

  await page.goto('/admin/invites')

  await page.getByLabel('Search').fill('PW Seed')
  await page.getByRole('button', { name: 'Select All Filtered' }).click()

  await expect(page.getByRole('button', { name: 'Send Reminders (1)' })).toBeEnabled()

  await page.getByRole('button', { name: 'Send Reminders (1)' }).click()

  await expect(page.getByRole('heading', { name: 'Send Reminder Emails?' })).toBeVisible()
  await expect(page.getByText("This will send reminder emails to 1 invite(s) that were sent and have not RSVP'd.")).toBeVisible()

  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('heading', { name: 'Send Reminder Emails?' })).not.toBeVisible()
})

test('selection is reconciled after deleting a selected invite', async ({ page }) => {
  await loginAsAdmin(page)

  await page.goto('/admin/invites')
  await page.getByRole('button', { name: 'Create Invite' }).click()

  const guestName = `PW Delete ${Date.now()}`
  await page.getByLabel(/Guest Name/i).fill(guestName)
  await page.getByRole('textbox', { name: 'Email *' }).fill(`pw-delete-${Date.now()}@example.com`)
  await page.getByRole('button', { name: 'Create Individual Invite' }).click()

  const row = page.locator('tr', { hasText: guestName }).first()
  await expect(row).toBeVisible()

  await row.getByRole('checkbox').click()
  await expect(page.getByRole('button', { name: 'Export Selected CSV (1)' })).toBeEnabled()

  await row.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByRole('heading', { name: 'Delete Invite?' })).toBeVisible()
  await page.getByRole('button', { name: 'Delete Invite' }).click()

  await expect(row).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Export Selected CSV (0)' })).toBeDisabled()
})
