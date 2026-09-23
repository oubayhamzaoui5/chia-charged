import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    { message: "Cash on delivery is unavailable. Use secure card checkout." },
    { status: 410, headers: { "Cache-Control": "no-store" } }
  )
}
