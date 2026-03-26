'use client'

import { useState } from 'react'
import { CheckCircle, AlertCircle, Eye, EyeOff, Key, Trash2, ExternalLink, ShieldCheck } from 'lucide-react'
import { saveKeysAction, deleteKeysAction, saveStripeKeysAction, deleteStripeKeysAction } from './actions'

interface Props {
  googleConfigured: boolean
  googleClientIdMasked: string | null
  stripeConfigured: boolean
  stripePublishableKeyMasked: string | null
}

export default function KeysClient({
  googleConfigured,
  googleClientIdMasked,
  stripeConfigured,
  stripePublishableKeyMasked,
}: Props) {
  // Google OAuth state
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [showGoogleSecret, setShowGoogleSecret] = useState(false)
  const [googleSaving, setGoogleSaving] = useState(false)
  const [googleDeleting, setGoogleDeleting] = useState(false)
  const [googleStatus, setGoogleStatus] = useState<{ type: 'success' | 'warning' | 'error'; msg: string } | null>(null)
  const [isGoogleConfigured, setIsGoogleConfigured] = useState(googleConfigured)
  const [maskedGoogleId, setMaskedGoogleId] = useState(googleClientIdMasked)

  // Stripe state
  const [stripePk, setStripePk] = useState('')
  const [stripeSk, setStripeSk] = useState('')
  const [showStripeSk, setShowStripeSk] = useState(false)
  const [stripeSaving, setStripeSaving] = useState(false)
  const [stripeDeleting, setStripeDeleting] = useState(false)
  const [stripeStatus, setStripeStatus] = useState<{ type: 'success' | 'warning' | 'error'; msg: string } | null>(null)
  const [isStripeConfigured, setIsStripeConfigured] = useState(stripeConfigured)
  const [maskedStripePk, setMaskedStripePk] = useState(stripePublishableKeyMasked)

  async function handleGoogleSave(e: React.FormEvent) {
    e.preventDefault()
    setGoogleStatus(null)
    setGoogleSaving(true)
    try {
      const result = await saveKeysAction(clientId, clientSecret)
      if (result.success) {
        setIsGoogleConfigured(true)
        setClientId('')
        setClientSecret('')
        if (result.error) {
          setGoogleStatus({ type: 'warning', msg: result.error })
        } else {
          setGoogleStatus({ type: 'success', msg: 'Google OAuth keys saved and encrypted successfully.' })
          setMaskedGoogleId(clientId.length > 12 ? `${clientId.slice(0, 8)}••••${clientId.slice(-4)}` : '••••••••••••')
        }
      } else {
        setGoogleStatus({ type: 'error', msg: result.error ?? 'Failed to save keys.' })
      }
    } catch {
      setGoogleStatus({ type: 'error', msg: 'An unexpected error occurred.' })
    } finally {
      setGoogleSaving(false)
    }
  }

  async function handleGoogleDelete() {
    if (!confirm('Remove Google OAuth keys? Users will no longer be able to sign in with Google.')) return
    setGoogleStatus(null)
    setGoogleDeleting(true)
    try {
      const result = await deleteKeysAction()
      if (result.success) {
        setIsGoogleConfigured(false)
        setMaskedGoogleId(null)
        setGoogleStatus({ type: 'success', msg: 'Google OAuth keys removed.' })
      } else {
        setGoogleStatus({ type: 'error', msg: result.error ?? 'Failed to remove keys.' })
      }
    } catch {
      setGoogleStatus({ type: 'error', msg: 'An unexpected error occurred.' })
    } finally {
      setGoogleDeleting(false)
    }
  }

  async function handleStripeSave(e: React.FormEvent) {
    e.preventDefault()
    setStripeStatus(null)
    setStripeSaving(true)
    try {
      const result = await saveStripeKeysAction(stripePk, stripeSk)
      if (result.success) {
        setIsStripeConfigured(true)
        const pk = stripePk.trim()
        setMaskedStripePk(pk.length > 12 ? `${pk.slice(0, 8)}••••${pk.slice(-4)}` : '••••••••••••')
        setStripePk('')
        setStripeSk('')
        setStripeStatus({ type: 'success', msg: 'Stripe keys saved and encrypted successfully.' })
      } else {
        setStripeStatus({ type: 'error', msg: result.error ?? 'Failed to save Stripe keys.' })
      }
    } catch {
      setStripeStatus({ type: 'error', msg: 'An unexpected error occurred.' })
    } finally {
      setStripeSaving(false)
    }
  }

  async function handleStripeDelete() {
    if (!confirm('Remove Stripe keys? Checkout will fall back to test mode.')) return
    setStripeStatus(null)
    setStripeDeleting(true)
    try {
      const result = await deleteStripeKeysAction()
      if (result.success) {
        setIsStripeConfigured(false)
        setMaskedStripePk(null)
        setStripeStatus({ type: 'success', msg: 'Stripe keys removed.' })
      } else {
        setStripeStatus({ type: 'error', msg: result.error ?? 'Failed to remove Stripe keys.' })
      }
    } catch {
      setStripeStatus({ type: 'error', msg: 'An unexpected error occurred.' })
    } finally {
      setStripeDeleting(false)
    }
  }

  const inputCls =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-slate-400 font-mono'

  function StatusBanner({ status }: { status: { type: 'success' | 'warning' | 'error'; msg: string } | null }) {
    if (!status) return null
    return (
      <div
        className={`mb-5 flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${
          status.type === 'success'
            ? 'bg-emerald-50 text-emerald-800'
            : status.type === 'warning'
            ? 'bg-amber-50 text-amber-800'
            : 'bg-red-50 text-red-800'
        }`}
      >
        {status.type === 'success' ? (
          <CheckCircle size={16} className="mt-0.5 shrink-0" />
        ) : (
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
        )}
        <p>{status.msg}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">API Keys</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage OAuth provider credentials. Keys are encrypted at rest and never exposed in git.
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
            <ShieldCheck size={13} />
            AES-256-GCM encrypted
          </div>
        </div>

        {/* Google OAuth card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Google OAuth</p>
                <p className="text-xs text-slate-500">Allow users to sign in with their Google account</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isGoogleConfigured ? (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                  <button
                    onClick={handleGoogleDelete}
                    disabled={googleDeleting}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                    {googleDeleting ? 'Removing...' : 'Remove'}
                  </button>
                </>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  Not configured
                </span>
              )}
            </div>
          </div>

          <div className="px-6 py-5">
            <StatusBanner status={googleStatus} />

            {isGoogleConfigured && maskedGoogleId && (
              <div className="mb-5 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Client ID</p>
                <p className="mt-1 font-mono text-sm text-slate-700">{maskedGoogleId}</p>
              </div>
            )}

            <form onSubmit={handleGoogleSave} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Google Client ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  className={inputCls}
                  placeholder="123456789-abc...apps.googleusercontent.com"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Google Client Secret <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showGoogleSecret ? 'text' : 'password'}
                    required
                    value={clientSecret}
                    onChange={e => setClientSecret(e.target.value)}
                    className={`${inputCls} pr-10`}
                    placeholder="GOCSPX-••••••••••••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGoogleSecret(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition hover:text-slate-600"
                  >
                    {showGoogleSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-violet-600 transition hover:text-violet-800 hover:underline"
                >
                  <ExternalLink size={12} />
                  Google Cloud Console
                </a>

                <button
                  type="submit"
                  disabled={googleSaving}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Key size={14} />
                  {googleSaving ? 'Saving...' : isGoogleConfigured ? 'Update Keys' : 'Save & Enable'}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-b-2xl border-t border-slate-100 bg-slate-50 px-6 py-4">
            <p className="text-xs font-semibold text-slate-500">Setup guide</p>
            <ol className="mt-2 space-y-1 text-xs text-slate-400">
              <li>1. Go to Google Cloud Console → APIs &amp; Services → Credentials</li>
              <li>2. Create an OAuth 2.0 Client ID (Web application)</li>
              <li>
                3. Add{' '}
                <code className="rounded bg-slate-200 px-1 py-0.5 font-mono text-slate-600">
                  {process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/auth/oauth/callback
                </code>{' '}
                as an authorized redirect URI
              </li>
              <li>4. Paste your Client ID and Client Secret above — they will be encrypted before saving</li>
            </ol>
          </div>
        </div>

        {/* Stripe card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-[#635BFF] shadow-sm">
                <span className="text-base font-black text-white" style={{ fontFamily: 'serif', letterSpacing: '-0.05em' }}>S</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Stripe Payments</p>
                <p className="text-xs text-slate-500">Accept card payments via Stripe Checkout</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isStripeConfigured ? (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                  <button
                    onClick={handleStripeDelete}
                    disabled={stripeDeleting}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                    {stripeDeleting ? 'Removing...' : 'Remove'}
                  </button>
                </>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  Not configured
                </span>
              )}
            </div>
          </div>

          <div className="px-6 py-5">
            <StatusBanner status={stripeStatus} />

            {isStripeConfigured && maskedStripePk && (
              <div className="mb-5 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Publishable Key</p>
                <p className="mt-1 font-mono text-sm text-slate-700">{maskedStripePk}</p>
              </div>
            )}

            <form onSubmit={handleStripeSave} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Publishable Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={stripePk}
                  onChange={e => setStripePk(e.target.value)}
                  className={inputCls}
                  placeholder="pk_test_••••••••••••••••••••••••"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Secret Key <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showStripeSk ? 'text' : 'password'}
                    required
                    value={stripeSk}
                    onChange={e => setStripeSk(e.target.value)}
                    className={`${inputCls} pr-10`}
                    placeholder="sk_test_••••••••••••••••••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStripeSk(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition hover:text-slate-600"
                  >
                    {showStripeSk ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <a
                  href="https://dashboard.stripe.com/apikeys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-violet-600 transition hover:text-violet-800 hover:underline"
                >
                  <ExternalLink size={12} />
                  Stripe Dashboard
                </a>

                <button
                  type="submit"
                  disabled={stripeSaving}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#635BFF] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5147e5] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Key size={14} />
                  {stripeSaving ? 'Saving...' : isStripeConfigured ? 'Update Keys' : 'Save & Enable'}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-b-2xl border-t border-slate-100 bg-slate-50 px-6 py-4">
            <p className="text-xs font-semibold text-slate-500">Setup guide</p>
            <ol className="mt-2 space-y-1 text-xs text-slate-400">
              <li>1. Go to dashboard.stripe.com/apikeys</li>
              <li>2. Copy your Publishable Key and Secret Key</li>
              <li>3. For testing, use test mode keys (pk_test_ and sk_test_)</li>
            </ol>
          </div>
        </div>

      </div>
    </div>
  )
}
