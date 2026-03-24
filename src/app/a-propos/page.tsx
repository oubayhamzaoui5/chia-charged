import type { Metadata } from 'next'
import { Playfair_Display } from 'next/font/google'
import Image from 'next/image'
import { Cpu, Leaf, Shield } from 'lucide-react'

import LuxeButton from '@/components/luxe/button'
import LuxeHeader from '@/components/luxe/header'
import Reveal from '@/components/luxe/reveal'
import SectionHeader from '@/components/luxe/section-header'
import { getAboutContent } from '@/lib/services/luxe-content.service'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['500', '600', '700'] })

const valueIcons = [Shield, Leaf, Cpu]

export const metadata: Metadata = {
  title: 'Update Design | A Propos',
  description:
    'Decouvrez l heritage Maison Lumiere: materiaux nobles, artisanat exigeant, curation technique et design interieur.',
}

export default async function AboutPage() {
  const { nav, narrative, values, members } = await getAboutContent()

  return (
    <div className="min-h-screen bg-amber-50 text-stone-950">
      <LuxeHeader items={nav} />

      <main>
        <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6" aria-labelledby="histoire-marque">
          <Reveal>
            <header className="mx-auto max-w-3xl text-center">
              <p className="text-xs uppercase tracking-[0.24em] text-stone-600">Notre Maison</p>
              <h1 id="histoire-marque" className={`${playfair.className} mt-3 text-4xl tracking-tight sm:text-5xl`}>
                L Art de Vivre par la Lumiere.
              </h1>
              <p className="mt-6 text-sm leading-relaxed text-stone-700 sm:text-base">{narrative}</p>
            </header>
          </Reveal>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-20 sm:px-6 lg:grid-cols-2 lg:px-10" aria-label="Savoir faire studio">
          <Reveal>
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
              <Image
                src="/aboutimg.webp"
                alt="Artisan designer en train d ajuster un luminaire"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>

          <Reveal className="flex items-center">
            <article className="space-y-5">
              <h2 className={`${playfair.className} text-4xl`}>Notre Savoir-Faire</h2>
              <p className="text-sm leading-relaxed text-stone-700 sm:text-base">
                Notre curation s appuie sur des criteres techniques stricts: temperature de couleur, indice de rendu
                des couleurs, orientation du faisceau, gradation et coherence avec les volumes. Chaque piece est
                testee en situation pour garantir une ambiance juste, une lecture confortable des matieres et une
                continuite lumineuse entre les zones fonctionnelles et les zones de reception.
              </p>
              <LuxeButton href="/boutique" label="Decouvrir la Boutique" />
            </article>
          </Reveal>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-10" aria-labelledby="valeurs-studio">
          <Reveal>
            <SectionHeader
              id="valeurs-studio"
              eyebrow="Principes"
              title="Valeurs Fondatrices"
              description="Notre studio evolue autour de trois engagements concrets et mesurables."
            />
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {values.map((value, idx) => {
              const Icon = valueIcons[idx]
              return (
                <Reveal key={value.id}>
                  <article className="rounded-2xl border border-stone-900/10 bg-white p-6">
                    <Icon className="h-5 w-5 text-stone-900" aria-hidden="true" />
                    <h3 className={`${playfair.className} mt-4 text-2xl`}>{value.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-stone-700">{value.description}</p>
                  </article>
                </Reveal>
              )
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-10" aria-labelledby="team-studio">
          <Reveal>
            <SectionHeader
              id="team-studio"
              eyebrow="Studio"
              title="Equipe et Direction Artistique"
              description="Un collectif pluridisciplinaire au service de projets residenciels et hoteliers haut de gamme."
            />
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <Reveal key={member.id}>
                <article className="rounded-2xl border border-stone-900/10 bg-white p-4">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-stone-100">
                    <Image
                      src={member.image}
                      alt={`${member.name}, ${member.role}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <h3 className={`${playfair.className} mt-4 text-2xl`}>{member.name}</h3>
                  <p className="text-sm text-stone-700">{member.role}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="border-y border-stone-900/10 bg-white/70 px-4 py-20 sm:px-6" aria-label="Newsletter premium">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className={`${playfair.className} text-4xl`}>Rejoignez notre cercle d inities.</h2>
            <form className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row" aria-label="Inscription newsletter">
              <label htmlFor="newsletter-email" className="sr-only">
                Adresse email
              </label>
              <input
                id="newsletter-email"
                type="email"
                name="email"
                required
                placeholder="Votre adresse email"
                className="h-12 flex-1 rounded-full border border-stone-900/15 bg-white px-5 text-sm text-stone-900 placeholder:text-stone-500 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Valider l inscription newsletter"
                className="h-12 rounded-full bg-stone-950 px-6 text-sm text-amber-50 transition hover:bg-stone-800"
              >
                S inscrire
              </button>
            </form>
          </Reveal>
        </section>
      </main>
    </div>
  )
}

