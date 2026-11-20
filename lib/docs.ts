import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { marked } from 'marked'

// The public engineering docs: Markdown in /docs, read at build time so GitHub and /docs show the same text.
export const DOCS = [
  {
    slug: 'architecture',
    title: 'Architecture',
    description: 'How a request for October’s medical payments travels from the browser to SQLite and back, and why it is built this way.',
  },
  {
    slug: 'tech-stack',
    title: 'Tech stack',
    description: 'The tools RandSight uses, what each one is for, and what was left out on purpose.',
  },
  {
    slug: 'verification',
    title: 'Verification',
    description: 'How RandSight is tested: the commands, what each suite covers, and the latest results.',
  },
] as const

/** Links written for GitHub (./x.md, diagrams/x.svg) become app routes. */
export function rewriteLinks(html: string): string {
  return html
    .replace(/href="(?:\.\/)?([a-z-]+)\.md(#[^"]*)?"/g, (_, slug: string, hash = '') => `href="/docs/${slug}${hash}"`)
    .replace(/(src|href)="(?:\.\/)?diagrams\/([a-z0-9-]+\.svg)"/g, '$1="/docs/diagrams/$2"')
}

/** HTML for a listed document, or null. Content is the repository's own Markdown, so it is trusted. */
export function renderDoc(slug: string): string | null {
  if (!DOCS.some((d) => d.slug === slug)) return null
  const markdown = readFileSync(join(process.cwd(), 'docs', `${slug}.md`), 'utf8')
  // Code blocks and tables can scroll sideways on a phone, so keyboard users must be able to focus them.
  return rewriteLinks(marked.parse(markdown, { async: false })).replace(/<(pre|table)>/g, '<$1 tabindex="0">')
}
