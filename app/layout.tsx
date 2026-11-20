import type { Metadata, Viewport } from 'next'
import { Source_Sans_3, Source_Serif_4 } from 'next/font/google'
import { SITE_URL } from '@/lib/site.ts'
import './globals.css'

const sans = Source_Sans_3({ subsets: ['latin'], variable: '--font-source-sans', display: 'swap' })
const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-source-serif', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'RandSight · Your money, in hindsight', template: '%s · RandSight' },
  description: 'See what changed from one month to the next, down to the payments that made the difference.',
}

export const viewport: Viewport = { themeColor: '#f5f7fa' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  )
}
