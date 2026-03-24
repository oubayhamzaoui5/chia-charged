'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, AlertCircle } from 'lucide-react'

export default function ReinitialisationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Chargement...</div>}>
      <ReinitialisationForm />
    </Suspense>
  )
}

function ReinitialisationForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Lien invalide. Veuillez recommencer depuis la page de connexion.')
    }
  }, [token])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== passwordConfirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/confirm-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, passwordConfirm }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.message ?? 'Une erreur est survenue.')
        return
      }
      setDone(true)
      setTimeout(() => router.push('/?auth=login'), 3000)
    } catch {
      setError('Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-foreground/10 bg-white p-8 shadow-lg text-black">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent mb-2">
          Sécurité
        </p>
        <h1 className="text-2xl font-bold tracking-tight mb-1">
          Nouveau mot de passe
        </h1>
        <p className="text-sm text-black/60 mb-6">
          Choisissez un nouveau mot de passe pour votre compte.
        </p>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <p className="font-semibold text-emerald-700">Mot de passe mis à jour !</p>
            <p className="text-sm text-black/60">Vous allez être redirigé vers la connexion…</p>
            <Link
              href="/?auth=login"
              className="mt-2 text-sm font-semibold text-accent hover:opacity-80 transition-opacity"
            >
              Se connecter maintenant
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="reset-password" className="text-sm font-medium">
                  Nouveau mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  id="reset-password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!token}
                  className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-accent disabled:opacity-50"
                  placeholder="Minimum 8 caractères"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reset-password-confirm" className="text-sm font-medium">
                  Confirmer le mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  id="reset-password-confirm"
                  type="password"
                  required
                  minLength={8}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  disabled={!token}
                  className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-accent disabled:opacity-50"
                  placeholder="Répétez le mot de passe"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !token}
                className="h-11 w-full rounded-xl bg-accent text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-black/60">
              <Link href="/?auth=login" className="font-semibold text-accent hover:opacity-80 transition-opacity">
                Retour à la connexion
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
