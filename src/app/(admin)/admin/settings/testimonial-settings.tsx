'use client'
import type { SocialProof } from '@/lib/social-proof'

export default function TestimonialSettings({ value, onChange }: { value: SocialProof; onChange: (value: SocialProof) => void }) {
  const input = 'mt-1 w-full rounded-lg border border-slate-300 p-2 text-slate-900'
  function update(id: string, patch: Partial<SocialProof['testimonials'][number]>) {
    onChange({ ...value, testimonials: value.testimonials.map(item => item.id === id ? { ...item, ...patch } : item) })
  }
  return <section className="space-y-4 border-t pt-5">
    <h3 className="font-semibold">Testimonials and ratings</h3>
    <label className="flex gap-2"><input type="checkbox" checked={value.enabled} onChange={e => onChange({ ...value, enabled: e.target.checked })} /> Show testimonial section</label>
    <label className="flex gap-2"><input type="checkbox" checked={value.ratingsEnabled} onChange={e => onChange({ ...value, ratingsEnabled: e.target.checked })} /> Show rating and customer totals</label>
    <label className="block">Average rating (out of 5)<input className={input} type="number" min={0} max={5} step={0.1} required value={value.averageRating} onChange={e => onChange({ ...value, averageRating: Number(e.target.value) })} /></label>
    {(['reviewCount', 'customerCount'] as const).map(key => <label className="block" key={key}>{key === 'reviewCount' ? 'Review count (for example 100+)' : 'Customer count (for example 500+)'}<input className={input} maxLength={30} value={value[key]} onChange={e => onChange({ ...value, [key]: e.target.value })} /></label>)}
    <p className="text-sm text-slate-600">Original content restored. These are manually entered figures, not calculated order statistics. Mark a purchase verified only when checked against an order.</p>
    {value.testimonials.map((item, index) => <fieldset className="space-y-3 rounded-lg border p-4" key={item.id}>
      <legend className="px-1 font-medium">Testimonial {index + 1}</legend>
      <label className="flex gap-2"><input type="checkbox" checked={item.enabled} onChange={e => update(item.id, { enabled: e.target.checked })} /> Show this testimonial</label>
      {(['name', 'role', 'avatar'] as const).map(key => <label className="block" key={key}>{key === 'avatar' ? 'Photo URL (HTTPS or local /image path)' : key === 'name' ? 'Name' : 'Role'}<input className={input} required={key === 'name'} maxLength={key === 'avatar' ? 2000 : 100} value={item[key]} onChange={e => update(item.id, { [key]: e.target.value })} /></label>)}
      <label className="block">Quote<textarea className={input} rows={4} required maxLength={2000} value={item.quote} onChange={e => update(item.id, { quote: e.target.value })} /></label>
      <label className="block">Stars<input className={input} type="number" min={1} max={5} step={1} required value={item.rating} onChange={e => update(item.id, { rating: Number(e.target.value) })} /></label>
      <label className="flex gap-2"><input type="checkbox" checked={item.verified} onChange={e => update(item.id, { verified: e.target.checked })} /> Show verified purchase badge</label>
      <div className="flex gap-4">
        <button type="button" disabled={index === 0} className="underline disabled:opacity-40" onClick={() => { const items = [...value.testimonials]; [items[index - 1], items[index]] = [items[index], items[index - 1]]; onChange({ ...value, testimonials: items }) }}>Move up</button>
        <button type="button" className="text-red-700 underline" onClick={() => onChange({ ...value, testimonials: value.testimonials.filter(row => row.id !== item.id) })}>Remove</button>
      </div>
    </fieldset>)}
    <button type="button" disabled={value.testimonials.length >= 12} className="underline disabled:opacity-40" onClick={() => onChange({ ...value, testimonials: [...value.testimonials, { id: crypto.randomUUID(), name: '', role: '', avatar: '', quote: '', rating: 5, enabled: false, verified: false, rotate: '0.3deg' }] })}>Add testimonial</button>
    <p className="text-sm text-slate-600">Use Save store settings below to publish changes.</p>
  </section>
}
