import { resolve } from 'node:path'
import { defineConfig, devices } from '@playwright/test'

// Own port so a running dev server on 3000 is never reused by mistake.
const port = 3100
// BASE_URL points the tests at a server that is already running, such as the Docker container.
const external = process.env.BASE_URL
const baseURL = external ?? `http://localhost:${port}`
// Absolute: the standalone server changes directory to .next/standalone.
export const E2E_DATABASE = resolve('data/e2e.db')
export const SITE_URL = 'https://randsight.example'

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  // One Node server serves every browser; more workers just queue sign-ins past the 5 s assertion window.
  workers: process.env.CI ? 2 : 6,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 740 } } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: external
    ? undefined
    : {
        command: 'npm run build && npm start',
        url: baseURL,
        // SITE_URL is baked into canonical URLs and the sitemap at build time.
        env: { PORT: String(port), DATABASE_PATH: E2E_DATABASE, SITE_URL },
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
})
