import { describe, expect, it } from 'vitest'
import { DOCS, renderDoc, rewriteLinks } from './docs.ts'

describe('rewriteLinks', () => {
  it('turns links between repository Markdown files into /docs routes', () => {
    expect(rewriteLinks('<a href="./tech-stack.md">x</a>')).toBe('<a href="/docs/tech-stack">x</a>')
    expect(rewriteLinks('<a href="verification.md#results">x</a>')).toBe('<a href="/docs/verification#results">x</a>')
  })

  it('serves diagrams from the docs diagram route', () => {
    expect(rewriteLinks('<img src="diagrams/architecture.svg" alt="d">')).toBe('<img src="/docs/diagrams/architecture.svg" alt="d">')
    expect(rewriteLinks('<a href="diagrams/architecture.svg">')).toBe('<a href="/docs/diagrams/architecture.svg">')
  })

  it('leaves other links alone', () => {
    expect(rewriteLinks('<a href="https://nextjs.org/docs">x</a>')).toBe('<a href="https://nextjs.org/docs">x</a>')
  })
})

describe('renderDoc', () => {
  it('renders every listed document with its own h1', () => {
    for (const doc of DOCS) {
      const html = renderDoc(doc.slug)!
      expect(html.match(/<h1>/g), doc.slug).toHaveLength(1)
      expect(html).not.toMatch(/href="[^"]*\.md/)
    }
  })

  it('makes scrollable code blocks and tables keyboard-focusable', () => {
    const html = renderDoc('tech-stack')!
    expect(html).toContain('<pre tabindex="0">')
    expect(html).toContain('<table tabindex="0">')
  })

  it('refuses anything that is not a listed document', () => {
    expect(renderDoc('../package')).toBeNull()
    expect(renderDoc('README')).toBeNull()
  })
})
