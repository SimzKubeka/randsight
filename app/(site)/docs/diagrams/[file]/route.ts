import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// Serves the SVG diagrams that docs/*.md reference, so GitHub and /docs show the same files.
const DIR = join(process.cwd(), 'docs', 'diagrams')

export const dynamic = 'force-static'
export const dynamicParams = false
export const generateStaticParams = () => readdirSync(DIR).filter((f) => f.endsWith('.svg')).map((file) => ({ file }))

export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  return new Response(readFileSync(join(DIR, file)), { headers: { 'Content-Type': 'image/svg+xml' } })
}
