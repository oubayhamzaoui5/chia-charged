'use client'
import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { EMPTY_STORE_SETTINGS, type StoreSettings } from '@/lib/store-settings'
import { saveStoreSettingsAction } from './actions'
import TestimonialSettings from './testimonial-settings'

export default function StoreSettingsForm({ initial }: { initial: StoreSettings | null }) {
  const [form, setForm] = useState(initial ?? EMPTY_STORE_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const queryClient = useQueryClient()
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setMessage('')
    try {
      const result = await saveStoreSettingsAction(form)
      setMessage(result.message)
      if (result.success) await queryClient.invalidateQueries({ queryKey: ['store-settings'] })
    } catch { setMessage('Could not save settings. Please retry.') }
    finally { setSaving(false) }
  }
  const input = 'mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 text-base text-slate-900 focus:outline-2 focus:outline-violet-600'
  return <form onSubmit={save} className="mb-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
    <h2 className="text-lg font-semibold">Store settings</h2>
    <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
      <h3 className="font-semibold">Owner setup checklist</h3>
      <p className="mt-2">Complete business details and policies below. Set the US shipping rate above. In Products, check each flavor’s price, stock, ingredients, allergens and nutrition against its label. Payment credentials belong in Keys.</p>
      <p className="mt-2">Hosting, domain, backups, email delivery and payment webhook setup require your deployment administrator. Saving these fields does not complete launch verification.</p>
      <ul className="mt-3 space-y-1">
        {([['businessName', 'Business name'], ['supportEmail', 'Support email'], ['businessAddress', 'Business address'], ['shippingPolicy', 'Shipping policy'], ['returnPolicy', 'Returns policy'], ['privacyPolicy', 'Privacy policy'], ['terms', 'Terms'], ['storageInstructions', 'Storage instructions'], ['preparationInstructions', 'Preparation instructions']] as const).map(([key, label]) => <li key={key}>{form[key].trim() ? 'Entered' : 'Missing'}: {label}</li>)}
      </ul>
      <p className="mt-2">Checklist reflects this form, including unsaved edits. Entered does not mean reviewed or approved.</p>
    </div>
    {!initial && <p role="alert">Settings unavailable. Apply the database migration before saving.</p>}
    <fieldset disabled={saving || !initial} className="space-y-5 disabled:opacity-60">
      <legend className="font-semibold">First-order discount</legend>
      <div className="space-y-3">
        <h3 className="font-semibold">Social profiles (optional)</h3>
        <p className="text-sm text-slate-600">Enter full HTTPS links. Blank profiles are hidden from the website.</p>
        {(['instagram', 'facebook', 'tiktok'] as const).map(platform => <label className="block capitalize" key={platform}>{platform}
          <input className={input} type="url" maxLength={2048} value={form.socialLinks[platform]} onChange={e => setForm({ ...form, socialLinks: { ...form.socialLinks, [platform]: e.target.value } })} placeholder="https://" />
        </label>)}
      </div>
      <label className="flex items-center gap-3"><input type="checkbox" checked={form.firstOrderDiscountEnabled} onChange={e => setForm({ ...form, firstOrderDiscountEnabled: e.target.checked })} /> Enable first-order discount</label>
      <label className="block">Discount percentage
        <input className={input} type="number" min={1} max={99} step={1} required value={form.firstOrderDiscountPercent} onChange={e => setForm({ ...form, firstOrderDiscountPercent: Number(e.target.value) })} />
      </label>
      <p className="text-sm text-slate-600">Applies automatically to regular-price items on the first paid order for a signed-in, verified account. Does not combine with product promotions. Shipping and tax are excluded. Turning it off hides signup offers; already-open payment sessions retain their quoted price.</p>
      {([
        ['businessName', 'Business name'], ['supportEmail', 'Support email'], ['businessAddress', 'Business address'],
        ['shippingPolicy', 'Shipping policy and delivery times'], ['returnPolicy', 'Return and refund policy'],
        ['privacyPolicy', 'Privacy policy'], ['terms', 'Terms of sale'],
        ['storageInstructions', 'Storage and shelf life — confirmed instructions for all products'],
        ['preparationInstructions', 'Preparation — confirmed instructions for all products'],
      ] as const).map(([key, label]) => <label className="block" key={key}>{label}
        {key === 'businessName' || key === 'supportEmail'
          ? <input className={input} type={key === 'supportEmail' ? 'email' : 'text'} maxLength={key === 'supportEmail' ? 254 : 200} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
          : <textarea className={input} rows={key === 'businessAddress' ? 3 : 6} maxLength={key === 'businessAddress' ? 1000 : key === 'storageInstructions' || key === 'preparationInstructions' ? 2000 : 20000} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />}
      </label>)}
      <p className="text-sm text-slate-600">Blank fields mean setup is incomplete. Text appears publicly as entered. Storage and preparation instructions appear in the homepage FAQ; use only instructions that apply to every current flavor and refer customers to product packaging for differences.</p>
      <TestimonialSettings value={form.socialProof} onChange={socialProof => setForm({ ...form, socialProof })} />
      <label className="flex gap-2"><input type="checkbox" checked={form.analyticsEnabled} onChange={e => setForm({ ...form, analyticsEnabled: e.target.checked })} /> Enable first-party visitor counts</label>
      <p className="text-sm text-slate-600">Off by default. Counts one browser per UTC day, not people or page views. Stores a 90-day browser cookie and retains visit records for 90 days; respects Do Not Track and Global Privacy Control. Complete your privacy/consent review before enabling.</p>
      <button className="rounded-lg bg-violet-700 px-5 py-3 font-semibold text-white disabled:opacity-50" type="submit">{saving ? 'Saving…' : 'Save store settings'}</button>
    </fieldset>
    <p role="status">{message}</p>
  </form>
}
