import type { Metadata } from 'next'

import Footer from '@/components/footer'
import { Navbar } from '@/components/navbar'
import LandingHero from '@/components/landing/landing-hero'
import LandingStats from '@/components/landing/landing-stats'
import LandingFlavors from '@/components/landing/landing-flavors'
import LandingAbout from '@/components/landing/landing-about'
import LandingBenefits from '@/components/landing/landing-benefits'
import LandingShowcase from '@/components/landing/landing-showcase'
import LandingTestimonials from '@/components/landing/landing-testimonials'
import LandingIngredients from '@/components/landing/landing-ingredients'
import LandingBlog from '@/components/landing/landing-blog'
import { getAllPublishedPosts } from '@/lib/services/posts.service'
import LandingFaq from '@/components/landing/landing-faq'
import LandingContact from '@/components/landing/landing-contact'
import LandingCta from '@/components/landing/landing-cta'

export const dynamic = 'force-dynamic'

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://chiacharged.com'

export const metadata: Metadata = {
  title: 'Chia Charged | Pudding Proteine aux Graines de Chia — 22g Protein, Zero Junk',
  description:
    'Chia Charged: pudding proteine aux graines de chia avec 22g de proteine, 12g de fibre, huile MCT et zero sucre ajoute. Saveurs Fraises & Creme et Chocolat. Livraison rapide en Tunisie.',
  keywords: [
    'chia pudding',
    'protein pudding',
    'pudding proteine',
    'graines de chia',
    'snack proteine',
    'MCT oil',
    'plant based protein',
    'healthy snack',
    'chia charged',
    'Tunisia',
  ],
  openGraph: {
    title: 'Chia Charged — Fuel Smarter. Taste Better.',
    description:
      'High-protein chia seed pudding with 22g protein, 12g fiber, and MCT oil. Two irresistible flavors. Zero junk.',
    url: siteUrl,
    siteName: 'Chia Charged',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chia Charged — Fuel Smarter. Taste Better.',
    description:
      'High-protein chia seed pudding with 22g protein, 12g fiber, and MCT oil. Two irresistible flavors. Zero junk.',
  },
  alternates: {
    canonical: '/',
  },
}

export default async function HomePage() {
  const posts = await getAllPublishedPosts()

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
          style={{ background: "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)" }}
        >
          <LandingHero />
          <LandingStats />
        </div>
        <LandingFlavors />
        <LandingAbout />
                <LandingTestimonials />

        <LandingBenefits />
        <LandingBlog posts={posts} />
        <LandingContact />
        <LandingFaq />
      </main>

      <Footer />
    </div>
  )
}
