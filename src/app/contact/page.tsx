import type { Metadata } from 'next'
import { Playfair_Display } from 'next/font/google'

import LuxeHeader from '@/components/luxe/header'
import { luxeNav } from '@/lib/mockData'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['600', '700'] })

export const metadata: Metadata = {
  title: 'Update Design | Contact',
  description: 'Contactez notre studio pour un accompagnement en selection de luminaires et design interieur.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-amber-50 text-stone-950">
      <LuxeHeader items={luxeNav} />
      <main className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
        <h1 className={`${playfair.className} text-5xl`}>Contact</h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-stone-700 sm:text-base">
          Ecrivez-nous a studio@maison-lumiere.fr pour une etude de projet residentiel ou hotelier.
        </p>
      </main>
    </div>
  )
}
