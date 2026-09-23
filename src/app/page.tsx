import type { Metadata } from 'next'

import LandingTestimonials from '@/components/landing/landing-testimonials'
import Footer from '@/components/footer'
import { Navbar } from '@/components/navbar'
import LandingHero from '@/components/landing/landing-hero'
import LandingStats from '@/components/landing/landing-stats'
import LandingFlavors from '@/components/landing/landing-flavors'
import LandingAbout from '@/components/landing/landing-about'
import LandingBenefits from '@/components/landing/landing-benefits'
import LandingShowcase from '@/components/landing/landing-showcase'
import LandingBlog from '@/components/landing/landing-blog'
import { getAllPublishedPosts } from '@/lib/services/posts.service'
import { getProductDetailsBySlug } from '@/lib/services/product.service'
import LandingFaq from '@/components/landing/landing-faq'
import LandingContact from '@/components/landing/landing-contact'
import LandingCta from '@/components/landing/landing-cta'
import LandingCtaBanner from '@/components/landing/landing-cta-banner'

export const dynamic = 'force-dynamic'

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://chiacharged.com'

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race<T>([
      promise,
      new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => resolve(fallback), timeoutMs)
      }),
    ])
  } catch {
    return fallback
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export const metadata: Metadata = {
  title: 'Chia Charged | Chia Seed Pudding Mix',
  description:
    'Chia seed pudding mix with whey protein and coconut-derived MCT oil. Strawberries & Cream and Chocolate Chips. Contains milk. US delivery only.',
  keywords: [
    'chia pudding',
    'protein pudding',
    'pudding proteine',
    'graines de chia',
    'snack proteine',
    'MCT oil',
    'whey protein',
    'healthy snack',
    'chia charged',
    'United States',
  ],
  openGraph: {
    title: 'Chia Charged — Fuel Smarter. Taste Better.',
    description:
      'Chia seed pudding mix with whey protein and MCT oil. Contains milk. Explore ingredients and nutrition for each flavor.',
    url: siteUrl,
    siteName: 'Chia Charged',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chia Charged — Fuel Smarter. Taste Better.',
    description:
      'Chia seed pudding mix with whey protein and MCT oil. Contains milk. Explore ingredients and nutrition for each flavor.',
  },
  alternates: {
    canonical: '/',
  },
}

export default async function HomePage() {
  const [posts, strawberryData, chocolateData] = await Promise.all([
    withTimeout(getAllPublishedPosts(), 8_000, []),
    withTimeout(getProductDetailsBySlug('strawberries-n-cream-cc-str-4'), 8_000, null),
    withTimeout(getProductDetailsBySlug('chocolate-chip-cc-chklt-4'), 8_000, null),
  ])

  const flavorPriceBySlug: Record<
    string,
    {
      price: number
      basePrice: number
      promoPrice: number | null
      hasPromo: boolean
      currency: string
    }
  > = {}

  const assignPrice = (
    slug: string,
    data: Awaited<ReturnType<typeof getProductDetailsBySlug>>
  ) => {
    const product = data?.product
    if (!product) return
    const hasPromo =
      product.promoPrice != null && product.promoPrice > 0 && product.promoPrice < product.price
    const effectivePrice = hasPromo ? (product.promoPrice as number) : product.price
    flavorPriceBySlug[slug] = {
      price: effectivePrice,
      basePrice: product.price,
      promoPrice: hasPromo ? (product.promoPrice as number) : null,
      hasPromo,
      currency: product.currency || 'USD',
    }
  }

  assignPrice('strawberries-n-cream-cc-str-4', strawberryData)
  assignPrice('chocolate-chip-cc-chklt-4', chocolateData)

  return (
    <div style={{ fontFamily: FONT }}>
      <Navbar reserveSpace />

      <main>
        <style>{`
          .nav-offset-cover {
            padding-top: var(--navbar-offset-mobile, 60px);
            margin-top: calc(-1 * var(--navbar-offset-mobile, 60px));
          }
          @media (min-width: 768px) {
            .nav-offset-cover {
              padding-top: var(--navbar-offset-desktop, 72px);
              margin-top: calc(-1 * var(--navbar-offset-desktop, 72px));
            }
          }
        `}</style>
        <div
          className="nav-offset-cover"
          style={{ background: "linear-gradient(135deg, rgb(68,15,195) 0%, rgb(158,38,182) 50%, rgb(232,68,106) 100%)" }}
        >
          <LandingHero />
          <LandingStats />
        </div>
        <LandingFlavors flavorPriceBySlug={flavorPriceBySlug} />
        <LandingAbout />

        <LandingBenefits />
        <LandingTestimonials />
        <LandingBlog posts={posts} />
        <LandingContact />
        <LandingFaq />
        <LandingCtaBanner />
      </main>

      <Footer />
    </div>
  )
}
