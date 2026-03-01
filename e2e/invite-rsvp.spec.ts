import { expect, test } from '@playwright/test'
import { loginAsAdmin } from './helpers'

test('admin can create a group invite and guest can RSVP from token link', async ({ page }) => {
  await loginAsAdmin(page)

  await page.goto('/admin/invites')
  await page.getByRole('button', { name: 'Create Invite' }).click()
  await page.getByRole('button', { name: 'Group' }).click()

  await page.getByLabel(/Group Name/i).fill('Playwright Family')
  await page.getByPlaceholder('Guest 1 Name').fill('Lead Adult')
  await page.getByPlaceholder('Guest 1 Email').fill('lead@example.com')
  await page.getByPlaceholder('Guest 2 Name').fill('Parent Adult')
  await page.getByPlaceholder('Guest 2 Email').fill('parent@example.com')

  await page.getByRole('button', { name: 'Add Child' }).click()
  await page.getByPlaceholder('Guest 3 Name').fill('Child Guest')

  await page.getByRole('button', { name: 'Create Group Invite' }).click()

  const row = page.locator('tr', { hasText: 'Playwright Family' }).first()
  await expect(row).toBeVisible()

  const rsvpCodeText = await row.locator('code').innerText()
  const token = rsvpCodeText.replace('/rsvp/', '').trim()
  expect(token.length).toBeGreaterThan(10)

  await page.goto(`/rsvp/${token}`)
  await expect(page.getByText('Wedding RSVP')).toBeVisible()
  await page.getByRole('button', { name: /Yes, I.*be there/i }).click()
  await page.getByRole('button', { name: 'Submit RSVP' }).click()

  await expect(page.getByText('Thank You!')).toBeVisible()

  await page.goto(`/rsvp/${token}`)
  await expect(page.getByText('You have already responded to this invitation.')).toBeVisible()
})
