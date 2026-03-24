import type { MetadataRoute } from 'next'

import { getPb } from '@/lib/pb'
import { getAllPublishedPosts } from '@/lib/services/posts.service'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/boutique`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/Nouveautes`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/Promotions`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/Wishlist`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]
  let categories: any[] = []
  let products: any[] = []
  let posts: Array<{ slug: string; updated?: string | Date | null }> = []

  try {
    const pb = getPb()
    ;[categories, products, posts] = await Promise.all([
      pb.collection('categories').getFullList(500, { fields: 'slug,updated' }),
      pb
        .collection('products')
        .getFullList(2000, {
          filter: 'isActive=true && (inView=true || inView=null)',
          fields: 'slug,updated',
        }),
      getAllPublishedPosts(),
    ])
  } catch (error) {
    console.error('Sitemap dynamic data unavailable, serving static routes only.', error)
    return staticRoutes
  }

  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((c: any) => Boolean(c.slug))
    .map((c: any) => ({
      url: `${baseUrl}/boutique/categorie/${c.slug}`,
      lastModified: c.updated ? new Date(c.updated) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

  const productRoutes: MetadataRoute.Sitemap = products
    .filter((p: any) => Boolean(p.slug))
    .map((p: any) => ({
      url: `${baseUrl}/produit/${p.slug}`,
      lastModified: p.updated ? new Date(p.updated) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updated ? new Date(post.updated) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes]
}


