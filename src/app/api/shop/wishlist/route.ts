import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { getSession } from '@/lib/auth/server'
import {
  getWishlistProductIds,
  isInWishlist,
  parsePocketBaseId,
  toggleWishlist,
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

    if (productId) {
      const safeProductId = parsePocketBaseId(productId)
      const inWishlist = await isInWishlist(auth, safeProductId)
      return NextResponse.json({ inWishlist }, { status: 200 })
    }

    const productIds = await getWishlistProductIds(auth)
    return NextResponse.json({ productIds }, { status: 200 })
  } catch (error) {
    if (error instanceof ZodError) {
      return badRequest('productId invalide')
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

    const result = await toggleWishlist(auth, productId)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    if (error instanceof ZodError) {
      return badRequest('productId invalide')
    }
    return internalError()
  }
}

