import { cache } from 'react'

import { compileMDX } from 'next-mdx-remote/rsc'

import { mdxComponents } from '@/components/blog/mdx-components'

type MdxRendererProps = {
  source: string
}

const compileMdx = cache(async (source: string) => {
  return compileMDX({
    source,
    options: {
      parseFrontmatter: false,
    },
    components: mdxComponents,
  })
})

export default async function MdxRenderer({ source }: MdxRendererProps) {
  const safeSource = source.trim()
  if (!safeSource) return null

  const { content } = await compileMdx(safeSource)

  return <div className="prose max-w-none prose-headings:tracking-tight">{content}</div>
}

