// lib/wishlist.ts
import type PocketBase from "pocketbase"
import type { RecordModel } from "pocketbase"

export type WishlistItem = RecordModel & {
  user: string
  product: string
}

export async function isInWishlist(
  pb: PocketBase,
  userId: string,
  productId: string
): Promise<boolean> {
  try {
    await pb
      .collection("wishlists")
      .getFirstListItem<WishlistItem>(
        `user = "${userId}" && product = "${productId}"`
      )
    return true
  } catch (err: any) {
    if (err?.status === 404) return false
    throw err
  }
}

export async function toggleWishlist(
  pb: PocketBase,
  userId: string,
  productId: string
): Promise<{ inWishlist: boolean }> {
  let existing: WishlistItem | null = null

  try {
    existing = await pb
      .collection("wishlists")
      .getFirstListItem<WishlistItem>(
        `user = "${userId}" && product = "${productId}"`
      )
  } catch (err: any) {
    if (err?.status !== 404) throw err
  }

  if (existing) {
    await pb.collection("wishlists").delete(existing.id)
    return { inWishlist: false }
  }

  await pb.collection("wishlists").create({
    user: userId,
    product: productId,
  })

  return { inWishlist: true }
}
