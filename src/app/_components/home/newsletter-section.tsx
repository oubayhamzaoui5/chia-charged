'use client'

import { FormEvent, useState } from 'react'

import { Button } from '@/components/ui/button'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalized = email.trim().toLowerCase()

    if (!EMAIL_REGEX.test(normalized)) {
      setMessage('Veuillez entrer une adresse email valide.')
      return
    }

    setMessage('Merci. Vous etes inscrit a notre newsletter.')
    setEmail('')
  }

  return (
    <section className="mx-auto max-w-[1280px] px-4 py-12 md:py-16" aria-labelledby="newsletter-title">
      <div className="rounded-3xl border border-foreground/10 bg-gradient-to-r from-foreground/[0.05] via-background to-foreground/[0.03] p-6 sm:p-8 md:p-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="newsletter-title" className="font-serif text-3xl font-semibold tracking-tight">
            Inspirez-vous chaque semaine
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/70 sm:text-base">
            Recevez nos selections de luminaires, idees d amenagement et offres privees.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">
              Email
            </label>
            <input
              id="newsletter-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={120}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value.slice(0, 120))
                setMessage('')
              }}
              placeholder="votre@email.com"
              className="h-11 flex-1 rounded-full border border-foreground/20 bg-background px-4 text-sm"
              required
            />
            <Button type="submit" size="lg" className="h-11 rounded-full px-6">
              S abonner
            </Button>
          </form>

          {message && <p className="mt-3 text-sm text-foreground/75">{message}</p>}
        </div>
      </div>
    </section>
  )
}
