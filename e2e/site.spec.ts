import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { SITE_URL } from '../playwright.config.ts'

const PUBLIC = ['/', '/docs', '/docs/architecture', '/docs/tech-stack', '/docs/verification']

test('the landing page answers with a labelled sample and leads to the dashboard', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Your money, in hindsight.' })).toBeVisible()
  await expect(page.getByText('See what changed from one month to the next, down to the payments that made the difference.').first()).toBeVisible()
  await expect(page.getByText('Sample insight')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

  await page.getByRole('link', { name: 'Take me to my dashboard' }).click()
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard/)
})

test('the docs render the repository Markdown with working links and diagram', async ({ page, request }) => {
  await page.goto('/')
  await page.getByRole('main').getByRole('link', { name: "How it's built" }).click()
  await expect(page).toHaveURL('/docs')
  await page.getByRole('link', { name: 'Architecture' }).first().click()
  await expect(page.getByRole('heading', { level: 1, name: 'Architecture' })).toBeVisible()

  const diagram = page.getByRole('img', { name: /RandSight architecture/ })
  await expect(diagram).toBeVisible()
  const svg = await request.get((await diagram.getAttribute('src'))!)
  expect(svg.headers()['content-type']).toContain('image/svg+xml')

  await page.getByRole('main').getByRole('link', { name: 'Verification' }).first().click()
  await expect(page).toHaveURL('/docs/verification')
  await expect(page.getByRole('heading', { level: 1, name: 'Verification' })).toBeVisible()
})

test('public pages have descriptive, canonical, shareable metadata without customer data', async ({ request }) => {
  for (const path of PUBLIC) {
    const html = await (await request.get(path)).text()
    const head = html.slice(0, html.indexOf('</head>'))
    expect(head, path).toMatch(/<title>[^<]{10,}<\/title>/)
    expect(head, path).toMatch(/<meta name="description" content="[^"]{40,}"/)
    // Next writes the home page without a trailing slash; both forms are the same URL.
    const canonical = new URL(path, SITE_URL).toString().replace(/\/$/, '')
    expect(head, path).toContain(`<link rel="canonical" href="${canonical}"`)
    expect(head, path).toContain('<meta property="og:title"')
    expect(head, path).toContain('<meta property="og:image"')
    expect(head, path).toContain('<meta name="twitter:card" content="summary_large_image"')
    expect(head, path).not.toMatch(/noindex/)
    expect(head, path).not.toMatch(/R\d{1,3},\d{3}/) // no amounts in metadata
  }
})

test('robots and sitemap list only public pages', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text()
  expect(robots).toContain('Disallow: /dashboard')
  expect(robots).toContain('Disallow: /sign-in')
  expect(robots).toContain(`Sitemap: ${new URL('/sitemap.xml', SITE_URL)}`)

  const sitemap = await (await request.get('/sitemap.xml')).text()
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname)
  expect(urls.sort()).toEqual([...PUBLIC].sort())

  const image = await request.get('/opengraph-image')
  expect(image.headers()['content-type']).toBe('image/png')
})

test('public pages have no accessibility violations', async ({ page }) => {
  for (const path of PUBLIC) {
    await page.goto(path)
    expect((await new AxeBuilder({ page }).analyze()).violations, path).toEqual([])
  }
})
