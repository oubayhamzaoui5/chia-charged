import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { getSession } from '@/lib/auth/server'
import {
  addToCart,
  getCartItems,
  isInCart,
  parsePocketBaseId,
  parseQuantity,
  removeCartItem,
  updateCartItem,
  type AuthContext,
} from '@/lib/services/shop-user.service'

function unauthorized() {
  return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
}

function badRequest(message = 'Requete invalide') {
  return NextResponse.json({ error: message }, { status: 400 })
}

function internalError() {
  return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
}

async function getAuthContext(): Promise<AuthContext | null> {
  const session = await getSession()
  if (!session) return null

  return {
    token: session.token,
    userId: session.user.id,
  }
}

export async function GET(req: NextRequest) {
  const auth = await getAuthContext()
  if (!auth) return unauthorized()

  try {
    const productId = req.nextUrl.searchParams.get('productId')
    if (!productId) {
      const items = await getCartItems(auth)
      return NextResponse.json({ items }, { status: 200 })
    }

    const safeProductId = parsePocketBaseId(productId)
    const inCart = await isInCart(auth, safeProductId)
    return NextResponse.json({ inCart }, { status: 200 })
  } catch (error) {
    if (error instanceof ZodError) {
      return badRequest('productId invalide')
    }
    return internalError()
  }
}

export async function PUT(req: NextRequest) {
  const auth = await getAuthContext()
  if (!auth) return unauthorized()

  try {
    const body = await req.json().catch(() => ({}))
    const rawItemId = typeof body?.itemId === 'string' ? body.itemId : ''
    const itemId = parsePocketBaseId(rawItemId)
    const quantity = parseQuantity(body?.quantity)

    await updateCartItem(auth, itemId, quantity)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error: any) {
    if (error instanceof ZodError) {
      return badRequest('itemId invalide')
    }
    if (error?.status === 403) {
      return NextResponse.json({ error: 'Interdit' }, { status: 403 })
    }
    return internalError()
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await getAuthContext()
  if (!auth) return unauthorized()

  try {
    const itemIdRaw = req.nextUrl.searchParams.get('itemId')
    if (!itemIdRaw) return badRequest('itemId manquant')
    const itemId = parsePocketBaseId(itemIdRaw)
    await removeCartItem(auth, itemId)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error: any) {
    if (error instanceof ZodError) {
      return badRequest('itemId invalide')
    }
    if (error?.status === 403) {
      return NextResponse.json({ error: 'Interdit' }, { status: 403 })
    }
    return internalError()
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAuthContext()
  if (!auth) return unauthorized()

  try {
    const body = await req.json().catch(() => ({}))
    const rawProductId = typeof body?.productId === 'string' ? body.productId : ''
    const productId = parsePocketBaseId(rawProductId)
    const quantity = parseQuantity(body?.quantity)

    await addToCart(auth, productId, quantity)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    if (error instanceof ZodError) {
      return badRequest('productId invalide')
    }
    return internalError()
  }
}
