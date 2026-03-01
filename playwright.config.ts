import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.PORT || 4011)
const dbPath = process.env.PLAYWRIGHT_DB_PATH || '/tmp/wyl-playwright.sqlite.db'
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: `PLAYWRIGHT_DB_PATH=${dbPath} npm run e2e:prepare-db && TURSO_DATABASE_URL=file:${dbPath} MOCK_EMAIL_DELIVERY=true npm run dev -- -p ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
