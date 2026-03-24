import { NextRequest, NextResponse } from 'next/server'

import { getProductDetailsBySlug } from '@/lib/services/product.service'

function internalError() {
  return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const data = await getProductDetailsBySlug(slug)

    if (!data) {
      return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch {
    return internalError()
  }
}

