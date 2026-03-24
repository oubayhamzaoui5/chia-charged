import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { getShopList, parseShopListInput } from '@/lib/services/product.service'

function badRequest(message = 'Requete invalide') {
  return NextResponse.json({ error: message }, { status: 400 })
}

function internalError() {
  return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
}

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries())
    const input = parseShopListInput(params)
    const data = await getShopList(input)
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    if (error instanceof ZodError) {
      return badRequest(error.issues[0]?.message ?? 'Requete invalide')
    }
    return internalError()
  }
}

