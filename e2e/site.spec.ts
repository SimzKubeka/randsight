import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { SITE_URL } from '../playwright.config.ts'

const PUBLIC = ['/', '/docs', '/docs/architecture', '/docs/tech-stack', '/docs/verification']

test('the landing page sells the product with a labelled sample and leads to the dashboard', async ({ page, request }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Your money, in hindsight.' })).toBeVisible()
  await expect(page.getByText('See what changed from one month to the next, down to the payments that made the difference.').first()).toBeVisible()
  await expect(page.getByText(/^Sample insight/)).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: /where did it go/ })).toBeAttached()
  await expect(page.getByRole('link', { name: 'Take me to my dashboard' })).toBeAttached()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

  // Screenshots go through the image optimiser, not straight from /public.
  const hero = page.getByRole('img', { name: /RandSight dashboard for October 2026/ })
  const src = (await hero.getAttribute('src'))!
  expect(src).toContain('/_next/image')
  expect((await request.get(src)).ok()).toBe(true)

  await page.getByRole('link', { name: 'Get started free' }).click()
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard/)
})

test('the docs render the repository Markdown with working links and diagram', async ({ page, request }) => {
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'Docs' }).click()
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
    await expect(page).toHaveTitle(/RandSight/)
    // Let the load sequence finish: mid-fade text has a lower contrast than its resting colour.
    await page.waitForFunction(() =>
      document.getAnimations().every((a) => a.playState !== 'running' || !(a.timeline instanceof DocumentTimeline) || a.effect?.getComputedTiming().iterations === Infinity),
    )
    expect((await new AxeBuilder({ page }).analyze()).violations, path).toEqual([])
  }
})

test('the feature strip loops, pauses on hover and hides its duplicate from screen readers', async ({ page }) => {
  await page.goto('/')
  const features = page.getByRole('list', { name: 'Features' })
  await features.scrollIntoViewIfNeeded()
  await expect(features.getByRole('listitem')).toHaveCount(4)
  await expect(page.locator('ul[aria-hidden="true"] li')).toHaveCount(4)

  const offset = () => features.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41)
  const before = await offset()
  await page.waitForTimeout(400)
  expect(await offset()).toBeLessThan(before)

  // locator.hover() waits for the element to stop moving, which a marquee never does.
  const box = (await features.boundingBox())!
  await page.mouse.move(box.x + 120, box.y + box.height / 2)
  const held = await offset()
  await page.waitForTimeout(400)
  expect(await offset()).toBe(held)
})

test('an unknown address explains itself and offers a way back', async ({ page }) => {
  const res = await page.goto('/no-such-page')
  expect(res?.status()).toBe(404)
  await expect(page).toHaveTitle('Page not found · RandSight')
  await expect(page.getByRole('heading', { level: 1, name: 'We couldn’t find that page' })).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.getByRole('link', { name: 'RandSight home' }).click()
  await expect(page).toHaveURL('/')
})
