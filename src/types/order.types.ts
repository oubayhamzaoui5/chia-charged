export type UserRecord = {
  id: string
  surname?: string
  name?: string
  email?: string
  username?: string
  fullName?: string
  verif?: boolean
}

export type OrderStatus =
  | 'on hold'
  | 'delivering'
  | 'delivered'
  | 'cancelled'

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'expired'
  | 'checkout_failed'
  | 'refunded'
  | 'legacy_unverified'

export type OrderItem = {
  id?: string
  productId?: string
  name?: string
  sku?: string
  unitPrice?: number
  quantity?: number
  imageUrl?: string
  count?: string
  flavor?: string
}

export type OrderRecord = {
  id: string
  created: string
  items: OrderItem[]
  total: number
  currency: string
  status: OrderStatus
  fulfillmentStatus: OrderStatus
  paymentStatus: PaymentStatus
  userId: string | null
  user?: UserRecord | null
  isGuest: boolean
  location: string
  userName: string
  firstName?: string
  lastName?: string
  address?: string
  city?: string
  state?: string
  country?: string
  email?: string
  phone?: string
  postalCode?: string
  notes?: string
  paymentMode?: string
  trackingCarrier?: string
  trackingNumber?: string
  shippedAt?: string
  deliveredAt?: string
  refundStatus?: string
  refundedAt?: string
  archivedAt?: string
}
