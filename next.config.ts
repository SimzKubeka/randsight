import type { NextConfig } from 'next'

const noStore = [{ key: 'Cache-Control', value: 'private, no-store' }]

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  // The dev-only route indicator sat over the sidebar's Sign out button.
  devIndicators: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      // Personalised pages must never enter a shared cache.
      { source: '/dashboard', headers: noStore },
      { source: '/dashboard/:path*', headers: noStore },
      { source: '/sign-in', headers: noStore },
    ]
  },
}

export default nextConfig
