import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/server"
import { createServerPb } from "@/lib/pb"
import { sendAdminOrderPushNotification } from "@/lib/push/admin-order-push"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

type IncomingOrderItem = {
  productId?: unknown
  name?: unknown
  sku?: unknown
  unitPrice?: unknown
  quantity?: unknown
}

type IncomingOrderPayload = {
  firstName?: unknown
  lastName?: unknown
  email?: unknown
  phone?: unknown
  address?: unknown
  city?: unknown
  postalCode?: unknown
  notes?: unknown
  currency?: unknown
  items?: unknown
  country?: unknown
  state?: unknown
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { allowed } = await rateLimit(`orders:${ip}`, 10, 60 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { message: 'Trop de commandes créées récemment. Réessayez dans 1 heure.' },
      { status: 429 }
    )
  }

  try {
    const body = (await request.json()) as IncomingOrderPayload
    const session = await getSession()
    const user = session?.user ?? null
    const token = session?.token ?? null

    const firstName = asText(body.firstName)
    const lastName = asText(body.lastName)
    const email = asText(body.email)
    const phone = asText(body.phone)
    const address = asText(body.address)
    const city = asText(body.city)
    const postalCode = asText(body.postalCode)
    const notes = asText(body.notes)
    const currency = asText(body.currency) || "USD"
    const country = asText(body.country)
    const state = asText(body.state)

    if (!firstName || !lastName || !address || !city || !country) {
      return NextResponse.json({ message: "Données de commande incomplètes." }, { status: 400 })
    }

    const rawItems = Array.isArray(body.items) ? (body.items as IncomingOrderItem[]) : []
    const parsedItems = rawItems
      .map((item) => ({
        productId: asText(item.productId),
        name: asText(item.name) || "Produit",
        sku: asText(item.sku),
        quantity: Math.max(1, Math.floor(asNumber(item.quantity, 1))),
      }))
      .filter((item) => item.quantity > 0)

    if (parsedItems.length === 0) {
      return NextResponse.json({ message: "Votre panier est vide." }, { status: 400 })
    }

    const pb = createServerPb()
    if (user?.id && token) {
      pb.authStore.save(token, user as any)
    }

    // Fetch real prices from PocketBase — never trust client-sent prices
    const productIds = [...new Set(parsedItems.map((i) => i.productId).filter((id) => /^[a-zA-Z0-9]{15}$/.test(id)))]
    if (productIds.length !== parsedItems.length) {
      return NextResponse.json({ message: "Produit invalide dans le panier." }, { status: 400 })
    }

    const filter = productIds.map((id) => `id = '${id}'`).join(" || ")
    const productRecords = await pb.collection("products").getFullList({
      filter,
      fields: "id,name,sku,price,promoPrice,isActive,inView,stock",
      requestKey: null,
    })

    const productMap = new Map(productRecords.map((p) => [p.id, p]))

    const items = parsedItems.map((item) => {
      const product = productMap.get(item.productId)
      if (!product || product.isActive === false) {
        throw Object.assign(new Error(`Produit indisponible: ${item.productId}`), { status: 400 })
      }
      const serverPrice =
        product.promoPrice != null && Number.isFinite(Number(product.promoPrice)) && Number(product.promoPrice) > 0
          ? Number(product.promoPrice)
          : Number(product.price)
      return {
        productId: item.productId,
        name: item.name || String(product.name) || 'Product',
        sku: item.sku || String(product.sku || ''),
        unitPrice: serverPrice,
        quantity: item.quantity,
      }
    })

    const total = Number(
      items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2)
    )

    const created = await pb.collection("orders").create(
      {
        user: user?.id ?? null,
        isGuest: !user?.id,
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
        postalCode,
        notes,
        country,
        state,
        paymentMode: "cash_on_delivery",
        status: "paid",
        items,
        total,
        currency,
        userName: `${firstName} ${lastName}`.trim(),
        location: `${city}, ${state ? state + ', ' : ''}${country}`.trim(),
      },
      { requestKey: null }
    )

    // Reduce stock for each ordered item
    for (const item of items) {
      const product = productMap.get(item.productId)
      if (product && typeof product.stock === 'number') {
        const newStock = Math.max(0, product.stock - item.quantity)
        await pb.collection('products').update(item.productId, { stock: newStock }, { requestKey: null })
      }
    }

    void sendAdminOrderPushNotification({
      id: String(created.id ?? ''),
      total,
      currency,
      customerName: `${firstName} ${lastName}`.trim() || 'Client',
    })

    return NextResponse.json({ ok: true, orderId: String(created.id ?? "") }, { status: 201 })
  } catch (error: any) {
    const message = error?.message || "Erreur lors de la création de la commande."
    return NextResponse.json({ message }, { status: 500 })
  }
}
