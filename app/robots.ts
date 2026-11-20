import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site.ts'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/dashboard', '/sign-in'] },
    sitemap: new URL('/sitemap.xml', SITE_URL).toString(),
  }
}
