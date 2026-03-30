import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/server"
import { createServerPb } from "@/lib/pb"

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
      address2: asText(row.address2),
      city: asText(row.city),
      postalCode: asText(row.postalCode),
      notes: asText(row.notes),
      country: asText(row.country),
      state: asText(row.state),
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
    const addressValue = pickAddress(body)
    const payload = {
      user: session.user.id,
      address: addressValue,
      address2: asText(body.address2),
      city: asText(body.city),
      postalCode: asText(body.postalCode),
      notes: asText(body.notes),
      country: asText(body.country),
      state: asText(body.state),
    }

    if (!addressValue || !payload.city) {
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
        address2: asText(created.address2),
        city: asText(created.city),
        postalCode: asText(created.postalCode),
        notes: asText(created.notes),
        country: asText(created.country),
        state: asText(created.state),
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

    const addressValue = pickAddress(body)
    const payload = {
      user: session.user.id,
      address: addressValue,
      address2: asText(body.address2),
      city: asText(body.city),
      postalCode: asText(body.postalCode),
      notes: asText(body.notes),
      country: asText(body.country),
      state: asText(body.state),
    }

    if (!addressValue || !payload.city) {
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
        address2: asText(updated.address2),
        city: asText(updated.city),
        postalCode: asText(updated.postalCode),
        notes: asText(updated.notes),
        country: asText(updated.country),
        state: asText(updated.state),
      },
    })
  } catch (error: any) {
    const message = error?.message || "Failed to update address"
    return NextResponse.json({ message }, { status: 500 })
  }
}
