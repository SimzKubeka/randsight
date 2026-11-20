import type { Metadata } from 'next'

/** Public origin for canonical URLs, the sitemap and social previews. Set at build time. */
export const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000'

const IMAGE = { url: '/opengraph-image', width: 1200, height: 630, alt: 'RandSight · Your money, in hindsight.' }

/** Metadata for an indexable public page. Never put customer data here. */
export function publicMetadata(path: string, title: string, description: string, absoluteTitle = false): Metadata {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    // Listed explicitly: a page-level openGraph object replaces the root one, image included.
    openGraph: { type: 'website', siteName: 'RandSight', locale: 'en_ZA', url: path, title, description, images: [IMAGE] },
    twitter: { card: 'summary_large_image', title, description, images: [IMAGE] },
  }
}
