import { expect, test } from '@playwright/test'
import { loginAsAdmin } from './helpers'

test('hero image upload updates preview and selected file label', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/admin/email-templates')
  await page.getByRole('button', { name: 'Create Template' }).click()

  await page.route('**/api/admin/uploads/hero-image', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: 'https://example.com/e2e-hero.jpg' }),
    })
  })

  await page.getByLabel(/Name/i).fill('Playwright Hero Template')
  await page.getByLabel(/Subject/i).fill('Hero Upload Test')

  await page.locator('#template-hero-file').setInputFiles({
    name: 'hero.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
  })

  await expect(page.getByText('Hero image uploaded successfully')).toBeVisible()
  await expect(page.getByText('Current image: hero.jpg')).toBeVisible()
  await expect(page.getByAltText('Hero image preview')).toBeVisible()
  await expect(page.getByText('Hero Image URL', { exact: false })).toHaveCount(0)
})
