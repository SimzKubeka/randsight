import { defineConfig, devices } from '@playwright/test'

// Own port so a running dev server on 3000 is never reused by mistake.
const port = 3100
const baseURL = `http://localhost:${port}`

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 740 } } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: 'npm run build && npm start',
    url: baseURL,
    env: { PORT: String(port) },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
