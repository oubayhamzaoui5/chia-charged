import type { MetadataRoute } from 'next'
import { getPb } from '@/lib/pb'
import { getAppOrigin } from '@/lib/url-policy'
import { getAllPublishedPosts } from '@/lib/services/posts.service'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getAppOrigin()
  const routes: MetadataRoute.Sitemap = ['/', '/about', '/contact', '/blog', '/policies/shipping', '/policies/returns', '/policies/privacy', '/policies/terms'].map(path => ({ url: `${baseUrl}${path}` }))
  const [products, posts] = await Promise.allSettled([
    getPb().collection('products').getFullList<{ slug: string; updated?: string }>({
      filter: 'isActive=true && (inView=true || inView=null)', fields: 'slug,updated',
    }),
    getAllPublishedPosts(),
  ])
  for (const [result, prefix] of [[products, 'product'], [posts, 'blog']] as const) {
    if (result.status === 'rejected') {
      console.error(`Sitemap ${prefix} data unavailable.`)
      continue
    }
    for (const record of result.value) {
      if (!record.slug) continue
      const date = record.updated ? new Date(record.updated) : undefined
      routes.push({ url: `${baseUrl}/${prefix}/${encodeURIComponent(record.slug)}`, ...(date && Number.isFinite(date.getTime()) ? { lastModified: date } : {}) })
    }
  }
  return routes
}
