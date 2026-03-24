import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/server"
import { createServerPb } from "@/lib/pb"

const ADDRESSES_COLLECTION = "adresses"

type AddressPayload = {
  address?: unknown
  adress?: unknown
  city?: unknown
  postalCode?: unknown
  notes?: unknown
  id?: unknown
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function pickAddress(body: AddressPayload) {
  return asText(body.adress ?? body.address)
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const pb = createServerPb()
    pb.authStore.save(session.token, session.user as any)

    const rows = await pb.collection(ADDRESSES_COLLECTION).getFullList(50, {
      filter: `user="${session.user.id}"`,
      sort: "-created",
      requestKey: null,
    })

    const items = rows.map((row: any) => ({
      id: String(row.id),
      address: asText(row.adress ?? row.address),
      city: asText(row.city),
      postalCode: asText(row.postalCode),
      notes: asText(row.notes),
    }))

    return NextResponse.json({ items })
  } catch (error: any) {
    const message = error?.message || "Failed to load addresses"
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as AddressPayload
    const payload = {
      user: session.user.id,
      adress: pickAddress(body),
      city: asText(body.city),
      postalCode: asText(body.postalCode),
      notes: asText(body.notes),
    }

    if (!payload.adress || !payload.city) {
      return NextResponse.json(
        { message: "Address and city are required" },
        { status: 400 }
      )
    }

    const pb = createServerPb()
    pb.authStore.save(session.token, session.user as any)
    const created = await pb.collection(ADDRESSES_COLLECTION).create(payload)

    return NextResponse.json({
      item: {
        id: String(created.id),
        address: asText(created.adress ?? created.address),
        city: asText(created.city),
        postalCode: asText(created.postalCode),
        notes: asText(created.notes),
      },
    })
  } catch (error: any) {
    const message = error?.message || "Failed to create address"
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as AddressPayload
    const id = asText(body.id)
    if (!id) {
      return NextResponse.json({ message: "Address id is required" }, { status: 400 })
    }

    const payload = {
      user: session.user.id,
      adress: pickAddress(body),
      city: asText(body.city),
      postalCode: asText(body.postalCode),
      notes: asText(body.notes),
    }

    if (!payload.adress || !payload.city) {
      return NextResponse.json(
        { message: "Address and city are required" },
        { status: 400 }
      )
    }

    const pb = createServerPb()
    pb.authStore.save(session.token, session.user as any)

    const existing = await pb.collection(ADDRESSES_COLLECTION).getOne(id)
    if (!existing.user || String(existing.user) !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const updated = await pb.collection(ADDRESSES_COLLECTION).update(id, payload)
    return NextResponse.json({
      item: {
        id: String(updated.id),
        address: asText(updated.adress ?? updated.address),
        city: asText(updated.city),
        postalCode: asText(updated.postalCode),
        notes: asText(updated.notes),
      },
    })
  } catch (error: any) {
    const message = error?.message || "Failed to update address"
    return NextResponse.json({ message }, { status: 500 })
  }
}
