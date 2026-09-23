import type { MetadataRoute } from "next"
import { getAppOrigin } from '@/lib/url-policy'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppOrigin()

  return {
    rules: {
      userAgent: "*",
      disallow: ['/admin', '/api/', '/account', '/orders', '/checkout', '/order-access', '/login', '/register', '/reset-password'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
