import { permanentRedirect } from 'next/navigation'

export default async function ShopProductRedirect({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  permanentRedirect(`/product/${slug}`)
}
