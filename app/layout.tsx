import type { Metadata, Viewport } from 'next'
import { Source_Sans_3, Source_Serif_4 } from 'next/font/google'
import { SITE_URL } from '@/lib/site.ts'
import { themeScript } from '@/lib/theme.ts'
import './globals.css'

const sans = Source_Sans_3({ subsets: ['latin'], variable: '--font-source-sans', display: 'swap' })
const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-source-serif', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'RandSight · Your money, in hindsight', template: '%s · RandSight' },
  description: 'See what changed from one month to the next, down to the payments that made the difference.',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f7fa' },
    { media: '(prefers-color-scheme: dark)', color: '#0e1116' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The theme script sets data-theme before React loads, so the server markup differs on purpose.
    <html lang="en-ZA" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {/* First stop for keyboard users: past the header and sidebar to the page itself. Every page's <main> has id="main". */}
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  )
}
