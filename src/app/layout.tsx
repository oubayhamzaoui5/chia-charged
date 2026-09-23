import type { Metadata } from 'next'
import { Geist, Geist_Mono, Manrope, Fraunces } from 'next/font/google'
import VisitTracker from '@/components/VisitTracker'
import './globals.css'
import Providers from './providers'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const manrope = Manrope({ subsets: ["latin"] });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display", weight: ["400", "700", "900"] });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
const logoIconUrl = '/logow.webp?v=20260325'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Chia Charged',
  description: 'Chia seed pudding mix with whey protein and coconut-derived MCT oil. Contains milk.',
  icons: {
    icon: [
      {
        url: logoIconUrl,
        media: '(prefers-color-scheme: light)',
        type: 'image/webp',
      },
      {
        url: logoIconUrl,
        media: '(prefers-color-scheme: dark)',
        type: 'image/webp',
      },
      {
        url: logoIconUrl,
        type: 'image/webp',
      },
    ],
    apple: logoIconUrl,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${manrope.className} ${fraunces.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <VisitTracker />
        </Providers>

      </body>
    </html>
  )
}
