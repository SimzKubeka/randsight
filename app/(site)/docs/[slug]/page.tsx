import { notFound } from 'next/navigation'
import { DOCS, renderDoc } from '@/lib/docs.ts'
import { publicMetadata } from '@/lib/site.ts'
import { DocsNav } from '../docs-nav.tsx'
import styles from '../docs.module.css'

type Props = { params: Promise<{ slug: string }> }

// Every page is rendered at build time; anything else is a 404.
export const dynamicParams = false
export const generateStaticParams = () => DOCS.map((d) => ({ slug: d.slug }))

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const doc = DOCS.find((d) => d.slug === slug)
  return doc ? publicMetadata(`/docs/${doc.slug}`, doc.title, doc.description) : {}
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params
  const html = renderDoc(slug)
  if (!html) notFound()

  return (
    <main className={styles.layout}>
      <DocsNav current={slug} />
      <article className={styles.article} dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  )
}
