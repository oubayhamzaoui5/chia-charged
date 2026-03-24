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
  | 'pending'
  | 'confirmed'
  | 'delevering'
  | 'delivered'
  | 'cancelled'
  | 'on hold'
  | 'returned'

export type OrderItem = {
  id?: string
  productId?: string
  name?: string
  sku?: string
  unitPrice?: number
  quantity?: number
}

export type OrderRecord = {
  id: string
  created: string
  items: OrderItem[]
  total: number
  currency: string
  status: OrderStatus
  userId: string | null
  user?: UserRecord | null
  isGuest: boolean
  location: string
  userName: string
  address?: string
  city?: string
  phone?: string
  postalCode?: string
  notes?: string
  paymentMode?: string
}
