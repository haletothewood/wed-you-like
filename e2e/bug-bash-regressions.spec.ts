import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { loginAsAdmin } from './helpers'

const extractTokenFromRow = async (page: Page, rowText: string): Promise<string> => {
  const row = page.locator('tr', { hasText: rowText }).first()
  await expect(row).toBeVisible()
  const rsvpLinkText = await row.locator('a[href*="/rsvp/"]').innerText()
  const token = rsvpLinkText.replace('/rsvp/', '').trim()
  expect(token.length).toBeGreaterThan(10)
  return token
}

test('RSVP excludes stale meal selections for deselected guests', async ({ page }) => {
  await loginAsAdmin(page)

  const runId = Date.now().toString()
  const starterName = `Bug Bash Starter ${runId}`
  const groupName = `Bug Bash Family ${runId}`

  await page.goto('/admin/meal-options')
  await page.locator('#courseType').click()
  await page.getByRole('option', { name: 'Starter' }).click()
  await page.getByLabel('Name').fill(starterName)
  await page.getByRole('button', { name: 'Add Meal Option' }).click()
  await expect(page.getByText(starterName)).toBeVisible()

  await page.goto('/admin/invites')
  await page.getByRole('button', { name: 'Create Invite' }).click()
  await page.getByRole('button', { name: 'Group' }).click()
  await page.getByLabel(/Group Name/i).fill(groupName)
  await page.getByPlaceholder('Guest 1 Name').fill('Lead Adult')
  await page.getByPlaceholder('Guest 1 Email').fill('lead@example.com')
  await page.getByPlaceholder('Guest 2 Name').fill('Parent Adult')
  await page.getByPlaceholder('Guest 2 Email').fill('parent@example.com')
  await page.getByRole('button', { name: 'Create Group Invite' }).click()

  const token = await extractTokenFromRow(page, groupName)

  await page.goto(`/rsvp/${token}`)
  await page.getByRole('button', { name: /Yes, I.*be there/i }).click()

  const mealSelects = page.locator('button[role="combobox"]')
  await mealSelects.nth(0).click()
  await page.getByRole('option', { name: starterName }).click()
  await mealSelects.nth(1).click()
  await page.getByRole('option', { name: starterName }).click()

  await page.getByLabel('Parent Adult').click()
  await page.getByRole('button', { name: 'Submit RSVP' }).click()
  await expect(page.getByText("Thanks, you're all set")).toBeVisible()

  await page.goto('/admin/reports')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /Export Venue Report/ }).click()
  const download = await downloadPromise
  const filePath = await download.path()
  expect(filePath).not.toBeNull()
  const csv = await readFile(filePath as string, 'utf8')

  expect(csv).toContain(`"Lead Adult","Adult","Unassigned","${starterName}","",""`)
  expect(csv).toContain('"Parent Adult","Adult","Unassigned","","",""')
  expect(csv).not.toContain(`"Parent Adult","Adult","Unassigned","${starterName}"`)
})

test('required question validation clears while editing text and single-choice answers', async ({ page }) => {
  await loginAsAdmin(page)

  const runId = Date.now().toString()
  const textQuestion = `Bug Bash Text ${runId}?`
  const singleQuestion = `Bug Bash Single ${runId}?`
  const singleChoiceA = `Choice A ${runId}`
  const singleChoiceB = `Choice B ${runId}`
  const guestName = `Bug Bash Guest ${runId}`

  await page.goto('/admin/custom-questions')

  await page.getByLabel(/Question Text/i).fill(textQuestion)
  await page.getByLabel('Required').click()
  await page.getByRole('button', { name: 'Add Question' }).click()
  await expect(page.getByText(textQuestion)).toBeVisible()

  await page.getByLabel(/Question Text/i).fill(singleQuestion)
  await page.locator('#questionType').click()
  await page.getByRole('option', { name: 'Single Choice' }).click()
  await page.getByPlaceholder('Option 1').fill(singleChoiceA)
  await page.getByPlaceholder('Option 2').fill(singleChoiceB)
  await page.getByLabel('Required').click()
  await page.getByRole('button', { name: 'Add Question' }).click()
  await expect(page.getByText(singleQuestion)).toBeVisible()

  await page.goto('/admin/invites')
  await page.getByRole('button', { name: 'Create Invite' }).click()
  await page.getByLabel(/Guest Name/i).fill(guestName)
  await page.locator('#email').fill(`bug-bash-${runId}@example.com`)
  await page.getByRole('button', { name: 'Create Individual Invite' }).click()

  const token = await extractTokenFromRow(page, guestName)

  await page.goto(`/rsvp/${token}`)
  await page.getByRole('button', { name: /Yes, I.*be there/i }).click()
  const starterCombobox = page.locator('button[role="combobox"]', {
    hasText: 'Select starter',
  })
  if (await starterCombobox.count()) {
    await starterCombobox.first().click()
    await page.getByRole('option').first().click()
  }

  const textQuestionBlock = page.locator('div.space-y-2', { hasText: textQuestion }).first()
  await textQuestionBlock.locator('textarea').fill('   ')
  await page.getByRole('button', { name: 'Submit RSVP' }).click()

  const textError = `Please answer required question: ${textQuestion}`
  const singleError = `Please answer required question: ${singleQuestion}`
  await expect(page.getByText(textError)).toBeVisible()
  await expect(page.getByText(singleError)).toBeVisible()

  await textQuestionBlock.locator('textarea').fill('Brunch in Brighton')
  await expect(page.getByText(textError)).toHaveCount(0)

  const singleQuestionBlock = page.locator('div.space-y-2', { hasText: singleQuestion }).first()
  await singleQuestionBlock.locator('button[role="combobox"]').click()
  await page.getByRole('option', { name: singleChoiceA }).click()
  await expect(page.getByText(singleError)).toHaveCount(0)

  await page.getByRole('button', { name: 'Submit RSVP' }).click()
  await expect(page.getByText("Thanks, you're all set")).toBeVisible()
})

test('export reports shows an error and does not download on API failure', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/admin/reports')

  await page.route('**/api/admin/reports/export-guests', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Forced export failure' }),
    })
  })

  const downloadPromise = page
    .waitForEvent('download', { timeout: 1500 })
    .then(() => true)
    .catch(() => false)

  await page.getByRole('button', { name: /Export Venue Report/ }).click()

  await expect(page.getByText('Export failed')).toBeVisible()
  await expect(page.getByText('Forced export failure')).toBeVisible()
  expect(await downloadPromise).toBe(false)
})
