import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { createServerPb } from '@/lib/pb'

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
    const pb = createServerPb()

    if (session?.token) {
      pb.authStore.save(session.token, session.user as any)
    }

    const record = await pb.collection('orders').getOne(id, { requestKey: null })

    // Security: only the owner or a guest can see this (guest order has no user field)
    const recordUser = typeof record.user === 'string' ? record.user : null
    if (recordUser && session?.user?.id !== recordUser && session?.user?.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 403 })
    }

    // Resolve product images for items
    const rawItems = Array.isArray(record.items) ? record.items : []
    const items = await Promise.all(
      rawItems.map(async (item: Record<string, unknown>) => {
        let imageUrl: string | undefined
        const productId = typeof item.productId === 'string' ? item.productId : null
        if (productId) {
          try {
            const product = await pb.collection('products').getOne(productId, {
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
        firstName: String(record.firstName ?? ''),
        lastName: String(record.lastName ?? ''),
        email: String(record.email ?? ''),
        phone: String(record.phone ?? ''),
        address: String(record.address ?? ''),
        city: String(record.city ?? ''),
        postalCode: String(record.postalCode ?? ''),
        notes: String(record.notes ?? ''),
        paymentMode: String(record.paymentMode ?? 'cash_on_delivery'),
        total: Number(record.total ?? 0),
        currency: String(record.currency ?? 'DT'),
        items,
      },
    })
  } catch (error: any) {
    if (error?.status === 404) {
      return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
    }
    return NextResponse.json({ message: 'Failed to fetch order.' }, { status: 500 })
  }
}
