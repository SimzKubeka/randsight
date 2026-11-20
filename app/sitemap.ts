import type { MetadataRoute } from 'next'
import { DOCS } from '@/lib/docs.ts'
import { SITE_URL } from '@/lib/site.ts'

// Public, indexable pages only: never the dashboard or sign-in.
export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/docs', ...DOCS.map((d) => `/docs/${d.slug}`)].map((path) => ({ url: new URL(path, SITE_URL).toString() }))
}
