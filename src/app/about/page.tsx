import type { Metadata } from 'next'
import AboutPageContent from './about.client'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://chiacharged.com'

export const metadata: Metadata = {
  title: 'Chia Charged | Our Story — High-Protein Chia Pudding from Tunisia',
  description:
    "From a kitchen experiment to Tunisia's boldest protein snack. Learn how Chia Charged crafted a 22g-protein chia seed pudding with MCT oil, zero junk, and two irresistible flavors.",
  keywords: [
    'chia charged',
    'about chia charged',
    'protein pudding Tunisia',
    'chia seeds protein',
    'plant based protein snack',
    'our story',
    'high protein snack',
    'MCT oil pudding',
    'healthy snack Tunisia',
    'pudding proteine',
  ],
  openGraph: {
    title: 'Chia Charged | Our Story — Fuel Smarter.',
    description:
      "From a kitchen experiment to Tunisia's boldest protein snack. 22g protein, 12g fiber, MCT oil. Zero junk. Two irresistible flavors.",
    url: `${siteUrl}/about`,
    siteName: 'Chia Charged',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chia Charged | Our Story',
    description:
      "From a kitchen experiment to Tunisia's boldest protein snack. 22g protein, MCT oil, zero junk.",
  },
  alternates: {
    canonical: '/about',
  },
}

export default function AboutPage() {
  return <AboutPageContent />
}
