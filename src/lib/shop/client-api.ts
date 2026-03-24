const PB_ID_REGEX = /^[a-zA-Z0-9]{15}$/

function assertProductId(productId: string) {
  if (!PB_ID_REGEX.test(productId)) {
    throw new Error('Invalid product id')
  }
}

export async function fetchWishlistIds(): Promise<string[]> {
  const res = await fetch('/api/shop/wishlist', { method: 'GET', cache: 'no-store' })
  if (!res.ok) return []
  const data = await res.json().catch(() => ({}))
  return Array.isArray(data?.productIds) ? data.productIds : []
}

export async function fetchIsInWishlist(productId: string): Promise<boolean> {
  assertProductId(productId)
  const qs = new URLSearchParams({ productId }).toString()
  const res = await fetch(`/api/shop/wishlist?${qs}`, { method: 'GET', cache: 'no-store' })
  if (!res.ok) return false
  const data = await res.json().catch(() => ({}))
  return Boolean(data?.inWishlist)
}

export async function toggleWishlistForProduct(productId: string): Promise<boolean> {
  assertProductId(productId)
  const res = await fetch('/api/shop/wishlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId }),
  })

  if (!res.ok) {
    throw new Error('Impossible de mettre a jour les favoris')
  }

  const data = await res.json().catch(() => ({}))
  return Boolean(data?.inWishlist)
}

export async function fetchIsInCart(productId: string): Promise<boolean> {
  assertProductId(productId)
  const qs = new URLSearchParams({ productId }).toString()
  const res = await fetch(`/api/shop/cart?${qs}`, { method: 'GET', cache: 'no-store' })
  if (!res.ok) return false
  const data = await res.json().catch(() => ({}))
  return Boolean(data?.inCart)
}

export async function addToCartForUser(productId: string, quantity: number): Promise<void> {
  assertProductId(productId)
  const res = await fetch('/api/shop/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity }),
  })

  if (!res.ok) {
    throw new Error("Impossible d'ajouter au panier")
  }
}

