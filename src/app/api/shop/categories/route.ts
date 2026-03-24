import { NextResponse } from "next/server"

import { getShopCategories } from "@/lib/services/product.service"

function internalError() {
  return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
}

export async function GET() {
  try {
    const categories = await getShopCategories()
    return NextResponse.json({ categories }, { status: 200 })
  } catch {
    return internalError()
  }
}
