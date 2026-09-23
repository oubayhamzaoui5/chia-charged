'use client'

import { useState, type FormEvent } from 'react'
import { saveShippingRateAction } from './actions'
import type { ShippingPolicy } from '@/lib/shipping'

export default function ShippingSettings({ policy }: { policy: ShippingPolicy | null }) {
  const [rate, setRate] = useState(policy ? (policy.rateCents / 100).toFixed(2) : '')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setStatus(null)
    try {
      const result = await saveShippingRateAction(rate)
      if (result.policy) setRate((result.policy.rateCents / 100).toFixed(2))
      setStatus({ ok: result.success, message: result.message })
    } catch {
      setStatus({ ok: false, message: 'Shipping could not be saved. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="shipping-heading">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 id="shipping-heading" className="text-sm font-semibold text-slate-900">US Shipping</h2>
      </div>
      <form onSubmit={submit} className="space-y-4 px-6 py-5">
        <p className="text-sm text-slate-600">One flat rate per order. Delivery is available within the United States only.</p>
        {!policy && <p role="alert" className="text-sm text-red-700">Shipping settings could not be loaded. Please reload this page.</p>}
        <div>
          <label htmlFor="shipping-rate" className="mb-1.5 block text-xs font-semibold text-slate-700">Shipping rate (USD)</label>
          <input id="shipping-rate" type="number" inputMode="decimal" min="0" max="9999.99" step="0.01" required
            value={rate} onChange={event => setRate(event.target.value)} disabled={saving || !policy}
            aria-describedby="shipping-help" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50" />
          <p id="shipping-help" className="mt-2 text-xs text-slate-500">Enter 0 for free shipping. Changes apply to new checkouts; existing orders keep their saved shipping charge.</p>
        </div>
        {status && <p role={status.ok ? 'status' : 'alert'} className={`text-sm ${status.ok ? 'text-emerald-700' : 'text-red-700'}`}>{status.message}</p>}
        <button type="submit" disabled={saving || !policy} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save shipping rate'}
        </button>
      </form>
    </section>
  )
}
