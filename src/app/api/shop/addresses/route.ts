import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/server"
import { createServerPb } from "@/lib/pb"
import type { RecordModel } from "pocketbase"

const ADDRESSES_COLLECTION = "adresses"

type AddressPayload = {
  address?: unknown
  adress?: unknown
  address2?: unknown
  city?: unknown
  postalCode?: unknown
  notes?: unknown
  country?: unknown
  state?: unknown
  id?: unknown
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function pickAddress(body: AddressPayload) {
  return asText(body.adress ?? body.address)
}

function validatedAddress(body: AddressPayload) {
  const payload = {
    address: pickAddress(body), address2: asText(body.address2), city: asText(body.city),
    postalCode: asText(body.postalCode), notes: asText(body.notes), country: asText(body.country).toUpperCase(),
    state: asText(body.state).toUpperCase(),
  }
  if (payload.country !== "US") throw new Error("Only United States addresses are supported")
  if (payload.address.length < 2 || payload.address.length > 200 || payload.address2.length > 200) throw new Error("Enter a valid street address")
  if (payload.city.length < 2 || payload.city.length > 100) throw new Error("Enter a valid city")
  if (!/^[A-Z]{2}$/.test(payload.state)) throw new Error("Select a valid US state")
  if (!/^\d{5}(?:-\d{4})?$/.test(payload.postalCode)) throw new Error("Enter a valid US ZIP code")
  if (payload.notes.length > 500) throw new Error("Delivery instructions are too long")
  return payload
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const pb = createServerPb()
    pb.authStore.save(session.token, session.user as unknown as RecordModel)

    const rows = await pb.collection(ADDRESSES_COLLECTION).getFullList(50, {
      filter: `user="${session.user.id}"`,
      sort: "-created",
      requestKey: null,
    })

    const items = rows.map((row: RecordModel) => ({
      id: String(row.id),
      address: asText(row.adress ?? row.address),
      address2: asText(row.address2),
      city: asText(row.city),
      postalCode: asText(row.postalCode),
      notes: asText(row.notes),
      country: asText(row.country),
      state: asText(row.state),
    }))

    return NextResponse.json({ items })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load addresses"
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
    const payload = { user: session.user.id, ...validatedAddress(body) }

    const pb = createServerPb()
    pb.authStore.save(session.token, session.user as unknown as RecordModel)
    const created = await pb.collection(ADDRESSES_COLLECTION).create(payload)

    return NextResponse.json({
      item: {
        id: String(created.id),
        address: asText(created.adress ?? created.address),
        address2: asText(created.address2),
        city: asText(created.city),
        postalCode: asText(created.postalCode),
        notes: asText(created.notes),
        country: asText(created.country),
        state: asText(created.state),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create address"
    return NextResponse.json({ message }, { status: message.startsWith("Failed") ? 500 : 400 })
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

    const payload = { user: session.user.id, ...validatedAddress(body) }

    const pb = createServerPb()
    pb.authStore.save(session.token, session.user as unknown as RecordModel)

    const existing = await pb.collection(ADDRESSES_COLLECTION).getOne(id)
    if (!existing.user || String(existing.user) !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const updated = await pb.collection(ADDRESSES_COLLECTION).update(id, payload)
    return NextResponse.json({
      item: {
        id: String(updated.id),
        address: asText(updated.adress ?? updated.address),
        address2: asText(updated.address2),
        city: asText(updated.city),
        postalCode: asText(updated.postalCode),
        notes: asText(updated.notes),
        country: asText(updated.country),
        state: asText(updated.state),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update address"
    return NextResponse.json({ message }, { status: message.startsWith("Failed") ? 500 : 400 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    const id = asText(request.nextUrl.searchParams.get("id"))
    if (!id) return NextResponse.json({ message: "Address id is required" }, { status: 400 })
    const pb = createServerPb()
    pb.authStore.save(session.token, session.user as unknown as RecordModel)
    const existing = await pb.collection(ADDRESSES_COLLECTION).getOne(id, { fields: "id,user", requestKey: null })
    if (String(existing.user ?? "") !== session.user.id) return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    await pb.collection(ADDRESSES_COLLECTION).delete(id)
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    const status = typeof error === "object" && error !== null && "status" in error ? Number(error.status) : 0
    return NextResponse.json({ message: error instanceof Error ? error.message : "Failed to delete address" }, { status: status === 404 ? 404 : 500 })
  }
}
