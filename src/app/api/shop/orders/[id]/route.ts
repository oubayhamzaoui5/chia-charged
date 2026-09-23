import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { createServicePb } from '@/lib/pb-service.server'
import { createServerPb } from '@/lib/pb'
import { hasGuestOrderAccess } from '@/lib/guest-order-access.server'

function productImageUrl(productId: string, filename: string): string {
  const base =
    process.env.NEXT_PUBLIC_PB_URL ??
    process.env.POCKETBASE_URL ??
    'http://127.0.0.1:8090'
  return `${base}/api/files/products/${productId}/${encodeURIComponent(filename)}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id || !/^[a-zA-Z0-9]{15}$/.test(id)) {
    return NextResponse.json({ message: 'Invalid order id.' }, { status: 400 })
  }

  try {
    const session = await getSession()
    const pb = await createServicePb()
    const record = await pb.collection('orders').getOne(id, { requestKey: null })
    const ownsOrder = Boolean(record.user && session?.user?.id === record.user)
    if (!ownsOrder && session?.user?.role !== 'admin' && !hasGuestOrderAccess(request, record)) {
      return NextResponse.json({ message: 'Order not found.' }, { status: 404, headers: { 'Cache-Control': 'private, no-store' } })
    }
    const catalog = createServerPb()

    // Resolve product images for items
    const rawItems = Array.isArray(record.items) ? record.items : []
    const items = await Promise.all(
      rawItems.map(async (item: Record<string, unknown>) => {
        let imageUrl: string | undefined
        const productId = typeof item.productId === 'string' ? item.productId : null
        if (productId) {
          try {
            const product = await catalog.collection('products').getOne(productId, {
              fields: 'id,images',
              requestKey: null,
            })
            const images = Array.isArray(product.images) ? product.images : []
            if (typeof images[0] === 'string') {
              imageUrl = productImageUrl(productId, images[0])
            }
          } catch {
            // ignore
          }
        }
        return {
          productId: productId ?? undefined,
          name: typeof item.name === 'string' ? item.name : 'Produit',
          sku: typeof item.sku === 'string' ? item.sku : undefined,
          unitPrice: Number(item.unitPrice ?? 0),
          quantity: Math.max(1, Number(item.quantity ?? 1)),
          imageUrl,
        }
      })
    )

    return NextResponse.json({
      order: {
        id: String(record.id),
        created: String(record.created ?? ''),
        status: String(record.status ?? 'pending'),
        fulfillmentStatus: String(record.fulfillmentStatus ?? record.status ?? 'on hold'),
        paymentStatus: String(record.paymentStatus ?? 'legacy_unverified'),
        isGuest: Boolean(record.isGuest),
        firstName: String(record.firstName ?? ''),
        lastName: String(record.lastName ?? ''),
        email: String(record.email ?? ''),
        phone: String(record.phone ?? ''),
        address: String(record.address ?? ''),
        city: String(record.city ?? ''),
        postalCode: String(record.postalCode ?? ''),
        country: String(record.country ?? ''),
        state: String(record.state ?? ''),
        shipping: record.shippingPolicyVersion ? Number(record.shippingCents ?? 0) / 100 : null,
        subtotal: record.pricingVersion ? Number(record.subtotalCents ?? 0) / 100 : null,
        discount: record.pricingVersion ? Number(record.discountCents ?? 0) / 100 : null,
        itemsTotal: record.pricingVersion ? Number(record.itemsTotalCents ?? 0) / 100 : null,
        tax: record.pricingVersion ? Number(record.taxCents ?? 0) / 100 : null,
        taxStatus: String(record.taxStatus ?? ''),
        taxProvider: String(record.taxProvider ?? ''),
        pricingVersion: String(record.pricingVersion ?? ''),
        notes: String(record.notes ?? ''),
        paymentMode: String(record.paymentMode ?? 'stripe'),
        total: Number(record.total ?? 0),
        currency: String(record.currency ?? 'USD'),
        items,
      },
    }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error: any) {
    if (error?.status === 404) {
      return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
    }
    return NextResponse.json({ message: 'Failed to fetch order.' }, { status: 500 })
  }
}
