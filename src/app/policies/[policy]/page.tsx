import { notFound } from 'next/navigation'
import { getStoreSettings } from '@/lib/store-settings.server'
import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'

const pages = {
  shipping: { title: 'Shipping policy', field: 'shippingPolicy' },
  returns: { title: 'Returns and refunds', field: 'returnPolicy' },
  privacy: { title: 'Privacy policy', field: 'privacyPolicy' },
  terms: { title: 'Terms of sale', field: 'terms' },
} as const
export const dynamic = 'force-dynamic'
export default async function PolicyPage({ params }: { params: Promise<{ policy: string }> }) {
  const { policy } = await params
  if (!Object.hasOwn(pages, policy)) notFound()
  const page = pages[policy as keyof typeof pages]
  const settings = await getStoreSettings()
  return <><Navbar /><main className="mx-auto max-w-3xl px-6 py-16 text-slate-900">
    <h1 className="mb-8 text-4xl font-bold">{page.title}</h1>
    <div className="whitespace-pre-wrap break-words leading-relaxed">{settings[page.field] || 'This policy has not been published yet.'}</div>
    <address className="mt-10 whitespace-pre-wrap not-italic">{settings.businessName}{'\n'}{settings.businessAddress}{'\n'}{settings.supportEmail && <a href={`mailto:${settings.supportEmail}`}>{settings.supportEmail}</a>}</address>
  </main><Footer /></>
}
