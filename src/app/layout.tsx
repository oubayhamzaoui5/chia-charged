import type { Metadata } from 'next'
import { Geist, Geist_Mono, Manrope, Fraunces } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
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
  description: 'High-protein chia seed pudding with MCT oil and 12g fiber. Fuel your day the delicious way.',
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
    <html lang="fr">
      <body suppressHydrationWarning className={`${manrope.className} ${fraunces.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
